// Fixed decorative doodles: sparkles, stars, hearts, spirals, bubbles, squiggles
const SHAPES = {
  sparkle: (fill, stroke) => <path d="M12 2C12 8 16 12 22 12C16 12 12 16 12 22C12 16 8 12 2 12C8 12 12 8 12 2Z" fill={fill} stroke={stroke} strokeWidth="1" />,
  star: (fill, stroke) => <path d="M12 2l2.9 6.6l7.1.6l-5.4 4.7l1.6 7l-6.2-3.7l-6.2 3.7l1.6-7L2 9.2l7.1-.6z" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />,
  heart: (fill, stroke) => <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" fill={fill} stroke={stroke} strokeWidth="1.2" />,
  spiral: (_, stroke) => <path d="M12 12a1 1 0 0 1 2 0a3 3 0 0 1-5 2a5 5 0 0 1 8-5a7 7 0 0 1-9 10" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />,
  bubble: (fill, stroke) => (
    <>
      <circle cx="12" cy="12" r="10" fill={fill} stroke={stroke} strokeWidth="0.8" />
      <path d="M6.5 9a6 6 0 0 1 4-3.5" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
};

const COLORS = {
  pink: ['#F8C9DA', '#D97A9C'],
  yellow: ['#FBF0BE', '#D9B84A'],
  mint: ['#CDEFE0', '#4FA585'],
  lilac: ['#E2D6F5', '#9C86D1'],
  blue: ['#E6F0FA', '#7FA8D6'],
  peach: ['#FBDCC8', '#E08F63'],
};

export function Doodle({ shape, color = 'pink', size = 24, style }) {
  const [fill, stroke] = COLORS[color];
  if (shape === 'squiggle') {
    return (
      <svg className="doodle" width={size * 2.5} height={size * 0.7} viewBox="0 0 60 16" aria-hidden="true" style={style}>
        <path d="M2 8c5-8 9 8 14 0s9 8 14 0s9 8 14 0s9 8 14 0" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="doodle" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style}>
      {SHAPES[shape](fill, stroke)}
    </svg>
  );
}

// A standard scattering used on most pages
export default function Doodles({ set = 'a' }) {
  const sets = {
    a: [
      ['sparkle', 'pink', 30, { top: 16, right: 110 }],
      ['star', 'yellow', 18, { top: 54, right: 150 }],
      ['heart', 'peach', 18, { top: 22, right: 168 }],
      ['bubble', 'blue', 36, { top: 420, left: -6 }],
      ['spiral', 'lilac', 26, { top: 700, right: -2 }],
      ['squiggle', 'mint', 22, { top: 980, left: 10 }],
      ['sparkle', 'mint', 20, { top: 1240, right: 8 }],
    ],
    b: [
      ['sparkle', 'blue', 30, { top: 22, right: 24 }],
      ['star', 'pink', 20, { top: 64, right: 64 }],
      ['heart', 'peach', 18, { top: 300, right: 4 }],
      ['spiral', 'lilac', 24, { top: 560, left: 2 }],
      ['bubble', 'blue', 40, { bottom: 140, right: 6 }],
      ['squiggle', 'pink', 22, { bottom: 100, left: 20 }],
    ],
  };
  return sets[set].map(([shape, color, size, style], i) => (
    // eslint-disable-next-line react/no-array-index-key
    <Doodle key={i} shape={shape} color={color} size={size} style={style} />
  ));
}
