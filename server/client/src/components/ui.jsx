import { useEffect, useState } from 'react';
import { initials, pair } from '../lib/constants';

const PATHS = {
  back: <path d="M15 6l-6 6l6 6" />,
  next: <path d="M9 6l6 6l-6 6" />,
  bell: <><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></>,
  home: <><path d="M5 12H3l9-9l9 9h-2" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  camera: <><path d="M5 7h1a2 2 0 0 0 2-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2" /><circle cx="12" cy="13" r="3" /></>,
  photo: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 16l-5-5l-8 8" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3" /></>,
  send: <><path d="M10 14l11-11" /><path d="M21 3l-6.5 18a.55 .55 0 0 1-1 0l-3.5-7l-7-3.5a.55 .55 0 0 1 0-1l18-6.5" /></>,
  check: <path d="M5 12l5 5l10-10" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6l9-6" /></>,
  folder: <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" />,
  trash: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" /><path d="M9 7V4h6v3" /></>,
};

export function Icon({ name, size = 22, stroke = 1.8, label }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined} aria-label={label}>
      {PATHS[name]}
    </svg>
  );
}

export function Avatar({ name, colorPair, me, size }) {
  const p = pair(colorPair);
  const style = { background: `linear-gradient(135deg, ${p.a} 50%, ${p.b} 50%)`, color: p.ink };
  if (size) Object.assign(style, { width: size, height: size, borderRadius: size / 2 });
  return <span className="avatar" style={style}>{me ? 'Me' : initials(name)}</span>;
}

export function Progress({ filled }) {
  return (
    <div className="progress" role="img" aria-label={`${filled} of 6 letters filled`}>
      {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={i < filled ? 'on' : ''} />)}
    </div>
  );
}

export function BottomNav({ route }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <a href="#/" className={`nav-link${route === '/' ? ' active' : ''}`}><Icon name="home" size={24} /><span>Home</span></a>
      <a href="#/report" className="nav-plus" aria-label="My report"><Icon name="plus" size={26} stroke={2} /></a>
      <a href="#/snap" className={`nav-link${route === '/snap' ? ' active' : ''}`}><Icon name="camera" size={24} /><span>Daily snap</span></a>
    </nav>
  );
}

// Small message that fades away
export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);
  const el = msg ? <div className="toast" role="status">{msg}</div> : null;
  return [el, setMsg];
}

export function Lightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div className="overlay lightbox" role="dialog" aria-label="Photo" onClick={onClose}>
      <img src={src} alt="" />
    </div>
  );
}

export function Confirm({ title, text, yes, no = 'Cancel', onYes, onNo }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog">
        <h2 style={{ fontSize: 30 }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 18 }}>{text}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn" style={{ flex: 1 }} onClick={onNo}>{no}</button>
          <button type="button" className="btn primary" style={{ flex: 1 }} onClick={onYes}>{yes}</button>
        </div>
      </div>
    </div>
  );
}

export function Spinner({ text = 'Loading…' }) {
  return <div className="center"><span className="sub">{text}</span></div>;
}

// Cloudinary links: smaller photos load faster
export function thumb(url, w = 600) {
  return url.includes('/image/upload/') ? url.replace('/image/upload/', `/image/upload/c_limit,w_${w},q_auto,f_auto/`) : url;
}
