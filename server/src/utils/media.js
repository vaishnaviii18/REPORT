const crypto = require('crypto');
const { HttpError } = require('./http');
const { MAX_VIDEO_SECONDS, MAX_VOICE_SECONDS } = require('../models/constants');

// Cloudinary signed upload: the phone uploads straight to Cloudinary,
// the server only signs the request so the API secret never leaves the server.
// https://cloudinary.com/documentation/authentication_signatures
function signUpload(params) {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) throw new HttpError(500, 'Cloudinary is not set up yet');
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + secret).digest('hex');
}

// kind: 'photo' | 'voice' | 'video'
// For video and voice, Cloudinary trims anything longer than the limit on upload
// (du_ = duration), so the limit holds even if someone skips the app's check.
function uploadSignature({ folder, kind }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  if (kind === 'video') params.transformation = `du_${MAX_VIDEO_SECONDS}`;
  if (kind === 'voice') params.transformation = `du_${MAX_VOICE_SECONDS}`;
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    // photos upload as images; voice notes and videos both upload as "video" in Cloudinary
    resourceType: kind === 'photo' ? 'image' : 'video',
    ...params,
    signature: signUpload(params),
  };
}

// Checks media info sent by the app really points at our Cloudinary account
// and respects the limits. Returns a clean object to store.
function cleanMedia(input, kind) {
  if (input === null) return null;
  if (!input || typeof input !== 'object') throw new HttpError(400, `Invalid ${kind}`);
  const { url, publicId } = input;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const prefix = `https://res.cloudinary.com/${cloud}/`;
  if (typeof url !== 'string' || !url.startsWith(prefix)) throw new HttpError(400, `Invalid ${kind} link`);
  if (typeof publicId !== 'string' || !publicId || publicId.length > 300) throw new HttpError(400, `Invalid ${kind}`);
  const out = { url, publicId };
  if (kind === 'video' || kind === 'voice') {
    const duration = Number(input.duration);
    if (!Number.isFinite(duration) || duration < 0) throw new HttpError(400, `Missing ${kind} length`);
    const max = kind === 'video' ? MAX_VIDEO_SECONDS : MAX_VOICE_SECONDS;
    // small allowance for rounding
    if (duration > max + 1) {
      throw new HttpError(400, kind === 'video' ? 'Videos must be 1 minute or less' : 'Voice notes must be 5 minutes or less');
    }
    out.duration = Math.round(duration * 10) / 10;
  }
  return out;
}

module.exports = { signUpload, uploadSignature, cleanMedia };
