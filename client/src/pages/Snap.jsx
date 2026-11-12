import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { uploadMedia } from '../lib/upload';
import { pair } from '../lib/constants';
import {
  addDays, dayName, monthGrid, monthLabel, shiftMonth, shortDate, timeOf,
} from '../lib/dates';
import { Doodle } from '../components/Doodles';
import {
  Avatar, Icon, Lightbox, Spinner, thumb, useToast,
} from '../components/ui';

const MAX_DAYS_BACK = 60;

export default function Snap({ user, group }) {
  const [month, setMonth] = useState(null);
  const [data, setData] = useState(null);
  const [today, setToday] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(null);
  const [pending, setPending] = useState(null); // { file, preview, caption }
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useToast();
  const fileInput = useRef(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api(`/groups/${group.id}/snaps${month ? `?month=${month}` : ''}`);
      setData(res);
      setToday(res.today);
      if (!month) setMonth(res.month);
      setSelected((s) => s || res.today);
    } catch (err) { setError(err.message); }
  }, [group.id, month]);

  useEffect(() => { load(); }, [load]);

  if (error) return <main className="page paper-grid"><div className="center"><p className="sub">{error}</p><button type="button" className="btn primary" onClick={load}>Try again</button></div></main>;
  if (!data) return <main className="page paper-grid"><Spinner /></main>;

  const byDay = new Map();
  data.snaps.forEach((s) => {
    if (!byDay.has(s.date)) byDay.set(s.date, []);
    byDay.get(s.date).push(s);
  });
  const members = group.members;
  const memberById = new Map(members.map((m) => [String(m.id), m]));
  const daySnaps = byDay.get(selected) || [];
  const mySnap = daySnaps.find((s) => String(s.user) === String(user.id));
  const canAdd = selected <= today && selected >= addDays(today, -MAX_DAYS_BACK);
  const isToday = selected === today;
  const thisMonth = today.slice(0, 7);

  const choose = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (f) setPending({ file: f, preview: URL.createObjectURL(f), caption: (mySnap && mySnap.caption) || '' });
  };

  const post = async () => {
    setBusy(true);
    try {
      const photo = await uploadMedia(group.id, 'photo', pending.file);
      await api(`/groups/${group.id}/snaps/${selected}`, { method: 'PUT', body: { photo, caption: pending.caption } });
      URL.revokeObjectURL(pending.preview);
      setPending(null);
      setToast('Snap added 📸');
      load();
    } catch (err) { setToast(err.message); } finally { setBusy(false); }
  };

  const del = async () => {
    try {
      await api(`/groups/${group.id}/snaps/${selected}`, { method: 'DELETE' });
      load();
    } catch (err) { setToast(err.message); }
  };

  const nudge = async (m) => {
    try {
      await api(`/groups/${group.id}/nudges`, { method: 'POST', body: { to: m.id, kind: 'snap' } });
      setToast(`Nudged ${m.name} 👉`);
    } catch (err) { setToast(err.message); }
  };

  // Me first, then everyone else
  const ordered = [...members].sort((a, b) => (String(a.id) === String(user.id) ? -1 : String(b.id) === String(user.id) ? 1 : 0));

  return (
    <main className="page paper-grid">
      <Doodle shape="sparkle" color="pink" size={34} style={{ top: 20, right: 24 }} />
      <Doodle shape="star" color="mint" size={20} style={{ top: 64, right: 66 }} />
      <Doodle shape="heart" color="peach" size={18} style={{ top: 30, right: 110 }} />
      <Doodle shape="spiral" color="pink" size={24} style={{ top: 620, right: 2 }} />
      <Doodle shape="bubble" color="lilac" size={40} style={{ bottom: 120, left: 4 }} />

      <header style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 44 }}>Daily snap</h1>
        <span className="sub">one photo a day, from each of us</span>
      </header>

      <section className="calendar stack" style={{ gap: 10 }} aria-label="Calendar">
        <div className="cal-head">
          <button type="button" className="icon-btn" style={{ border: 'none', background: 'transparent' }} aria-label="Previous month"
            onClick={() => { setData(null); setMonth(shiftMonth(month, -1)); }}><Icon name="back" size={20} /></button>
          <h2 style={{ fontSize: 30 }}>{monthLabel(month)}</h2>
          <button type="button" className="icon-btn" style={{ border: 'none', background: 'transparent', opacity: month >= thisMonth ? 0.3 : 1 }}
            aria-label="Next month" disabled={month >= thisMonth}
            onClick={() => { setData(null); setMonth(shiftMonth(month, 1)); }}><Icon name="next" size={20} /></button>
        </div>
        <div className="cal-grid">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="cal-dow">{d}</span>)}</div>
        <div className="cal-grid">
          {monthGrid(month).map((day, i) => {
            if (!day) return <span key={`b${i}`} />;
            const future = day > today;
            const posted = new Set((byDay.get(day) || []).map((s) => String(s.user)));
            return (
              <button key={day} type="button" disabled={future}
                className={`day${future ? ' future' : ''}${day === selected ? ' selected' : ''}`}
                aria-label={`${shortDate(day)}, ${posted.size} of ${members.length} posted`}
                aria-pressed={day === selected} onClick={() => setSelected(day)}>
                <span>{Number(day.slice(8))}</span>
                {!future && (
                  <span className="dots">
                    {members.map((m) => (
                      <i key={m.id} style={{ background: posted.has(String(m.id)) ? pair(m.colorPair).dot : (day === selected ? 'rgba(255,255,255,0.35)' : '#E4DED1') }} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 15, color: 'var(--ink-2)' }}>
          {members.map((m) => (
            <span key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <i style={{ width: 9, height: 9, borderRadius: 5, background: pair(m.colorPair).dot, display: 'block' }} />
              {String(m.id) === String(user.id) ? 'You' : m.name}
            </span>
          ))}
        </div>
      </section>

      <div className="row-between" style={{ margin: '18px 0 12px', alignItems: 'baseline' }}>
        <h2 style={{ fontSize: 32 }}>{isToday ? 'Today' : dayName(selected)} · {shortDate(selected)}</h2>
        <span className="help">{daySnaps.length} of {members.length}</span>
      </div>

      <div className="snaps">
        {ordered.map((m, i) => {
          const isMe = String(m.id) === String(user.id);
          const s = daySnaps.find((x) => String(x.user) === String(m.id));
          const tilt = { transform: `rotate(${i % 2 ? 2 : -2}deg)` };
          if (s) {
            return (
              <figure key={m.id} className="snap" style={tilt}>
                <img src={thumb(s.photo.url, 500)} alt={`${isMe ? 'Your' : `${m.name}'s`} snap`} onClick={() => setZoom(s.photo.url)} />
                <figcaption>
                  <span className="row-between"><span>{isMe ? 'You' : m.name}</span><span className="help">{s.date === today ? timeOf(s.createdAt || s.updatedAt || new Date()) : ''}</span></span>
                  {s.caption && <span className="help">{s.caption}</span>}
                  {isMe && (
                    <span style={{ display: 'flex', gap: 10 }}>
                      <button type="button" className="link-btn" style={{ fontSize: 15 }} onClick={() => fileInput.current.click()}>Replace</button>
                      <button type="button" className="link-btn danger" style={{ fontSize: 15 }} onClick={del}>Delete</button>
                    </span>
                  )}
                </figcaption>
              </figure>
            );
          }
          if (isMe && canAdd) {
            return (
              <button key={m.id} type="button" className="snap-add" style={tilt} onClick={() => fileInput.current.click()}>
                <Icon name="camera" size={34} stroke={1.6} />
                <span>{isToday ? "Add today's photo" : 'Add a photo for this day'}</span>
              </button>
            );
          }
          return (
            <div key={m.id} className="snap-empty" style={tilt}>
              <Avatar name={m.name} colorPair={m.colorPair} me={isMe} />
              <span>{isMe ? 'You' : m.name}</span>
              <span>{isToday ? 'not yet today' : 'no photo'}</span>
              {isToday && !isMe && <button type="button" className="btn small" onClick={() => nudge(m)}>Nudge 👉</button>}
            </div>
          );
        })}
      </div>

      <p className="help" style={{ textAlign: 'center', marginTop: 16 }}>
        Tap any day to see that day's photos. Missed a day? Tap it and add one from your gallery.
      </p>

      <input ref={fileInput} type="file" accept="image/*" hidden onChange={choose} />

      {pending && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="New snap">
          <div className="dialog">
            <h2 style={{ fontSize: 30 }}>{isToday ? "Today's snap" : `Snap for ${shortDate(selected)}`}</h2>
            <img src={pending.preview} alt="Preview" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8 }} />
            <div className="field">
              <label htmlFor="cap">Caption (optional)</label>
              <input id="cap" className="input" maxLength={200} value={pending.caption}
                onChange={(e) => setPending({ ...pending, caption: e.target.value })} placeholder="what's happening?" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn" style={{ flex: 1 }} disabled={busy}
                onClick={() => { URL.revokeObjectURL(pending.preview); setPending(null); }}>Cancel</button>
              <button type="button" className="btn primary" style={{ flex: 1 }} disabled={busy} onClick={post}>{busy ? 'Posting…' : 'Post'}</button>
            </div>
          </div>
        </div>
      )}
      <Lightbox src={zoom} onClose={() => setZoom(null)} />
      {toast}
    </main>
  );
}
