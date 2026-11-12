const express = require('express');
const mongoose = require('mongoose');
const Nudge = require('../models/Nudge');
const Report = require('../models/Report');
const Snap = require('../models/Snap');
const { requireAuth, requireMember } = require('../middleware/auth');
const { HttpError, wrap } = require('../utils/http');
const { notifyUser } = require('../utils/push');
const week = require('../utils/week');

// Mounted at /api/groups/:groupId/nudges
const router = express.Router({ mergeParams: true });
router.use(requireAuth, requireMember);

const COOLDOWN_HOURS = 3;

// body: { to: userId, kind: 'report' | 'snap' }
router.post('/', wrap(async (req, res) => {
  const { to, kind } = req.body || {};
  if (!['report', 'snap'].includes(kind)) throw new HttpError(400, 'Unknown nudge');
  if (!mongoose.isValidObjectId(to)) throw new HttpError(400, 'Who are you nudging?');
  if (req.user._id.equals(to)) throw new HttpError(400, "You can't nudge yourself");
  if (!req.group.members.some((m) => m.equals(to))) throw new HttpError(404, "They're not in this group");

  // Already done? No need to nudge.
  if (kind === 'report') {
    const done = await Report.exists({
      group: req.group._id, user: to, weekStart: week.currentWeekStart(), submittedAt: { $ne: null },
    });
    if (done) throw new HttpError(409, 'They already sent their report');
  } else {
    const done = await Snap.exists({ group: req.group._id, user: to, date: week.localDate() });
    if (done) throw new HttpError(409, 'They already posted today');
  }

  const since = new Date(Date.now() - COOLDOWN_HOURS * 3600 * 1000);
  const recent = await Nudge.exists({
    from: req.user._id, to, kind, group: req.group._id, createdAt: { $gte: since },
  });
  if (recent) throw new HttpError(429, `You nudged them recently. Try again in a few hours`);

  await Nudge.create({ group: req.group._id, from: req.user._id, to, kind });
  const body = kind === 'report'
    ? `${req.user.name} is waiting for your report 👀`
    : `${req.user.name} wants to see your daily snap 📸`;
  await notifyUser(to, { title: req.group.name, body, url: kind === 'report' ? '/report' : '/snap' });
  res.json({ ok: true });
}));

module.exports = router;
