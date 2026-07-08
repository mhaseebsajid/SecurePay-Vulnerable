const jwt = require('jsonwebtoken');
const User = require('../models/User');

// VULN: Weak secret, token valid for 999 days
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '999d' });

// POST /api/register
exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // VULN: No input validation - empty/weak passwords accepted
    const existing = await User.findOne({ email });
    if (existing) {
      // VULN: Confirms email exists (user enumeration)
      return res.status(400).json({ success: false, message: `Email ${email} is already registered.` });
    }

    // VULN: Password saved in plain text
    const user = await User.create({ fullName, email, phone, password });
    const token = signToken(user._id);

    res.status(201).json({
      success: true, token,
      user: {
        id: user._id, fullName: user.fullName, email: user.email,
        phone: user.phone,
        password: user.password,   // VULN: Plain text password returned in response
        walletId: user.walletId, role: user.role,
        balance: user.balance, securityScore: user.securityScore
      }
    });
  } catch (error) {
    // VULN: Full stack trace returned to client
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// POST /api/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // VULN: NoSQL injection possible if email = { "$gt": "" }
    const user = await User.findOne({ email });

    if (!user) {
      // VULN: Different message reveals whether email exists
      return res.status(401).json({ success: false, message: `No account found with email: ${email}` });
    }

    // VULN: Plain text comparison, no rate limiting, no lockout
    const isMatch = user.comparePassword(password);
    if (!isMatch) {
      await User.findByIdAndUpdate(user._id, { $inc: { loginAttempts: 1 } });
      // VULN: Confirms the email IS valid
      return res.status(401).json({
        success: false,
        message: 'Wrong password',
        attempts: user.loginAttempts + 1,
        hint: 'Account will never lock - keep trying!'  // VULN: Informs attacker
      });
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date(), loginAttempts: 0 });
    const token = signToken(user._id);

    res.status(200).json({
      success: true, token,
      user: {
        id: user._id, fullName: user.fullName, email: user.email,
        password: user.password,   // VULN: Returns plain text password on login
        walletId: user.walletId, role: user.role,
        balance: user.balance, securityScore: user.securityScore,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// POST /api/logout
exports.logout = async (req, res) => {
  // VULN: No server-side token invalidation - token stays valid for 999 days
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// GET /api/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user }); // VULN: Returns full user with password
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};
