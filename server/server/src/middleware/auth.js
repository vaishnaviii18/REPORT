const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const { HttpError } = require('../utils/http');

// Checks the login token and puts the user on req.user
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Please log in');
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new HttpError(401, 'Your session expired. Please log in again');
    }
    const user = await User.findById(payload.sub);
    if (!user) throw new HttpError(401, 'Account not found');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Makes sure the logged-in user belongs to :groupId, and puts it on req.group
async function requireMember(req, res, next) {
  try {
    const { groupId } = req.params;
    if (!mongoose.isValidObjectId(groupId)) throw new HttpError(404, 'Group not found');
    const group = await Group.findById(groupId);
    if (!group) throw new HttpError(404, 'Group not found');
    const isMember = group.members.some((m) => m.equals(req.user._id));
    if (!isMember) throw new HttpError(403, "You're not in this group");
    req.group = group;
    next();
  } catch (err) {
    next(err);
  }
}

function signToken(user) {
  return jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '60d' });
}

module.exports = { requireAuth, requireMember, signToken };
