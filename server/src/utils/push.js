const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

let ready = false;
function setup() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    ready = true;
  } else {
    console.warn('Phone notifications are off: VAPID keys missing');
  }
}

// Sends a notification to every phone a user has signed up.
// payload: { title, body, url }
async function notifyUser(userId, payload) {
  if (!ready) return 0;
  const subs = await PushSubscription.find({ user: userId });
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } },
        JSON.stringify(payload),
        { TTL: 12 * 3600 },
      );
      sent += 1;
    } catch (err) {
      // 404/410 = the phone unsubscribed or the app was removed
      if (err.statusCode === 404 || err.statusCode === 410) {
        await PushSubscription.deleteOne({ _id: s._id });
      } else {
        console.error('Push failed', err.statusCode || err.message);
      }
    }
  }));
  return sent;
}

async function notifyUsers(userIds, payload) {
  const results = await Promise.all(userIds.map((id) => notifyUser(id, payload)));
  return results.reduce((a, b) => a + b, 0);
}

module.exports = { setup, notifyUser, notifyUsers };
