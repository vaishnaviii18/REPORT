const mongoose = require('mongoose');
const { COLOR_PAIRS } = require('./constants');

const songSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    code: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    email: {
      type: String, required: true, unique: true, lowercase: true, trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    colorPair: { type: String, enum: COLOR_PAIRS, default: 'pink-yellow' },
    avatar: { type: String, default: '' },
    songs: { type: [songSchema], default: [] },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  },
  { timestamps: true },
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    colorPair: this.colorPair,
    avatar: this.avatar,
    songs: this.songs,
    groups: this.groups,
  };
};

module.exports = mongoose.model('User', userSchema);
