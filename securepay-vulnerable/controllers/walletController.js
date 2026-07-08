const User = require('../models/User');
const Transaction = require('../models/Transaction');

// GET /api/wallet
exports.getWallet = async (req, res) => {
  try {
    // VULN: IDOR - pass ?id=anyUserId to view any wallet
    const userId = req.query.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });

    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const monthlySpending = await Transaction.aggregate([
      { $match: { sender: user._id, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyDeposits = await Transaction.aggregate([
      { $match: { receiver: user._id, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      wallet: {
        walletId: user.walletId, balance: user.balance,
        securityScore: user.securityScore,
        monthlySpending: monthlySpending[0]?.total || 0,
        recentDeposits: monthlyDeposits[0]?.total || 0,
        // VULN: Returns sensitive fields
        email: user.email, password: user.password, phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// POST /api/wallet/deposit
exports.deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    // VULN: No limit on deposit amount, negative deposits allowed
    const user = await User.findByIdAndUpdate(req.user._id, { $inc: { balance: amount } }, { new: true });
    res.status(200).json({ success: true, message: `Deposited successfully.`, newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};
