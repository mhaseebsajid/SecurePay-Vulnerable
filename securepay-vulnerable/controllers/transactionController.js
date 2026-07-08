const User = require('../models/User');
const Transaction = require('../models/Transaction');

// POST /api/transfer
exports.transfer = async (req, res) => {
  try {
    const { receiverEmail, amount, description } = req.body;

    const receiver = await User.findOne({ email: receiverEmail });
    if (!receiver) return res.status(404).json({ success: false, message: 'Receiver not found' });

    const sender = await User.findById(req.user._id);

    // VULN: No balance check - sender can go negative
    // VULN: No amount validation - negative values steal money from receiver
    // VULN: description saved with no XSS sanitization (Stored XSS)
    await User.findByIdAndUpdate(sender._id, { $inc: { balance: -amount } });
    await User.findByIdAndUpdate(receiver._id, { $inc: { balance: amount } });

    const transaction = await Transaction.create({
      sender: sender._id, receiver: receiver._id,
      senderWalletId: sender.walletId, receiverWalletId: receiver.walletId,
      receiverEmail: receiver.email,
      amount, description,   // VULN: raw unsanitized description stored
      status: 'completed', completedAt: new Date()
    });

    const updatedSender = await User.findById(sender._id);
    res.status(201).json({ success: true, message: 'Transfer completed.', transaction, newBalance: updatedSender.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    // VULN: IDOR - pass ?userId=anyId to read any user's transactions
    const targetUserId = req.query.userId || req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const transactions = await Transaction.find({
      $or: [{ sender: targetUserId }, { receiver: targetUserId }]
    })
    // VULN: Populates password field - exposed to caller
    .populate('sender', 'fullName email walletId password')
    .populate('receiver', 'fullName email walletId password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit).limit(limit);

    const total = await Transaction.countDocuments({ $or: [{ sender: targetUserId }, { receiver: targetUserId }] });
    res.status(200).json({ success: true, count: transactions.length, total, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};
