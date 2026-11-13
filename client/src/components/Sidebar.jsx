import { Doodle } from './Doodles';
import { Icon } from './ui';

// Left menu, only shown on laptops and tablets (see styles.css)
const SPOTS = [
  ['sparkle', 'pink', 22, { top: 18, right: 18 }],
  ['star', 'yellow', 16, { top: 92, right: 28 }],
  ['heart', 'peach', 18, { top: 300, right: 16 }],
  ['spiral', 'lilac', 22, { top: 360, left: 18 }],
  ['bubble', 'blue', 30, { top: 430, right: 36 }],
  ['star', 'mint', 18, { top: 510, left: 60 }],
  ['sparkle', 'lilac', 20, { top: 580, right: 22 }],
  ['heart', 'pink', 16, { top: 650, left: 26 }],
  ['squiggle', 'mint', 22, { top: 720, left: 80 }],
  ['sparkle', 'yellow', 24, { top: 790, right: 40 }],
  ['bubble', 'lilac', 26, { top: 870, left: 30 }],
];

export default function Sidebar({ route, group }) {
  const link = (path, label, icon) => (
    <a href={`#${path}`} className={`side-link${route === path ? ' active' : ''}`}>
      <Icon name={icon} size={22} />{label}
    </a>
  );
  return (
    <aside className="sidebar" aria-label="Main">
      {SPOTS.map(([shape, color, size, style], i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Doodle key={i} shape={shape} color={color} size={size} style={style} />
      ))}
      <div style={{ position: 'relative' }}>
        <h1 style={{ fontSize: 40 }}>The Report</h1>
        <span className="sub" style={{ fontSize: 15 }}>{group.name}</span>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
        {link('/', 'Home', 'home')}
        {link('/report', 'My report', 'plus')}
        {link('/snap', 'Daily snap', 'camera')}
        {link('/me', 'Me', 'bell')}
      </nav>
      <a href="#/report" className="btn primary block" style={{ position: 'relative' }}>✎ Write my report ✦</a>
    </aside>
  );
}
