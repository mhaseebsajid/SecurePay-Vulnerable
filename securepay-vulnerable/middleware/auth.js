const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer '))
    token = req.headers.authorization.split(' ')[1];
  // VULN: Token accepted via URL query param - gets logged in server logs
  if (req.query.token) token = req.query.token;

  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    // VULN: Weak secret "secret123"
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token', error: error.message });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin only', yourRole: req.user?.role });
  next();
};

module.exports = { protect, adminOnly };
