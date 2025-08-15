const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true //to remove extra spaces before & after the string value upon saving to db
    },
    password: { type: String, required: true, minlength: 8, select: false },

    // New profile fields
    phone: { type: String, trim: true },
    pronouns: {
      type: String,
      enum: ['she/her', 'he/him', 'they/them', 'prefer not to say'],
      default: 'prefer not to say'
    },
    secondaryEmail: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
