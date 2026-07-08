const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  fullName:  { type: String },
  email:     { type: String, unique: true, lowercase: true },
  phone:     { type: String },
  // VULN: Password stored as plain text - no bcrypt hashing
  password:  { type: String },
  walletId:  { type: String, unique: true, default: () => 'SP-' + uuidv4().split('-')[0].toUpperCase() },
  role:      { type: String, default: 'user' },
  balance:   { type: Number, default: 0 },
  securityScore: { type: Number, default: 72 },
  // VULN: loginAttempts tracked but never used to lock account
  loginAttempts: { type: Number, default: 0 },
  lastLogin: { type: Date, default: null }
}, { timestamps: true });

// VULN: Plain text comparison - no bcrypt, vulnerable to timing attacks
userSchema.methods.comparePassword = function(candidate) {
  return this.password === candidate;
};

module.exports = mongoose.model('User', userSchema);
