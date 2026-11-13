import { useState } from 'react';
import { api } from '../lib/api';
import { Doodle } from '../components/Doodles';

// Small pastel stars scattered over the grid paper (fixed positions, in % of the screen)
const STARS = [
  [6, 8, 'pink'], [18, 22, 'yellow'], [30, 6, 'blue'], [44, 15, 'mint'], [58, 4, 'peach'], [72, 12, 'pink'],
  [86, 7, 'yellow'], [94, 24, 'blue'], [4, 38, 'mint'], [12, 56, 'peach'], [26, 70, 'pink'], [8, 84, 'yellow'],
  [20, 94, 'blue'], [38, 88, 'mint'], [52, 96, 'pink'], [66, 90, 'yellow'], [80, 86, 'peach'], [92, 70, 'mint'],
  [96, 50, 'pink'], [88, 40, 'yellow'], [48, 30, 'blue'], [34, 46, 'peach'], [62, 26, 'mint'], [76, 60, 'blue'],
];

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
    <main className="page login-bg">
      {STARS.map(([x, y, c], i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Doodle key={i} shape="star" color={c} size={i % 3 ? 11 : 14}
          style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${(i * 23) % 60}deg)`, opacity: 0.9 }} />
      ))}
      <div className="login-wrap">
        <div style={{ position: 'relative' }}>
          <Doodle shape="sparkle" color="pink" size={28} style={{ top: -30, right: 20 }} />
          <h1 style={{ fontSize: 56 }}>The Report</h1>
          <p style={{ margin: '6px 0 0', fontFamily: "'Nunito', sans-serif", fontSize: 16, color: '#6B6455' }}>
            A weekly journal with your people.
          </p>
          <div className="login-points">
            <div><span>R</span> Six little letters, once a week</div>
            <div><span>✦</span> Revealed together every Sunday</div>
            <div><span>◎</span> A daily snap from each of you</div>
          </div>
        </div>

        <div className="login-card">
          <span className="tape" />
          <div className="tabs" role="tablist" style={{ marginBottom: 18 }}>
            <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => { setMode('signup'); setError(''); }}>Sign up</button>
            <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => { setMode('login'); setError(''); }}>Log in</button>
          </div>
          <form className="stack" onSubmit={submit} noValidate>
            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="name">Your name</label>
                <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="What your friends call you" maxLength={40} autoComplete="nickname" />
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
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            </div>
            {error && <p className="error" role="alert" style={{ margin: 0, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>{error}</p>}
            <button type="submit" className="btn primary block" disabled={busy} style={{ height: 50, marginTop: 4 }}>
              {busy ? 'One moment…' : mode === 'signup' ? 'Start my journal' : 'Open my journal'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
