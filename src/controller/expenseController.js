const BaseController = require('./baseController');
const expenseService = require('../service/expenseService');

class ExpenseController extends BaseController {
  constructor() {
    super('ExpenseController');
  }

  async createExpense(req, res) {
    try {
      const { orgId } = req.params;
      const { submitterId, expenseTypeId, amount, description } = req.body;

      const expense = await expenseService.createExpense(
        orgId,
        submitterId,
        expenseTypeId,
        amount,
        description
      );

      this.sendSuccess(res, expense, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async listExpenses(req, res) {
    try {
      const { orgId } = req.params;
      const { status } = req.query;

      const expenses = await expenseService.listExpenses(orgId, status);
      this.sendSuccess(res, expenses);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getExpense(req, res) {
    try {
      const { expenseId } = req.params;

      const expense = await expenseService.getExpense(expenseId);
      this.sendSuccess(res, expense);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async submitExpense(req, res) {
    try {
      const { expenseId } = req.params;
      const { submitterId } = req.body;

      const expense = await expenseService.submitExpense(expenseId, submitterId);
      this.sendSuccess(res, expense);
    } catch (error) {
      this.sendError(res, error);
    }
  }
}

module.exports = new ExpenseController();
