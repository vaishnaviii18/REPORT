const mongoose = require('mongoose');
const { COLOR_PAIRS } = require('./constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    email: {
      type: String, required: true, unique: true, lowercase: true, trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    colorPair: { type: String, enum: COLOR_PAIRS, default: 'pink-yellow' },
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
    groups: this.groups,
  };
};

module.exports = mongoose.model('User', userSchema);
