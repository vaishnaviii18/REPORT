const mongoose = require('mongoose');
const { LETTER_KEYS, REACTIONS } = require('./constants');

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    duration: { type: Number }, // seconds, for voice and video
  },
  { _id: false },
);

const letterSchema = new mongoose.Schema(
  {
    text: { type: String, default: '' },
    photo: { type: mediaSchema, default: null },
    voice: { type: mediaSchema, default: null },
    video: { type: mediaSchema, default: null },
  },
  { _id: false },
);

const lettersShape = {};
LETTER_KEYS.forEach((k) => { lettersShape[k] = { type: letterSchema, default: () => ({}) }; });

const reportSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: String, required: true }, // 'YYYY-MM-DD' (Monday)
    letters: { type: new mongoose.Schema(lettersShape, { _id: false }), default: () => ({}) },
    submittedAt: { type: Date, default: null },
    reactions: [
      {
        _id: false,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        kind: { type: String, enum: REACTIONS, required: true },
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// One report per person, per group, per week
reportSchema.index({ group: 1, user: 1, weekStart: 1 }, { unique: true });
reportSchema.index({ group: 1, weekStart: 1 });

// A letter counts as filled when it has text or any media
function isLetterFilled(l) {
  if (!l) return false;
  return Boolean((l.text && l.text.trim()) || l.photo || l.voice || l.video);
}

reportSchema.methods.filledCount = function filledCount() {
  return LETTER_KEYS.filter((k) => isLetterFilled(this.letters && this.letters[k])).length;
};

reportSchema.statics.isLetterFilled = isLetterFilled;

module.exports = mongoose.model('Report', reportSchema);
