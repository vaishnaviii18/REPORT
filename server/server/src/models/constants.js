// The six letters of a report, in order
const LETTERS = [
  { key: 'radio', letter: 'R', label: 'Radio' },
  { key: 'eating', letter: 'E', label: 'Eating' },
  { key: 'playing', letter: 'P', label: 'Playing' },
  { key: 'obsessed', letter: 'O', label: 'Obsessed with' },
  { key: 'recommend', letter: 'R', label: 'Recommend' },
  { key: 'treating', letter: 'T', label: 'Treating myself' },
];
const LETTER_KEYS = LETTERS.map((l) => l.key);

// Pastel colour pairs a person can pick for their report card
const COLOR_PAIRS = [
  'pink-yellow',
  'lilac-mint',
  'blue-peach',
  'mint-butter',
  'peach-pink',
  'lilac-blue',
];

const MEDIA_KINDS = ['photo', 'voice', 'video'];
const MAX_VIDEO_SECONDS = 60;
const MAX_VOICE_SECONDS = 300;
const MAX_TEXT = 2000;
const MAX_COMMENT = 500;

module.exports = {
  LETTERS,
  LETTER_KEYS,
  COLOR_PAIRS,
  MEDIA_KINDS,
  MAX_VIDEO_SECONDS,
  MAX_VOICE_SECONDS,
  MAX_TEXT,
  MAX_COMMENT,
};
