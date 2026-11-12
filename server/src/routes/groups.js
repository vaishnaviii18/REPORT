const express = require('express');
const crypto = require('crypto');
const Group = require('../models/Group');
const User = require('../models/User');
const { requireAuth, requireMember } = require('../middleware/auth');
const { HttpError, wrap } = require('../utils/http');

const router = express.Router();
router.use(requireAuth);

const MAX_MEMBERS = 12;
// No 0/O or 1/I so codes are easy to read out
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newCode() {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

async function groupView(group) {
  const members = await User.find({ _id: { $in: group.members } }).select('name colorPair');
  return {
    id: group._id,
    name: group.name,
    inviteCode: group.inviteCode,
    createdBy: group.createdBy,
    members: members.map((m) => ({ id: m._id, name: m.name, colorPair: m.colorPair })),
  };
}

// My groups
router.get('/', wrap(async (req, res) => {
  const groups = await Group.find({ members: req.user._id }).sort({ createdAt: 1 });
  res.json({ groups: await Promise.all(groups.map(groupView)) });
}));

// Start a new group
router.post('/', wrap(async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name || name.length > 40) throw new HttpError(400, 'Group name must be 1 to 40 characters');
  let group;
  for (let i = 0; i < 5 && !group; i += 1) {
    try {
      group = await Group.create({
        name, inviteCode: newCode(), members: [req.user._id], createdBy: req.user._id,
      });
    } catch (err) {
      if (err.code !== 11000) throw err; // code clash: try another
    }
  }
  if (!group) throw new HttpError(500, 'Could not create the group, try again');
  await User.updateOne({ _id: req.user._id }, { $addToSet: { groups: group._id } });
  res.status(201).json({ group: await groupView(group) });
}));

// Join with an invite code
router.post('/join', wrap(async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  if (!code) throw new HttpError(400, 'Enter an invite code');
  const group = await Group.findOne({ inviteCode: code });
  if (!group) throw new HttpError(404, "That code doesn't match any group");
  if (!group.members.some((m) => m.equals(req.user._id))) {
    if (group.members.length >= MAX_MEMBERS) throw new HttpError(400, 'This group is full');
    group.members.push(req.user._id);
    await group.save();
    await User.updateOne({ _id: req.user._id }, { $addToSet: { groups: group._id } });
  }
  res.json({ group: await groupView(group) });
}));

router.get('/:groupId', requireMember, wrap(async (req, res) => {
  res.json({ group: await groupView(req.group) });
}));

router.post('/:groupId/leave', requireMember, wrap(async (req, res) => {
  req.group.members = req.group.members.filter((m) => !m.equals(req.user._id));
  await req.group.save();
  await User.updateOne({ _id: req.user._id }, { $pull: { groups: req.group._id } });
  res.json({ ok: true });
}));

module.exports = router;
