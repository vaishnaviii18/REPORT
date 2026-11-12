const mongoose = require('mongoose');

// Remembers nudges so one person can't spam another
const nudgeSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: ['report', 'snap'], required: true },
  },
  { timestamps: true },
);

nudgeSchema.index({ from: 1, to: 1, kind: 1, createdAt: -1 });
// Old nudges clean themselves up after 7 days
nudgeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });

module.exports = mongoose.model('Nudge', nudgeSchema);
