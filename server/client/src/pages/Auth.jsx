import { useState } from 'react';
import { api } from '../lib/api';
import Doodles from '../components/Doodles';

export default function Auth({ onDone }) {
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && !name.trim()) { setError('Enter your name'); return; }
    if (!email.trim()) { setError('Enter your email'); return; }
    if (mode === 'signup' && password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!password) { setError('Enter your password'); return; }
    setBusy(true);
    try {
      const body = mode === 'signup' ? { name, email, password } : { email, password };
      const res = await api(`/auth/${mode === 'signup' ? 'signup' : 'login'}`, { method: 'POST', body });
      onDone(res.user, res.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page paper-ruled" style={{ paddingTop: 64 }}>
      <Doodles set="b" />
      <div className="stack" style={{ gap: 22 }}>
        <div>
          <h1 style={{ fontSize: 62 }}>The Report</h1>
          <p className="sub" style={{ fontSize: 20, margin: '4px 0 0' }}>a weekly journal with your people</p>
        </div>

        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => { setMode('signup'); setError(''); }}>Sign up</button>
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => { setMode('login'); setError(''); }}>Log in</button>
        </div>

        <form className="stack" onSubmit={submit} noValidate>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="what your friends call you" maxLength={40} autoComplete="nickname" />
              <span className="help">This shows on your report card</span>
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com" autoComplete="email" inputMode="email" />
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input id="pw" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'at least 8 characters' : 'your password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </div>
          {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
          <button type="submit" className="btn primary block" disabled={busy} style={{ height: 52, fontSize: 22 }}>
            {busy ? 'One moment…' : mode === 'signup' ? 'Start my journal' : 'Open my journal'}
          </button>
        </form>
      </div>
    </main>
  );
}
