import { api } from './api';
import { MAX_VIDEO_SECONDS } from './constants';

// Shrinks big phone photos before uploading (max 1600px, JPEG)
async function shrinkImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    return blob || file;
  } catch {
    return file;
  }
}

// Reads how long a video or audio file is, in seconds
export function mediaDuration(file, kind = 'video') {
  return new Promise((resolve) => {
    const el = document.createElement(kind === 'video' ? 'video' : 'audio');
    el.preload = 'metadata';
    const url = URL.createObjectURL(file);
    const done = (v) => { URL.revokeObjectURL(url); resolve(v); };
    el.onloadedmetadata = () => {
      // Some recordings report Infinity until seeked
      if (el.duration === Infinity) {
        el.currentTime = 1e9;
        el.ontimeupdate = () => { el.ontimeupdate = null; done(el.duration); };
      } else done(el.duration);
    };
    el.onerror = () => done(NaN);
    el.src = url;
  });
}

// kind: 'photo' | 'voice' | 'video'. Returns { url, publicId, duration? }
export async function uploadMedia(groupId, kind, file, onProgress) {
  if (kind === 'video') {
    const secs = await mediaDuration(file, 'video');
    if (Number.isFinite(secs) && secs > MAX_VIDEO_SECONDS + 0.5) {
      throw new Error('That video is longer than 1 minute. Trim it and try again');
    }
    if (file.size > 95 * 1024 * 1024) throw new Error('That video file is too big. Try recording at a lower quality');
  }
  const body = kind === 'photo' ? await shrinkImage(file) : file;
  const sig = await api(`/groups/${groupId}/uploads/signature`, { method: 'POST', body: { kind } });
  const form = new FormData();
  form.append('file', body);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);
  if (sig.transformation) form.append('transformation', sig.transformation);

  const result = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error((data.error && data.error.message) || 'Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Upload failed. Check your internet and try again'));
    xhr.send(form);
  });

  const out = { url: result.secure_url, publicId: result.public_id };
  if (kind !== 'photo') {
    let d = Number(result.duration);
    if (!Number.isFinite(d)) d = await mediaDuration(file, kind === 'video' ? 'video' : 'audio');
    const cap = kind === 'video' ? MAX_VIDEO_SECONDS : 300;
    out.duration = Number.isFinite(d) ? Math.min(d, cap) : 0;
  }
  return out;
}
