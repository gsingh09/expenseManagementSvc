const express = require('express');

const router = express.Router();

// Ping
router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

// Admin routes
router.use('/admin', require('./admin/index'));

// Expense routes
router.use('/organizations', require('./expense/index'));

// Approval routes
router.use('/users', require('./approval/index'));

module.exports = router;
