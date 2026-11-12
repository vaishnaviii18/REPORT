const express = require('express');
const crypto = require('crypto');
const Group = require('../models/Group');
const Report = require('../models/Report');
const Snap = require('../models/Snap');
const { HttpError, wrap } = require('../utils/http');
const { notifyUser } = require('../utils/push');
const week = require('../utils/week');

// Reminders, triggered by a free scheduler (cron-job.org) calling
//   POST /api/jobs/<name>   with header  x-cron-secret: <CRON_SECRET>
// Suggested schedule (IST):
//   saturday-reminder : Saturday 10:00 and 20:00
//   snap-reminder     : every day 20:00
//   reveal            : Sunday 09:00
const router = express.Router();

function checkSecret(req) {
  const expected = process.env.CRON_SECRET || '';
  const given = String(req.headers['x-cron-secret'] || '');
  const ok = expected.length > 0 && given.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) throw new HttpError(401, 'Not allowed');
}

// Sends one notification per person, even if they're in several groups
async function notifyOnce(byUser) {
  const results = await Promise.all([...byUser.entries()].map(
    ([userId, groupNames]) => notifyUser(userId, byUser.payload(userId, groupNames)),
  ));
  return results.reduce((a, b) => a + b, 0);
}

function collector(makePayload) {
  const map = new Map();
  map.payload = makePayload;
  map.add = (userId, groupName) => {
    const k = String(userId);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(groupName);
  };
  return map;
}

const jobs = {
  // Saturday: anyone who hasn't sent this week's report
  async 'saturday-reminder'() {
    const weekStart = week.currentWeekStart();
    const groups = await Group.find({});
    const sentReports = await Report.find({ weekStart, submittedAt: { $ne: null } }).select('group user');
    const sent = new Set(sentReports.map((r) => `${r.group}:${r.user}`));
    const todo = collector((id, names) => ({
      title: 'The Report is due today ✍️',
      body: `Fill all 6 letters and send it before midnight (${names.join(', ')})`,
      url: '/report',
    }));
    groups.forEach((g) => g.members.forEach((m) => {
      if (!sent.has(`${g._id}:${m}`)) todo.add(m, g.name);
    }));
    return notifyOnce(todo);
  },

  // Every evening: anyone without today's daily snap
  async 'snap-reminder'() {
    const today = week.localDate();
    const groups = await Group.find({});
    const snaps = await Snap.find({ date: today }).select('group user');
    const done = new Set(snaps.map((s) => `${s.group}:${s.user}`));
    const todo = collector(() => ({
      title: 'Daily snap 📸',
      body: "You haven't added today's photo yet",
      url: '/snap',
    }));
    groups.forEach((g) => g.members.forEach((m) => {
      if (!done.has(`${g._id}:${m}`)) todo.add(m, g.name);
    }));
    return notifyOnce(todo);
  },

  // Sunday: tell everyone the reports are out
  async reveal() {
    const groups = await Group.find({});
    const all = collector(() => ({
      title: 'The reports are out ✦',
      body: "See what everyone's been up to this week",
      url: '/',
    }));
    groups.forEach((g) => g.members.forEach((m) => all.add(m, g.name)));
    return notifyOnce(all);
  },
};

router.post('/:name', wrap(async (req, res) => {
  checkSecret(req);
  const job = jobs[req.params.name];
  if (!job) throw new HttpError(404, 'Unknown job');
  const sent = await job();
  res.json({ ok: true, job: req.params.name, notificationsSent: sent });
}));

module.exports = router;
