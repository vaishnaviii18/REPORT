const test = require('node:test');
const assert = require('node:assert');
const w = require('../src/utils/week');

// 12 Nov 2026 is a Thursday
test('weekStartOf finds the Monday', () => {
  assert.strictEqual(w.weekStartOf('2026-11-12'), '2026-11-09');
  assert.strictEqual(w.weekStartOf('2026-11-09'), '2026-11-09'); // Monday itself
  assert.strictEqual(w.weekStartOf('2026-11-15'), '2026-11-09'); // Sunday belongs to the same week
  assert.strictEqual(w.weekStartOf('2026-11-16'), '2026-11-16'); // next Monday
});

test('deadline is Saturday, reveal is Sunday', () => {
  assert.strictEqual(w.deadlineDate('2026-11-09'), '2026-11-14');
  assert.strictEqual(w.revealDate('2026-11-09'), '2026-11-15');
});

test('IST is used, not UTC', () => {
  // 20:00 UTC on Saturday 14 Nov = 01:30 IST on Sunday 15 Nov
  const lateSat = new Date('2026-11-14T20:00:00Z');
  assert.strictEqual(w.localDate(lateSat, 'Asia/Kolkata'), '2026-11-15');
  assert.strictEqual(w.isOpenForWriting('2026-11-09', lateSat, 'Asia/Kolkata'), false);
  assert.strictEqual(w.isRevealed('2026-11-09', lateSat, 'Asia/Kolkata'), true);

  // 18:00 UTC Saturday = 23:30 IST Saturday: still open, not revealed
  const justBefore = new Date('2026-11-14T18:00:00Z');
  assert.strictEqual(w.isOpenForWriting('2026-11-09', justBefore, 'Asia/Kolkata'), true);
  assert.strictEqual(w.isRevealed('2026-11-09', justBefore, 'Asia/Kolkata'), false);
});

test('month and year boundaries', () => {
  assert.strictEqual(w.addDays('2026-12-30', 3), '2027-01-02');
  assert.strictEqual(w.weekStartOf('2027-01-01'), '2026-12-28');
});

test('date validation', () => {
  assert.ok(w.isValidDate('2026-11-12'));
  assert.ok(!w.isValidDate('2026-02-30'));
  assert.ok(!w.isValidDate('12-11-2026'));
  assert.ok(!w.isValidDate(undefined));
});
