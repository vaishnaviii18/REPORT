import { useState } from 'react';
import { api } from '../lib/api';
import Doodles from '../components/Doodles';
import { Icon } from '../components/ui';

export function InviteBox({ group }) {
  const [copied, setCopied] = useState(false);
  const link = window.location.origin;
  const message = `Join our group "${group.name}" on The Report ✍️\n${link}\nInvite code: ${group.inviteCode}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };
  return (
    <div className="stack" style={{ gap: 8 }}>
      <span className="help">Invite code</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="code">{group.inviteCode}</span>
        <button type="button" className="btn small" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <a className="btn block" style={{ background: '#CDEFE0', borderColor: '#4FA585', color: '#1F5440' }}
        href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
        Share on WhatsApp
      </a>
    </div>
  );
}

export default function GroupSetup({ first, initialTab = 'join', onReady, onLogout }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const join = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setError({ join: 'Enter the invite code' }); return; }
    setBusy(true); setError({});
    try {
      const { group } = await api('/groups/join', { method: 'POST', body: { code } });
      await onReady(group);
    } catch (err) { setError({ join: err.message }); } finally { setBusy(false); }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError({ create: 'Give your group a name' }); return; }
    setBusy(true); setError({});
    try {
      const { group } = await api('/groups', { method: 'POST', body: { name } });
      setCreated(group);
    } catch (err) { setError({ create: err.message }); } finally { setBusy(false); }
  };

  if (created) {
    return (
      <main className="page paper-ruled">
        <Doodles set="b" />
        <div className="stack" style={{ gap: 18, paddingTop: 30 }}>
          <h1 style={{ fontSize: 44 }}>{created.name} is ready ✦</h1>
          <p className="sub" style={{ margin: 0 }}>Send this code to your friends so they can join.</p>
          <div className="box"><InviteBox group={created} /></div>
          <button type="button" className="btn primary block" onClick={() => onReady(created)}>Go to my group</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page paper-ruled" style={{ paddingTop: 50 }}>
      <Doodles set="b" />
      <div className="stack" style={{ gap: 20 }}>
        {!first && <a href="#/me" className="icon-btn" aria-label="Back"><Icon name="back" size={20} /></a>}
        <div>
          <h1 style={{ fontSize: 46 }}>Find your people</h1>
          <p className="sub" style={{ margin: '4px 0 0' }}>Only your group sees your reports</p>
        </div>

        <form className="box" onSubmit={join} style={{ order: initialTab === 'create' ? 2 : 0 }}>
          <h2 style={{ fontSize: 30 }}>Join a group</h2>
          <div className="field">
            <label htmlFor="code">Invite code from a friend</label>
            <input id="code" className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC234" autoCapitalize="characters" style={{ letterSpacing: 2, fontSize: 20 }} />
          </div>
          {error.join && <p className="error" role="alert" style={{ margin: 0 }}>{error.join}</p>}
          <button type="submit" className="btn primary" disabled={busy}>Join</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-2)', order: 1 }}>
          <span style={{ flex: 1, borderTop: '1px dashed #C9C2B3' }} />or<span style={{ flex: 1, borderTop: '1px dashed #C9C2B3' }} />
        </div>

        <form className="box" onSubmit={create} style={{ order: initialTab === 'create' ? 0 : 2 }}>
          <h2 style={{ fontSize: 30 }}>Start a new group</h2>
          <div className="field">
            <label htmlFor="gname">Group name</label>
            <input id="gname" className="input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="the girlies" maxLength={40} />
          </div>
          {error.create && <p className="error" role="alert" style={{ margin: 0 }}>{error.create}</p>}
          <button type="submit" className="btn" disabled={busy}>Create and get invite code</button>
        </form>

        {first && <button type="button" className="link-btn" style={{ order: 3 }} onClick={onLogout}>Log out</button>}
      </div>
    </main>
  );
}
