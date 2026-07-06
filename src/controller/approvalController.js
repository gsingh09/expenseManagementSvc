const BaseController = require('./baseController');
const approvalService = require('../service/approvalService');
const auditHelper = require('../serviceHelper/auditHelper');

class ApprovalController extends BaseController {
  constructor() {
    super('ApprovalController');
  }

  async getPendingApprovals(req, res) {
    try {
      const { userId } = req.params;

      const pending = await approvalService.getPendingApprovalsForUser(userId);
      this.sendSuccess(res, pending);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async approveExpense(req, res) {
    try {
      const { expenseId } = req.params;
      const { approverId, comments } = req.body;

      const approval = await approvalService.approveExpense(expenseId, approverId, comments);
      this.sendSuccess(res, approval, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async rejectExpense(req, res) {
    try {
      const { expenseId } = req.params;
      const { approverId, comments } = req.body;

      const approval = await approvalService.rejectExpense(expenseId, approverId, comments);
      this.sendSuccess(res, approval, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async requestModification(req, res) {
    try {
      const { expenseId } = req.params;
      const { approverId, comments } = req.body;

      const approval = await approvalService.requestModification(expenseId, approverId, comments);
      this.sendSuccess(res, approval, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getAuditLog(req, res) {
    try {
      const { expenseId } = req.params;

      const logs = await auditHelper.getExpenseAudit(expenseId);
      this.sendSuccess(res, logs);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getApprovalHistory(req, res) {
    try {
      const { expenseId } = req.params;

      const history = await approvalService.getExpenseApprovalHistory(expenseId);
      this.sendSuccess(res, history);
    } catch (error) {
      this.sendError(res, error);
    }
  }
}

module.exports = new ApprovalController();
