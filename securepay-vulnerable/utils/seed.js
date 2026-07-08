require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const generateWalletId = () => 'SP-' + uuidv4().split('-')[0].toUpperCase();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/securepay_vulnerable');
    console.log('Connected to MongoDB');
    await User.deleteMany({});
    await Transaction.deleteMany({});

    // VULN: All passwords plain text and weak
    const users = await User.insertMany([
      { fullName: 'Admin User',   email: 'admin@securepay.com', phone: '+1-555-000-0001', password: 'admin123',  walletId: generateWalletId(), role: 'admin', balance: 50000, securityScore: 82 },
      { fullName: 'Alice Johnson',email: 'alice@example.com',   phone: '+1-555-100-2001', password: 'password',  walletId: generateWalletId(), balance: 12450.75, securityScore: 88 },
      { fullName: 'Bob Martinez', email: 'bob@example.com',     phone: '+1-555-100-3002', password: '123456',    walletId: generateWalletId(), balance: 3800.00,  securityScore: 72 },
      { fullName: 'Carol White',  email: 'carol@example.com',   phone: '+1-555-100-4003', password: 'carol123',  walletId: generateWalletId(), balance: 27900.50, securityScore: 95 },
      { fullName: 'David Kim',    email: 'david@example.com',   phone: '+1-555-100-5004', password: 'qwerty',    walletId: generateWalletId(), balance: 5200.00,  securityScore: 60 }
    ]);

    const [admin, alice, bob, carol, david] = users;

    await Transaction.insertMany([
      { transactionId:'TX-'+uuidv4().split('-')[0].toUpperCase(), sender:alice._id, receiver:bob._id, senderWalletId:alice.walletId, receiverWalletId:bob.walletId, receiverEmail:bob.email, amount:1240.00, description:'AWS Payment', status:'completed', completedAt:new Date(Date.now()-86400000) },
      { transactionId:'TX-'+uuidv4().split('-')[0].toUpperCase(), sender:bob._id, receiver:carol._id, senderWalletId:bob.walletId, receiverWalletId:carol.walletId, receiverEmail:carol.email, amount:450.00, description:'Server fees', status:'completed', completedAt:new Date(Date.now()-172800000) },
      { transactionId:'TX-'+uuidv4().split('-')[0].toUpperCase(), sender:carol._id, receiver:alice._id, senderWalletId:carol.walletId, receiverWalletId:alice.walletId, receiverEmail:alice.email, amount:2000.00, description:'Freelance payment', status:'pending', completedAt:null },
      { transactionId:'TX-'+uuidv4().split('-')[0].toUpperCase(), sender:david._id, receiver:alice._id, senderWalletId:david.walletId, receiverWalletId:alice.walletId, receiverEmail:alice.email, amount:8500.00, description:'GlobalX wire', status:'completed', completedAt:new Date(Date.now()-345600000) },
      { transactionId:'TX-'+uuidv4().split('-')[0].toUpperCase(), sender:alice._id, receiver:bob._id, senderWalletId:alice.walletId, receiverWalletId:bob.walletId, receiverEmail:bob.email, amount:12.50, description:'Coffee House', status:'failed', completedAt:null }
    ]);

    console.log('\n Seed complete!');
    console.log('Accounts (plain text passwords):');
    console.log('  admin@securepay.com  /  admin123');
    console.log('  alice@example.com    /  password');
    console.log('  bob@example.com      /  123456');
    console.log('  carol@example.com    /  carol123');
    console.log('  david@example.com    /  qwerty\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

seed();
