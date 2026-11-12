export const LETTERS = [
  { key: 'radio', letter: 'R', label: 'Radio', hint: "What are you listening to or reading?" },
  { key: 'eating', letter: 'E', label: 'Eating', hint: "What's on your plate this week?" },
  { key: 'playing', letter: 'P', label: 'Playing', hint: 'What are you playing?' },
  { key: 'obsessed', letter: 'O', label: 'Obsessed with', hint: "What can't you stop thinking about?" },
  { key: 'recommend', letter: 'R', label: 'Recommend', hint: 'What should everyone try?' },
  { key: 'treating', letter: 'T', label: 'Treating myself', hint: 'How did you treat yourself?' },
];

// Colour pairs: [first, second, border, text on them]
export const COLOR_PAIRS = {
  'pink-yellow': { name: 'Pink and yellow', a: '#F8D3DF', b: '#FBF0BE', border: '#EBC2D0', ink: '#7A2E4A', dot: '#D97A9C' },
  'lilac-mint': { name: 'Lilac and mint', a: '#E2D6F5', b: '#CDEFE0', border: '#CDBDEB', ink: '#3E2F66', dot: '#9C86D1' },
  'blue-peach': { name: 'Blue and peach', a: '#D3E6F7', b: '#FBDCC8', border: '#C9CFE0', ink: '#24456E', dot: '#6E9BD0' },
  'mint-butter': { name: 'Mint and butter', a: '#CDEFE0', b: '#FBF0BE', border: '#A6DCC5', ink: '#1F5440', dot: '#4FA585' },
  'peach-pink': { name: 'Peach and pink', a: '#FBDCC8', b: '#F8D3DF', border: '#EBC7B8', ink: '#6B3416', dot: '#E08F63' },
  'lilac-blue': { name: 'Lilac and blue', a: '#E2D6F5', b: '#D3E6F7', border: '#C3C3EA', ink: '#3E2F66', dot: '#8E86D8' },
};
export const pair = (key) => COLOR_PAIRS[key] || COLOR_PAIRS['pink-yellow'];

export const cardStyle = (key) => {
  const p = pair(key);
  return {
    background: `repeating-linear-gradient(0deg, rgba(90,110,150,0.16) 0, rgba(90,110,150,0.16) 1px, transparent 1px, transparent 30px), linear-gradient(160deg, ${p.a} 0%, ${p.b} 100%)`,
    borderColor: p.border,
  };
};

// Plain colour blend (no lines) for progress cards and letter boxes
export const softCard = (key) => {
  const p = pair(key);
  return { background: `linear-gradient(160deg, ${p.a} 0%, ${p.b} 100%)`, borderColor: p.border };
};

export const MAX_VIDEO_SECONDS = 60;
export const MAX_VOICE_SECONDS = 300;

export function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}
