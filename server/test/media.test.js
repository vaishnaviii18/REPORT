const test = require('node:test');
const assert = require('node:assert');

process.env.CLOUDINARY_CLOUD_NAME = 'demo';
process.env.CLOUDINARY_API_KEY = '123';
const { signUpload, uploadSignature, cleanMedia } = require('../src/utils/media');

test('signature matches Cloudinary documentation example', () => {
  process.env.CLOUDINARY_API_SECRET = 'abcd';
  const sig = signUpload({
    eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop',
    public_id: 'sample_image',
    timestamp: 1315060510,
  });
  assert.strictEqual(sig, 'bfd09f95f331f558cbd1320e67aa8d488770583e');
});

test('video uploads are trimmed to 60 seconds', () => {
  process.env.CLOUDINARY_API_SECRET = 'abcd';
  const v = uploadSignature({ folder: 'f', kind: 'video' });
  assert.strictEqual(v.transformation, 'du_60');
  assert.strictEqual(v.resourceType, 'video');
  const p = uploadSignature({ folder: 'f', kind: 'photo' });
  assert.strictEqual(p.transformation, undefined);
  assert.strictEqual(p.resourceType, 'image');
});

test('media must come from our Cloudinary account', () => {
  const good = { url: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg', publicId: 'a' };
  assert.deepStrictEqual(cleanMedia(good, 'photo'), good);
  assert.throws(() => cleanMedia({ url: 'https://evil.com/a.jpg', publicId: 'a' }, 'photo'));
  assert.strictEqual(cleanMedia(null, 'photo'), null);
});

test('videos over a minute are refused', () => {
  const base = { url: 'https://res.cloudinary.com/demo/video/upload/v1/a.mp4', publicId: 'a' };
  assert.strictEqual(cleanMedia({ ...base, duration: 59.94 }, 'video').duration, 59.9);
  assert.throws(() => cleanMedia({ ...base, duration: 75 }, 'video'), /1 minute/);
  assert.throws(() => cleanMedia(base, 'video'), /length/);
});
