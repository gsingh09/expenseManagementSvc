const express = require('express');

const router = express.Router();

// Mount approval routes for each user
// GET /api/users/:userId/pending-approvals
// POST /api/users/:userId/approvals/:expenseId/approve
// etc.
router.use('/:userId', require('./approval.route'));

module.exports = router;
