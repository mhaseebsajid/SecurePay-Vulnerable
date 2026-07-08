const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { getWallet, deposit } = require('../controllers/walletController');
const { transfer, getTransactions } = require('../controllers/transactionController');
const User = require('../models/User');

// VULN: No rate limiting on any route
router.post('/register', register);
router.post('/login', login);      // Brute force freely
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// Wallet
router.get('/wallet', protect, getWallet);
router.post('/wallet/deposit', protect, deposit);

// Transactions
router.post('/transfer', protect, transfer);
router.get('/transactions', protect, getTransactions);

// VULN: Admin route requires NO authentication - anyone can call it
router.get('/admin/all-users', async (req, res) => {
  try {
    const users = await User.find(); // Returns ALL users with plain text passwords
    res.json({ success: true, count: users.length, users });
  } catch (e) { res.json({ success: false, message: e.message }); }
});

// VULN: Debug route exposes ALL environment variables including JWT secret
router.get('/debug', (req, res) => {
  res.json({
    env: process.env,
    nodeVersion: process.version,
    serverPath: process.cwd(),
    memory: process.memoryUsage()
  });
});

module.exports = router;
