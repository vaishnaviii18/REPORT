const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { COLOR_PAIRS } = require('../models/constants');
const { requireAuth, signToken } = require('../middleware/auth');
const { HttpError, wrap } = require('../utils/http');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanName(name) {
  const n = typeof name === 'string' ? name.trim() : '';
  if (!n || n.length > 40) throw new HttpError(400, 'Name must be 1 to 40 characters');
  return n;
}

function cleanSongs(songs) {
  if (!Array.isArray(songs) || songs.length > 20) {
    throw new HttpError(400, 'Add up to 20 songs');
  }
  return songs.map((song) => {
    const name = typeof song.name === 'string' ? song.name.trim() : '';
    const code = typeof song.code === 'string' ? song.code.trim() : '';
    if (!name || name.length > 80 || !code || code.length > 300) {
      throw new HttpError(400, 'Each song needs a name and Spotify code');
    }
    if (!/^https:\/\/open\.spotify\.com\/(embed\/)?track\/[A-Za-z0-9]+(?:\?.*)?$/.test(code)
      && !/^spotify:track:[A-Za-z0-9]+$/.test(code)) {
      throw new HttpError(400, 'Use a Spotify track link or Spotify track code');
    }
    return { name, code };
  });
}

function cleanAvatar(avatar) {
  if (avatar === '') return '';
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (typeof avatar !== 'string' || avatar.length > 500
    || !cloudName
    || !avatar.startsWith(`https://res.cloudinary.com/${cloudName}/image/upload/`)) {
    throw new HttpError(400, 'Profile photo must be uploaded through the app');
  }
  return avatar;
}

router.post('/signup', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const name = cleanName(req.body && req.body.name);
  const mail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(mail)) throw new HttpError(400, 'Enter a valid email');
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters');
  }
  if (await User.exists({ email: mail })) {
    throw new HttpError(409, 'An account with this email already exists. Try logging in');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: mail, passwordHash });
  res.status(201).json({ token: signToken(user), user: user.toPublic() });
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const mail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const user = await User.findOne({ email: mail }).select('+passwordHash');
  const ok = user && typeof password === 'string' && await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Email or password is wrong');
  res.json({ token: signToken(user), user: user.toPublic() });
}));

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

// Change profile details, report colours, profile photo, or Spotify songs.
router.patch('/me', requireAuth, wrap(async (req, res) => {
  const { name, colorPair, avatar, songs } = req.body || {};
  if (name !== undefined) req.user.name = cleanName(name);
  if (colorPair !== undefined) {
    if (!COLOR_PAIRS.includes(colorPair)) throw new HttpError(400, 'Unknown colour');
    req.user.colorPair = colorPair;
  }
  if (avatar !== undefined) req.user.avatar = cleanAvatar(avatar);
  if (songs !== undefined) req.user.songs = cleanSongs(songs);
  await req.user.save();
  res.json({ user: req.user.toPublic() });
}));

module.exports = router;
