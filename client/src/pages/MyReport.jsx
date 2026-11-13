import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { uploadMedia } from '../lib/upload';
import { LETTERS, COLOR_PAIRS, softCard } from '../lib/constants';
import { shortDate } from '../lib/dates';
import { Doodle } from '../components/Doodles';
import { LetterMedia } from '../components/ReportCard';
import VoiceRecorder from '../components/VoiceRecorder';
import {
  Confirm, Icon, Lightbox, Progress, Spinner, thumb, useToast,
} from '../components/ui';

const filledLetter = (l) => Boolean(l && ((l.text && l.text.trim()) || l.photo || l.voice || l.video));

function ColourPicker({ user, setUser }) {
  const [error, setError] = useState('');
  const choose = async (key) => {
    const before = user.colorPair;
    setUser({ ...user, colorPair: key });
    try {
      const res = await api('/auth/me', { method: 'PATCH', body: { colorPair: key } });
      setUser(res.user);
    } catch (err) {
      setUser({ ...user, colorPair: before });
      setError(err.message);
    }
  };
  return (
    <div className="stack" style={{ gap: 6 }}>
      <span className="help">My report colours</span>
      <div className="swatches" role="radiogroup" aria-label="Report colours">
        {Object.entries(COLOR_PAIRS).map(([key, p]) => (
          <button key={key} type="button" role="radio" aria-checked={user.colorPair === key} aria-label={p.name}
            className="swatch" style={{ background: `linear-gradient(135deg, ${p.a} 50%, ${p.b} 50%)` }}
            onClick={() => choose(key)} />
        ))}
      </div>
      {error && <span className="error">{error}</span>}
    </div>
  );
}

function MediaSlot({ kind, value, busy, onPick, onRemove, onZoom }) {
  const input = useRef(null);
  if (value) {
    return (
      <div className="media-item" style={{ width: kind === 'photo' ? 'fit-content' : '100%' }}>
        {kind === 'photo' && (
          <button type="button" className="polaroid tilt-l" onClick={() => onZoom(value.url)} aria-label="Open photo">
            <img src={thumb(value.url, 400)} alt="" style={{ maxWidth: 140, maxHeight: 140 }} />
          </button>
        )}
        {kind === 'voice' && <audio className="audio" controls src={value.url} aria-label="Your voice note" />}
        {kind === 'video' && <video className="video" controls playsInline src={value.url} aria-label="Your video" />}
        <button type="button" className="remove" aria-label={`Remove ${kind}`} onClick={onRemove}>✕</button>
      </div>
    );
  }
  const accept = { photo: 'image/*', voice: 'audio/*', video: 'video/*' }[kind];
  const label = { photo: 'Photo', voice: 'Pick audio file', video: 'Video' }[kind];
  const icon = { photo: 'photo', voice: 'folder', video: 'video' }[kind];
  return (
    <>
      <button type="button" className="media-btn" disabled={busy} onClick={() => input.current.click()}>
        <Icon name={icon} size={18} />{label}
      </button>
      <input ref={input} type="file" accept={accept} hidden onChange={(e) => {
        const f = e.target.files && e.target.files[0];
        e.target.value = '';
        if (f) onPick(f);
      }} />
    </>
  );
}

function useWide() {
  const q = '(min-width: 768px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

export default function MyReport({ user, setUser, group }) {
  const wide = useWide();
  const [week, setWeek] = useState(null);
  const [report, setReport] = useState(null);
  const [texts, setTexts] = useState({});
  const [open, setOpen] = useState(null);
  const [saving, setSaving] = useState('');
  const [uploading, setUploading] = useState(null); // { key, kind, pct }
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [zoom, setZoom] = useState(null);
  const [toast, setToast] = useToast();
  const timers = useRef({});
  const latest = useRef({});

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api(`/groups/${group.id}/reports/me`);
      setWeek(res.week);
      setReport(res.report);
      const t = {};
      LETTERS.forEach((l) => { t[l.key] = (res.report && res.report.letters[l.key] && res.report.letters[l.key].text) || ''; });
      setTexts(t);
      latest.current = t;
    } catch (err) { setError(err.message); }
  }, [group.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (wide && week && !open) {
      const first = LETTERS.find((l) => !filledLetter({ ...((report && report.letters[l.key]) || {}), text: texts[l.key] }));
      setOpen((first || LETTERS[0]).key);
    }
  }, [wide, week]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveLetter = useCallback(async (key, body) => {
    setSaving('Saving…');
    try {
      const res = await api(`/groups/${group.id}/reports/me/letters/${key}`, { method: 'PUT', body });
      setReport(res.report);
      setSaving('Saved');
      return res.report;
    } catch (err) {
      setSaving('');
      setToast(err.message);
      throw err;
    }
  }, [group.id, setToast]);

  // Save text a moment after typing stops
  const flush = useCallback((key) => {
    if (!timers.current[key]) return Promise.resolve();
    clearTimeout(timers.current[key]);
    delete timers.current[key];
    return saveLetter(key, { text: latest.current[key] }).catch(() => {});
  }, [saveLetter]);

  useEffect(() => () => Object.keys(timers.current).forEach(flush), [flush]);

  const onType = (key, value) => {
    setTexts((t) => ({ ...t, [key]: value }));
    latest.current = { ...latest.current, [key]: value };
    setSaving('');
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => {
      delete timers.current[key];
      saveLetter(key, { text: latest.current[key] }).catch(() => {});
    }, 1200);
  };

  const toggle = (key) => {
    if (open) flush(open);
    setOpen(open === key && !wide ? null : key);
  };

  const pick = async (key, kind, file) => {
    setUploading({ key, kind, pct: 0 });
    try {
      const media = await uploadMedia(group.id, kind, file, (pct) => setUploading({ key, kind, pct }));
      await saveLetter(key, { [kind]: media });
    } catch (err) {
      setToast(err.message);
    } finally {
      setUploading(null);
    }
  };

  const remove = (key, kind) => saveLetter(key, { [kind]: null }).catch(() => {});

  const send = async () => {
    setConfirm(false);
    await Promise.all(Object.keys(timers.current).map(flush));
    try {
      const res = await api(`/groups/${group.id}/reports/me/submit`, { method: 'POST' });
      setReport(res.report);
      setToast('Sent! It opens for everyone on Sunday ✦');
    } catch (err) { setToast(err.message); }
  };

  if (error) return <main className="page paper-dots"><div className="center"><p className="sub">{error}</p><button type="button" className="btn primary" onClick={load}>Try again</button></div></main>;
  if (!week) return <main className="page paper-dots"><Spinner /></main>;

  const letters = (report && report.letters) || {};
  // Count with what's on screen, so typing shows progress straight away
  const filled = LETTERS.filter((l) => filledLetter({ ...letters[l.key], text: texts[l.key] })).length;
  const sent = report && report.sent;

  const header = (
    <header className="top" style={{ justifyContent: 'flex-start', gap: 12 }}>
      <a href="#/" className="icon-btn" aria-label="Back to home"><Icon name="back" size={20} /></a>
      <div>
        <h1 style={{ fontSize: 36 }}>My report</h1>
        <span className="sub">week of {shortDate(week.weekStart)}{!sent && week.open ? ' · saved as you go' : ''}</span>
      </div>
    </header>
  );
  const doodles = (
    <>
      <Doodle shape="sparkle" color="blue" size={28} style={{ top: 22, right: 20 }} />
      <Doodle shape="star" color="pink" size={18} style={{ top: 60, right: 52 }} />
      <Doodle shape="heart" color="peach" size={18} style={{ top: 30, right: 80 }} />
      <Doodle shape="spiral" color="lilac" size={24} style={{ top: 360, right: 2 }} />
      <Doodle shape="squiggle" color="pink" size={22} style={{ bottom: 100, left: 16 }} />
    </>
  );

  if (!week.open || sent) {
    return (
      <main className="page paper-dots">
        {doodles}
        {header}
        <div className="banner">
          <strong>{sent ? 'Sent ✓' : 'This week is closed'}</strong>
          <span className="help">{sent ? 'Everyone sees it on Sunday. Sent reports can’t be changed.' : 'The reports are out, go read them on Home. A new week starts Monday.'}</span>
        </div>
        {sent && (
          <div className="report-card" style={softCard(user.colorPair)}>
            {LETTERS.map((l) => (
              <section className="letter-row" key={l.key}>
                <span className="big-letter" aria-hidden="true">{l.letter}</span>
                <div className="letter-body">
                  <span className="letter-label">{l.label}</span>
                  {letters[l.key] && letters[l.key].text && <span style={{ whiteSpace: 'pre-wrap' }}>{letters[l.key].text}</span>}
                  <LetterMedia l={letters[l.key] || {}} onZoom={setZoom} />
                </div>
              </section>
            ))}
          </div>
        )}
        {!sent && <a href="#/" className="btn primary block">Go to Home</a>}
        <Lightbox src={zoom} onClose={() => setZoom(null)} />
        {toast}
      </main>
    );
  }

  const letterView = (l, listOnly) => {
          const data = { ...letters[l.key], text: texts[l.key] };
          const done = filledLetter(data);
          const isUp = uploading && uploading.key === l.key;
          if (open !== l.key || listOnly) {
            const preview = (texts[l.key] || '').trim().slice(0, 40)
              || [data.photo && 'photo', data.voice && 'voice note', data.video && 'video'].filter(Boolean).join(' · ');
            return (
              <button key={l.key} type="button" className={`letter-item ${done ? 'done' : 'todo'}`} aria-current={open === l.key}
                style={{ ...(done ? softCard(user.colorPair) : {}), ...(open === l.key ? { outline: '2px solid var(--navy)' } : {}) }} onClick={() => toggle(l.key)}>
                <span className="big-letter">{l.letter}</span>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span>{l.label}</span>
                  <span className="help" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{done ? preview : 'tap to write'}</span>
                </span>
                {done && <Icon name="check" size={22} stroke={2.2} label="Done" />}
              </button>
            );
          }
          return (
            <section key={l.key} className="letter-open" style={softCard(user.colorPair)} aria-label={l.label}>
              <span className="tape" />
              <button type="button" className="row-between" onClick={() => toggle(l.key)}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="big-letter" style={{ fontSize: 40, width: 'auto' }}>{l.letter}</span>
                  <span style={{ fontSize: 22 }}>{l.label}</span>
                </span>
                <span className="help">close</span>
              </button>
              <textarea className="textarea" rows={3} value={texts[l.key]} placeholder={l.hint} maxLength={2000}
                aria-label={l.label} onChange={(e) => onType(l.key, e.target.value)} onBlur={() => flush(l.key)} />
              <span className="saving" aria-live="polite">{saving}</span>

              <div className="media-row">
                {['photo', 'video'].map((kind) => (
                  <MediaSlot key={kind} kind={kind} value={data[kind]} busy={Boolean(uploading)} onZoom={setZoom}
                    onPick={(f) => pick(l.key, kind, f)} onRemove={() => remove(l.key, kind)} />
                ))}
              </div>
              <div className="media-row">
                {data.voice ? (
                  <MediaSlot kind="voice" value={data.voice} onRemove={() => remove(l.key, 'voice')} onZoom={setZoom} />
                ) : (
                  <>
                    <VoiceRecorder disabled={Boolean(uploading)} onDone={(f) => pick(l.key, 'voice', f)} />
                    <MediaSlot kind="voice" value={null} busy={Boolean(uploading)} onPick={(f) => pick(l.key, 'voice', f)} onZoom={setZoom} />
                  </>
                )}
              </div>
              {isUp && <span className="help" role="status">Uploading {uploading.kind}… {Math.round(uploading.pct * 100)}%</span>}
              <span className="help">1 photo · 1 voice note · 1 video (up to 1 min). All optional.</span>
            </section>
          );
  };

  return (
    <main className="page paper-dots">
      {doodles}
      {header}
      <div className={wide ? 'split' : 'stack'}>
      <div className={wide ? 'stack sticky' : 'stack'}>
        <ColourPicker user={user} setUser={setUser} />

        <div className="stack" style={{ gap: 6 }}>
          <div className="row-between" style={{ fontSize: 17 }}>
            <span>{filled} of 6 letters done</span>
            <span className="help">due Saturday {shortDate(week.deadline)}</span>
          </div>
          <Progress filled={filled} />
        </div>

        {LETTERS.map((l) => letterView(l, wide))}

        <button type="button" className="btn primary block" style={{ height: 56, fontSize: 22 }}
          onClick={() => (filled < 6 ? setToast(`Fill all 6 letters to send (${filled} of 6 done)`) : setConfirm(true))}>
          Send my report
        </button>
        <span className="help" style={{ textAlign: 'center' }}>Fill all 6 letters to send · everyone's reports open on Sunday</span>
      </div>
      {wide && (
        <div>
          {open ? letterView(LETTERS.find((x) => x.key === open), false)
            : <div className="box center" style={{ minHeight: 300 }}><p className="sub">Pick a letter on the left to start writing</p></div>}
        </div>
      )}
      </div>

      {confirm && (
        <Confirm title="Send your report?" text="Once it's sent you can't edit it. It opens for everyone on Sunday."
          yes="Send it" onYes={send} onNo={() => setConfirm(false)} />
      )}
      <Lightbox src={zoom} onClose={() => setZoom(null)} />
      {toast}
    </main>
  );
}
