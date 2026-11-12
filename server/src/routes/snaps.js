const express = require('express');
const Snap = require('../models/Snap');
const { requireAuth, requireMember } = require('../middleware/auth');
const { HttpError, wrap } = require('../utils/http');
const { cleanMedia } = require('../utils/media');
const week = require('../utils/week');

// Mounted at /api/groups/:groupId/snaps
const router = express.Router({ mergeParams: true });
router.use(requireAuth, requireMember);

const MONTH_RE = /^\d{4}-\d{2}$/;
const MAX_DAYS_BACK = 60;

function snapView(s) {
  return {
    id: s._id, user: s.user, date: s.date, photo: s.photo, caption: s.caption,
  };
}

// All snaps in the group for a month: ?month=2026-11 (default: this month)
router.get('/', wrap(async (req, res) => {
  const month = req.query.month || week.localDate().slice(0, 7);
  if (!MONTH_RE.test(month)) throw new HttpError(400, 'month must look like 2026-11');
  const snaps = await Snap.find({
    group: req.group._id,
    date: { $gte: `${month}-01`, $lte: `${month}-31` },
  }).sort({ date: 1, createdAt: 1 });
  res.json({ month, today: week.localDate(), snaps: snaps.map(snapView) });
}));

// Add or replace my photo for a day. Past days are allowed (from the gallery),
// future days are not.
router.put('/:date', wrap(async (req, res) => {
  const { date } = req.params;
  if (!week.isValidDate(date)) throw new HttpError(400, 'Invalid date');
  const today = week.localDate();
  if (date > today) throw new HttpError(400, "You can't add a photo for a future day");
  if (date < week.addDays(today, -MAX_DAYS_BACK)) throw new HttpError(400, 'That day is too far back');

  const photo = cleanMedia(req.body && req.body.photo, 'photo');
  if (!photo) throw new HttpError(400, 'Add a photo');
  const caption = typeof req.body.caption === 'string' ? req.body.caption.trim().slice(0, 200) : '';

  const snap = await Snap.findOneAndUpdate(
    { group: req.group._id, user: req.user._id, date },
    { $set: { photo, caption } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  res.json({ snap: snapView(snap) });
}));

router.delete('/:date', wrap(async (req, res) => {
  await Snap.deleteOne({ group: req.group._id, user: req.user._id, date: req.params.date });
  res.json({ ok: true });
}));

module.exports = router;
