const express = require('express');
const { requireAuth, requireMember } = require('../middleware/auth');
const { HttpError, wrap } = require('../utils/http');
const { uploadSignature } = require('../utils/media');
const { MEDIA_KINDS } = require('../models/constants');

// Mounted at /api/groups/:groupId/uploads
const router = express.Router({ mergeParams: true });
router.use(requireAuth, requireMember);

// The app asks for a signature, then uploads the file straight to Cloudinary.
// body: { kind: 'photo' | 'voice' | 'video' }
router.post('/signature', wrap(async (req, res) => {
  const { kind } = req.body || {};
  if (!MEDIA_KINDS.includes(kind)) throw new HttpError(400, 'Unknown file type');
  const folder = `the-report/${req.group._id}/${kind}`;
  res.json(uploadSignature({ folder, kind }));
}));

module.exports = router;
