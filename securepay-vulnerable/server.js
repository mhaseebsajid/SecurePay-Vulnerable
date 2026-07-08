require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

connectDB();
const app = express();

// VULN: No Helmet - missing all security headers (XSS, clickjacking, HSTS, CSP, etc.)

// VULN: CORS open to ALL origins - any website can call this API (CSRF possible)
app.use(cors({ origin: '*', credentials: true, methods: '*', allowedHeaders: '*' }));

// VULN: Huge body limit - DoS possible with large payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// VULN: Morgan logs full requests including Authorization headers with tokens
app.use(morgan('combined'));

// Serve frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// All routes - no rate limiting anywhere
app.use('/api', require('./routes/index'));

// VULN: Health check exposes JWT secret and DB connection string
app.get('/api/health', (req, res) => {
  res.json({
    status: 'running',
    jwtSecret: process.env.JWT_SECRET,   // VULN: Never expose this
    mongoUri: process.env.MONGO_URI,     // VULN: Never expose this
    environment: process.env.NODE_ENV,
    nodeVersion: process.version
  });
});

// VULN: Global error handler returns full stack traces
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    error: err.message,
    stack: err.stack,       // VULN: Reveals file paths and code structure
    body: req.body          // VULN: May echo back passwords
  });
});

// VULN: Binds to 0.0.0.0 - accessible from all network interfaces
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SecurePay server running on http://localhost:${PORT}`);
  console.log(`Open endpoints: /api/debug  /api/health  /api/admin/all-users`);
});

module.exports = app;
