import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { COLOR_PAIRS } from '../lib/constants';
import {
  pushSupported, currentSubscription, turnOnNotifications, turnOffNotifications,
} from '../lib/push';
import { Doodle } from '../components/Doodles';
import { Confirm, Icon, useToast } from '../components/ui';
import { InviteBox } from './GroupSetup';
import { go } from '../lib/router';

export default function Me({
  user, setUser, group, groups, setGroupId, refreshGroups, logout,
}) {
  const [name, setName] = useState(user.name);
  const [notify, setNotify] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [toast, setToast] = useToast();

  useEffect(() => {
    currentSubscription().then((s) => setNotify(Boolean(s))).catch(() => {});
  }, []);

  const saveProfile = async (body) => {
    try {
      const res = await api('/auth/me', { method: 'PATCH', body });
      setUser(res.user);
      await refreshGroups();
      setToast('Saved');
    } catch (err) { setToast(err.message); }
  };

  const toggleNotify = async () => {
    try {
      if (notify) { await turnOffNotifications(); setNotify(false); } else { await turnOnNotifications(); setNotify(true); }
    } catch (err) { setToast(err.message); }
  };

  const leave = async () => {
    setLeaving(false);
    try {
      await api(`/groups/${group.id}/leave`, { method: 'POST' });
      const left = await refreshGroups();
      if (left.length) setGroupId(left[0].id);
      go('/');
    } catch (err) { setToast(err.message); }
  };

  return (
    <main className="page paper-ruled">
      <Doodle shape="star" color="yellow" size={28} style={{ top: 24, right: 22 }} />
      <Doodle shape="sparkle" color="pink" size={20} style={{ top: 64, right: 64 }} />
      <Doodle shape="spiral" color="lilac" size={24} style={{ bottom: 40, right: 16 }} />

      <header className="top" style={{ justifyContent: 'flex-start', gap: 12, marginLeft: -22 }}>
        <a href="#/" className="icon-btn" aria-label="Back to home"><Icon name="back" size={20} /></a>
        <h1 style={{ fontSize: 40 }}>Me</h1>
      </header>

      <div className="stack" style={{ gap: 16 }}>
        <section className="box">
          <h2 style={{ fontSize: 26 }}>My details</h2>
          <div className="field">
            <label htmlFor="nm">Name on my card</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="nm" className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
              <button type="button" className="btn small" style={{ height: 48 }} disabled={!name.trim() || name === user.name}
                onClick={() => saveProfile({ name })}>Save</button>
            </div>
          </div>
          <span className="help">My report colours</span>
          <div className="swatches" role="radiogroup" aria-label="Report colours">
            {Object.entries(COLOR_PAIRS).map(([key, p]) => (
              <button key={key} type="button" role="radio" aria-checked={user.colorPair === key} aria-label={p.name}
                className="swatch" style={{ background: `linear-gradient(135deg, ${p.a} 50%, ${p.b} 50%)` }}
                onClick={() => saveProfile({ colorPair: key })} />
            ))}
          </div>
        </section>

        <section className="box">
          <h2 style={{ fontSize: 26 }}>Phone notifications</h2>
          <div className="row-between" style={{ fontSize: 18 }}>
            <span>Reminders and nudges</span>
            <button type="button" role="switch" aria-checked={notify} aria-label="Phone notifications" className="switch"
              onClick={toggleNotify} disabled={!pushSupported()}><span /></button>
          </div>
          <span className="help">
            {pushSupported() ? 'Saturday report reminders, 8 pm snap reminder, Sunday reveal and nudges' : 'Open the app in Chrome on your phone to get notifications'}
          </span>
        </section>

        <section className="box">
          <h2 style={{ fontSize: 26 }}>My groups</h2>
          {groups.map((g) => (
            <button key={g.id} type="button" className="row-between" onClick={() => { setGroupId(g.id); go('/'); }}
              style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--paper)', border: g.id === group.id ? '1.5px solid var(--navy)' : '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', fontSize: 18 }}>
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{g.name}</span>
                <span className="help">{g.members.length} {g.members.length === 1 ? 'person' : 'people'}{g.id === group.id ? " · you're here now" : ''}</span>
              </span>
              {g.id === group.id && <Icon name="check" size={20} stroke={2.2} />}
            </button>
          ))}
          <InviteBox group={group} />
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="#/join" className="btn small" style={{ flex: 1 }}>Join another</a>
            <a href="#/create" className="btn small" style={{ flex: 1 }}>Create new</a>
          </div>
          <button type="button" className="link-btn danger" style={{ alignSelf: 'flex-start' }} onClick={() => setLeaving(true)}>
            Leave {group.name}
          </button>
        </section>

        <button type="button" className="btn block" onClick={logout}>Log out</button>
      </div>

      {leaving && (
        <Confirm title={`Leave ${group.name}?`} text="You'll stop seeing this group's reports. You can join again with the invite code."
          yes="Leave" onYes={leave} onNo={() => setLeaving(false)} />
      )}
      {toast}
    </main>
  );
}
