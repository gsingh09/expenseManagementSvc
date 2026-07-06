const express = require('express');
const expenseController = require('../../../controller/expenseController');

const router = express.Router();

// Expense CRUD
router.post('/', (req, res) => expenseController.createExpense(req, res));

router.get('/', (req, res) => expenseController.listExpenses(req, res));

router.get('/:expenseId', (req, res) => expenseController.getExpense(req, res));

router.post('/:expenseId/submit', (req, res) => expenseController.submitExpense(req, res));

module.exports = router;
