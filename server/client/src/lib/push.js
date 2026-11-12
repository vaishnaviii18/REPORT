import { api } from './api';

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// Asks the phone for permission and tells the server where to send notifications
export async function turnOnNotifications() {
  if (!pushSupported()) throw new Error("This browser can't show notifications. Open the app in Chrome");
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications are blocked. Allow them in Chrome settings for this site');
  const { publicKey } = await api('/push/public-key');
  if (!publicKey) throw new Error('Notifications are not set up on the server yet');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  await api('/push/subscribe', { method: 'POST', body: sub.toJSON() });
  return true;
}

export async function turnOffNotifications() {
  const sub = await currentSubscription();
  if (!sub) return;
  await api('/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe();
}
