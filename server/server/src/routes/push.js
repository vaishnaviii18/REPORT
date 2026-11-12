const express = require('express');
const PushSubscription = require('../models/PushSubscription');
const { requireAuth } = require('../middleware/auth');
const { HttpError, wrap } = require('../utils/http');

const router = express.Router();

// The app needs this public key to ask the phone for permission
router.get('/public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// body: the subscription object from the browser { endpoint, keys: { p256dh, auth } }
router.post('/subscribe', requireAuth, wrap(async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')
    || !keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') {
    throw new HttpError(400, 'Invalid notification setup');
  }
  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { user: req.user._id, endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
    { upsert: true },
  );
  res.json({ ok: true });
}));

router.post('/unsubscribe', requireAuth, wrap(async (req, res) => {
  const { endpoint } = req.body || {};
  await PushSubscription.deleteOne({ endpoint, user: req.user._id });
  res.json({ ok: true });
}));

module.exports = router;
