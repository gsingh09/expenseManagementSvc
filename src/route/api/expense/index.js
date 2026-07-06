const express = require('express');

const router = express.Router();

// Mount expense routes for each organization
// POST /api/organizations/:orgId/expenses
// GET /api/organizations/:orgId/expenses
// etc.
router.use('/:orgId/expenses', require('./expense.route'));

module.exports = router;
