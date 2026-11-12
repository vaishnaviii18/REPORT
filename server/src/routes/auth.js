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

// Change name or report colours
router.patch('/me', requireAuth, wrap(async (req, res) => {
  const { name, colorPair } = req.body || {};
  if (name !== undefined) req.user.name = cleanName(name);
  if (colorPair !== undefined) {
    if (!COLOR_PAIRS.includes(colorPair)) throw new HttpError(400, 'Unknown colour');
    req.user.colorPair = colorPair;
  }
  await req.user.save();
  res.json({ user: req.user.toPublic() });
}));

module.exports = router;
