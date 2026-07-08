const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema({
  transactionId:    { type: String, default: () => 'TX-' + uuidv4().split('-')[0].toUpperCase() },
  sender:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderWalletId:   { type: String },
  receiverWalletId: { type: String },
  receiverEmail:    { type: String },
  // VULN: No min validation - negative amounts allowed
  amount:           { type: Number },
  type:             { type: String, default: 'transfer' },
  status:           { type: String, default: 'completed' },
  // VULN: No XSS sanitization on description
  description:      { type: String },
  completedAt:      { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
