import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { addDays, daysBetween, dayName, shortDate } from '../lib/dates';
import { softCard } from '../lib/constants';
import { pushSupported, currentSubscription, turnOnNotifications } from '../lib/push';
import Doodles from '../components/Doodles';
import ReportCard from '../components/ReportCard';
import {
  Avatar, Icon, Lightbox, Progress, Spinner, useToast,
} from '../components/ui';

function Header({ user, group, groups, setGroupId }) {
  return (
    <header className="top">
      <div style={{ minWidth: 0 }}>
        <h1 className="title">The Report</h1>
        {groups.length > 1 ? (
          <select aria-label="Switch group" value={group.id} onChange={(e) => setGroupId(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: 17, color: 'var(--ink-2)', padding: 0, maxWidth: '100%' }}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        ) : <span className="sub">{group.name}</span>}
      </div>
      <a href="#/me" className="icon-btn me-btn" aria-label="Me" style={{ padding: 0, border: 'none' }}>
        <Avatar name={user.name} colorPair={user.colorPair} me size={44} />
      </a>
    </header>
  );
}

function NotifyPrompt() {
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let on = true;
    if (!pushSupported() || Notification.permission === 'denied') return undefined;
    currentSubscription().then((s) => { if (on && !s) setShow(true); }).catch(() => {});
    return () => { on = false; };
  }, []);
  if (!show) return null;
  const enable = async () => {
    try { await turnOnNotifications(); setShow(false); } catch (err) { setError(err.message); }
  };
  return (
    <div className="banner" style={{ borderColor: '#6E9BD0' }}>
      <strong>Turn on reminders?</strong>
      <span className="help">Saturday deadline, daily snap and nudges from friends</span>
      {error && <span className="error">{error}</span>}
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button type="button" className="btn small primary" onClick={enable}><Icon name="bell" size={18} />Turn on</button>
        <button type="button" className="btn small" onClick={() => setShow(false)}>Not now</button>
      </div>
    </div>
  );
}

export default function Home({
  user, group, groups, setGroupId,
}) {
  const [week, setWeek] = useState(null); // null = this week
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(null);
  const [toast, setToast] = useToast();
  const [currentWeek, setCurrentWeek] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api(`/groups/${group.id}/reports${week ? `?week=${week}` : ''}`);
      setData(res);
      if (!week) setCurrentWeek(res.week.weekStart);
    } catch (err) { setError(err.message); }
  }, [group.id, week]);

  useEffect(() => { setData(null); load(); }, [load]);
  useEffect(() => { setWeek(null); }, [group.id]);

  const members = useMemo(() => new Map(group.members.map((m) => [String(m.id), m])), [group.members]);

  const replaceReport = (report) => {
    setData((d) => ({ ...d, people: d.people.map((p) => (p.report && p.report.id === report.id ? { ...p, report } : p)) }));
  };

  const nudge = async (person) => {
    try {
      await api(`/groups/${group.id}/nudges`, { method: 'POST', body: { to: person.user.id, kind: 'report' } });
      setToast(`Nudged ${person.user.name} 👉`);
    } catch (err) { setToast(err.message); }
  };

  if (error) {
    return (
      <main className="page paper-grid">
        <Header user={user} group={group} groups={groups} setGroupId={setGroupId} />
        <div className="center"><p className="sub">{error}</p><button type="button" className="btn primary" onClick={load}>Try again</button></div>
      </main>
    );
  }
  if (!data) return <main className="page paper-grid"><Header user={user} group={group} groups={groups} setGroupId={setGroupId} /><Spinner /></main>;

  const w = data.week;
  const isCurrent = !week || week === currentWeek;
  const daysLeft = daysBetween(w.today, w.deadline);

  let bannerTitle;
  let bannerSub;
  if (w.revealed) {
    bannerTitle = isCurrent ? "It's Sunday, the reports are out ✦" : `Week of ${shortDate(w.weekStart)}`;
    bannerSub = isCurrent ? 'A new week opens tomorrow · leave comments under each letter' : 'Reports from that week';
  } else if (daysLeft <= 0) {
    bannerTitle = 'Due today! ✍️';
    bannerSub = 'Send your report before midnight · revealed tomorrow';
  } else {
    bannerTitle = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left ✍️`;
    bannerSub = `${dayName(w.today)} · reports due Saturday, revealed Sunday`;
  }

  const sent = data.people.filter((p) => p.status === 'sent' && p.report);
  const notSent = data.people.filter((p) => !(p.status === 'sent' && p.report));

  return (
    <main className="page paper-grid">
      <Doodles set="a" />
      <Header user={user} group={group} groups={groups} setGroupId={setGroupId} />

      <div className="row-between" style={{ marginBottom: 10 }}>
        <button type="button" className="icon-btn" aria-label="Previous week" onClick={() => setWeek(addDays(w.weekStart, -7))}><Icon name="back" size={20} /></button>
        <span style={{ fontSize: 18 }}>week of {shortDate(w.weekStart)}</span>
        <button type="button" className="icon-btn" aria-label="Next week" disabled={isCurrent}
          style={{ opacity: isCurrent ? 0.35 : 1 }} onClick={() => setWeek(addDays(w.weekStart, 7) === currentWeek ? null : addDays(w.weekStart, 7))}>
          <Icon name="next" size={20} />
        </button>
      </div>

      <div className="banner"><strong>{bannerTitle}</strong><span className="help">{bannerSub}</span></div>
      {isCurrent && <NotifyPrompt />}

      {w.revealed ? (
        <>
          {sent.length === 0 && <p className="sub" style={{ textAlign: 'center' }}>Nobody sent a report that week.</p>}
          <div className="cards-2">
          {sent.map((p) => (
            <ReportCard key={p.user.id} person={p} members={members} me={user} groupId={group.id}
              onChange={replaceReport} onZoom={setZoom} />
          ))}
          {notSent.map((p) => (
            <article key={p.user.id} className="box" style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, borderStyle: 'dashed', background: 'var(--paper)' }}>
              <Avatar name={p.user.name} colorPair={p.user.colorPair} me={p.isMe} />
              <span style={{ flex: 1, fontSize: 18 }}>{p.isMe ? 'You' : p.user.name} <span className="help">didn't send a report this week</span></span>
            </article>
          ))}
          </div>
        </>
      ) : (
        <div className="stack" style={{ gap: 18 }}>
          <div className="cards-2 stack" style={{ gap: 18 }}>
          {data.people.map((p) => (
            <article key={p.user.id} className="report-card" style={{ ...softCard(p.user.colorPair), marginTop: 0 }}>
              <ProgressCardBody p={p} isCurrent={isCurrent} open={w.open} onNudge={nudge} />
            </article>
          ))}
          </div>
          {isCurrent && (
            <button type="button" className="link-btn" style={{ alignSelf: 'center' }} onClick={() => setWeek(addDays(w.weekStart, -7))}>
              ‹ Read last week's reports
            </button>
          )}
        </div>
      )}

      <Lightbox src={zoom} onClose={() => setZoom(null)} />
      {toast}
    </main>
  );
}

function ProgressCardBody({ p, isCurrent, open, onNudge }) {
  let status = 'not started yet';
  if (p.status === 'sent') status = 'sent ✓ · opens Sunday';
  else if (p.status === 'writing') status = `writing · ${p.filled} of 6`;
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="person">
        <Avatar name={p.user.name} colorPair={p.user.colorPair} me={p.isMe} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: 20 }}>{p.isMe ? 'My report' : p.user.name}</span>
          <span className="help" style={{ color: '#3E4558' }}>{status}</span>
        </div>
        {!p.isMe && p.status !== 'sent' && isCurrent && open && (
          <button type="button" className="btn small" onClick={() => onNudge(p)}>Nudge 👉</button>
        )}
        {p.status === 'sent' && !p.isMe && <Icon name="mail" size={26} label="Sealed until Sunday" />}
      </div>
      <Progress filled={p.status === 'sent' ? 6 : p.filled} />
      {p.isMe && isCurrent && open && p.status !== 'sent' && (
        <a href="#/report" className="btn primary block">{p.filled ? 'Continue my report' : 'Start my report'}</a>
      )}
    </div>
  );
}
