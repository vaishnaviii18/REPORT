const mongoose = require('mongoose');

// Daily snap: one photo per person, per group, per day
const snapSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    photo: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    caption: { type: String, default: '', maxlength: 200 },
  },
  { timestamps: true },
);

snapSchema.index({ group: 1, user: 1, date: 1 }, { unique: true });
snapSchema.index({ group: 1, date: 1 });

module.exports = mongoose.model('Snap', snapSchema);
