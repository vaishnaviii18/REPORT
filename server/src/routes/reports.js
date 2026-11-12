const express = require('express');
const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const {
  LETTER_KEYS, MEDIA_KINDS, MAX_TEXT, MAX_COMMENT,
} = require('../models/constants');
const { requireAuth, requireMember } = require('../middleware/auth');
const { HttpError, wrap } = require('../utils/http');
const { cleanMedia } = require('../utils/media');
const week = require('../utils/week');

// Mounted at /api/groups/:groupId/reports
const router = express.Router({ mergeParams: true });
router.use(requireAuth, requireMember);

function pickWeek(req) {
  const w = req.query.week;
  if (w === undefined) return week.currentWeekStart();
  if (!week.isValidDate(w) || week.weekdayIndex(w) !== 0) throw new HttpError(400, 'week must be a Monday (YYYY-MM-DD)');
  return w;
}

function weekInfo(weekStart) {
  return {
    weekStart,
    deadline: week.deadlineDate(weekStart),
    revealDate: week.revealDate(weekStart),
    open: week.isOpenForWriting(weekStart),
    revealed: week.isRevealed(weekStart),
    today: week.localDate(),
  };
}

function reportView(report, viewerId) {
  return {
    id: report._id,
    user: report.user,
    weekStart: report.weekStart,
    letters: report.letters,
    filled: report.filledCount(),
    sent: Boolean(report.submittedAt),
    submittedAt: report.submittedAt,
    comments: report.comments.map((c) => ({
      id: c._id, user: c.user, letter: c.letter, text: c.text, createdAt: c.createdAt,
    })),
  };
}

// Can this viewer see the full report?
function canSee(report, viewerId) {
  if (report.user.equals(viewerId)) return true;
  return Boolean(report.submittedAt) && week.isRevealed(report.weekStart);
}

// --- My report -------------------------------------------------------------

router.get('/me', wrap(async (req, res) => {
  const weekStart = pickWeek(req);
  const report = await Report.findOne({ group: req.group._id, user: req.user._id, weekStart });
  res.json({
    week: weekInfo(weekStart),
    report: report ? reportView(report, req.user._id) : null,
  });
}));

// Save one letter: { text?, photo?, voice?, video? }. Send null to remove media.
router.put('/me/letters/:key', wrap(async (req, res) => {
  const { key } = req.params;
  if (!LETTER_KEYS.includes(key)) throw new HttpError(404, 'Unknown letter');
  const weekStart = week.currentWeekStart();
  if (!week.isOpenForWriting(weekStart)) throw new HttpError(400, 'This week is closed');

  const body = req.body || {};
  const update = {};
  if (body.text !== undefined) {
    if (typeof body.text !== 'string') throw new HttpError(400, 'Invalid text');
    if (body.text.length > MAX_TEXT) throw new HttpError(400, `Keep it under ${MAX_TEXT} characters`);
    update[`letters.${key}.text`] = body.text;
  }
  MEDIA_KINDS.forEach((kind) => {
    if (body[kind] !== undefined) update[`letters.${key}.${kind}`] = cleanMedia(body[kind], kind);
  });
  if (!Object.keys(update).length) throw new HttpError(400, 'Nothing to save');

  let report = await Report.findOne({ group: req.group._id, user: req.user._id, weekStart });
  if (report && report.submittedAt) throw new HttpError(400, "You've already sent this week's report");
  if (!report) report = new Report({ group: req.group._id, user: req.user._id, weekStart });
  Object.entries(update).forEach(([path, value]) => report.set(path, value));
  try {
    await report.save();
  } catch (err) {
    // Two saves at the exact same moment on a brand-new report
    if (err.code === 11000) throw new HttpError(409, 'Saving clashed, please try again');
    throw err;
  }
  res.json({ week: weekInfo(weekStart), report: reportView(report, req.user._id) });
}));

// Send the report (only when all six letters are filled)
router.post('/me/submit', wrap(async (req, res) => {
  const weekStart = week.currentWeekStart();
  if (!week.isOpenForWriting(weekStart)) throw new HttpError(400, 'This week is closed');
  const report = await Report.findOne({ group: req.group._id, user: req.user._id, weekStart });
  if (!report) throw new HttpError(400, 'Fill in your letters first');
  if (report.submittedAt) return res.json({ week: weekInfo(weekStart), report: reportView(report, req.user._id) });
  const filled = report.filledCount();
  if (filled < LETTER_KEYS.length) {
    throw new HttpError(400, `Fill all 6 letters to send (${filled} of 6 done)`);
  }
  report.submittedAt = new Date();
  await report.save();
  return res.json({ week: weekInfo(weekStart), report: reportView(report, req.user._id) });
}));

// --- The group's feed ------------------------------------------------------

// Everyone in the group for a week. Full reports only show once revealed (Sunday)
// and only if they were sent; otherwise just progress.
router.get('/', wrap(async (req, res) => {
  const weekStart = pickWeek(req);
  const [members, reports] = await Promise.all([
    User.find({ _id: { $in: req.group.members } }).select('name colorPair'),
    Report.find({ group: req.group._id, weekStart }),
  ]);
  const byUser = new Map(reports.map((r) => [String(r.user), r]));

  const people = members.map((m) => {
    const r = byUser.get(String(m._id));
    const filled = r ? r.filledCount() : 0;
    let status = 'not_started';
    if (r && r.submittedAt) status = 'sent';
    else if (filled > 0) status = 'writing';
    return {
      user: { id: m._id, name: m.name, colorPair: m.colorPair },
      isMe: m._id.equals(req.user._id),
      status,
      filled,
      report: r && canSee(r, req.user._id) ? reportView(r, req.user._id) : null,
    };
  });
  // Me first, then sent reports, then the rest
  const rank = (p) => (p.isMe ? 0 : { sent: 1, writing: 2, not_started: 3 }[p.status]);
  people.sort((a, b) => rank(a) - rank(b));

  res.json({ week: weekInfo(weekStart), people });
}));

// --- Comments (one thread under each letter) --------------------------------------------------

async function loadVisible(req) {
  const { reportId } = req.params;
  if (!mongoose.isValidObjectId(reportId)) throw new HttpError(404, 'Report not found');
  const report = await Report.findOne({ _id: reportId, group: req.group._id });
  if (!report || !canSee(report, req.user._id)) throw new HttpError(404, 'Report not found');
  return report;
}

// Comments sit under one letter: { letter, text }
router.post('/:reportId/comments', wrap(async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) throw new HttpError(400, 'Write something first');
  if (text.length > MAX_COMMENT) throw new HttpError(400, `Keep comments under ${MAX_COMMENT} characters`);
  const { letter } = req.body || {};
  if (!LETTER_KEYS.includes(letter)) throw new HttpError(400, 'Which letter is this comment for?');
  const report = await loadVisible(req);
  report.comments.push({ user: req.user._id, letter, text });
  await report.save();
  res.status(201).json({ report: reportView(report, req.user._id) });
}));

router.delete('/:reportId/comments/:commentId', wrap(async (req, res) => {
  const report = await loadVisible(req);
  const c = report.comments.id(req.params.commentId);
  if (!c) throw new HttpError(404, 'Comment not found');
  if (!c.user.equals(req.user._id)) throw new HttpError(403, 'You can only delete your own comments');
  c.deleteOne();
  await report.save();
  res.json({ report: reportView(report, req.user._id) });
}));

module.exports = router;
