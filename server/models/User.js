const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  // For verification module, we might store captured snapshots during exam for an ongoing session
  // But usually, snapshots are stored per exam attempt. We'll store it in the Result/Attempt schema.
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
