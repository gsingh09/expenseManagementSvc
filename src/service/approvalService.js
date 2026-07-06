const BaseService = require('./baseService');
const { getDb } = require('../dataAccessor/mysql/databaseHandler');
const NotFoundError = require('../exception/notFoundError');
const BadRequestError = require('../exception/badRequestError');
const ForbiddenError = require('../exception/forbiddenError');
const auditHelper = require('../serviceHelper/auditHelper');
const workflowExecutor = require('../serviceHelper/workflowExecutor');
const { APPROVAL_ACTIONS, EXPENSE_STATUS, ERROR_CODES } = require('../constant/constants');

class ApprovalService extends BaseService {
  constructor() {
    super('ApprovalService');
  }

  async getPendingApprovalsForUser(userId) {
    const { Expense, ExpenseApproval, ApprovalWorkflow, ApprovalStep, User } = getDb().models;

    // Get all active expense approvals where this user hasn't yet approved
    const pendingExpenses = await Expense.findAll({
      where: {
        status: { [require('sequelize').Op.in]: [EXPENSE_STATUS.SUBMITTED, EXPENSE_STATUS.PENDING_APPROVAL] }
      },
      include: [
        {
          association: 'submitter',
          attributes: ['id', 'email', 'first_name', 'last_name']
        },
        {
          association: 'approvals',
          attributes: ['id', 'action', 'approver_id'],
          separate: true
        }
      ]
    });

    // Filter to only expenses where this user could be the next approver
    const result = [];

    for (const expense of pendingExpenses) {
      const workflow = await ApprovalWorkflow.findByPk(expense.workflow_id);
      const currentStep = await ApprovalStep.findOne({
        where: {
          workflow_id: workflow.id,
          step_order: expense.current_approval_step
        }
      });

      const approverData = await workflowExecutor.getNextApprover(expense, currentStep, workflow);

      // Check if user is in the list of approvers for this step
      const isApprover = approverData.approvers.some(a => a.id === userId);
      if (isApprover) {
        result.push({
          id: expense.id,
          submitter: expense.submitter,
          amount: expense.amount,
          status: expense.status,
          current_step: expense.current_approval_step,
          created_at: expense.createdAt
        });
      }
    }

    return result;
  }

  async approveExpense(expenseId, approverId, comments = null) {
    const { Expense, ExpenseApproval, ApprovalStep, ApprovalWorkflow, User } = getDb().models;

    const expense = await Expense.findByPk(expenseId);
    if (!expense) {
      throw new NotFoundError(`Expense not found`, ERROR_CODES.EXPENSE_NOT_FOUND);
    }

    if (expense.status === EXPENSE_STATUS.REJECTED || expense.status === EXPENSE_STATUS.APPROVED) {
      throw new BadRequestError(
        `Cannot approve a ${expense.status} expense`,
        ERROR_CODES.INVALID_EXPENSE_STATUS_TRANSITION
      );
    }

    // Verify approver is authorized for this step
    const workflow = await ApprovalWorkflow.findByPk(expense.workflow_id);
    const currentStepData = await ApprovalStep.findOne({
      where: { workflow_id: workflow.id, step_order: expense.current_approval_step }
    });

    const approverData = await workflowExecutor.getNextApprover(expense, currentStepData, workflow);
    const isAuthorized = approverData.approvers.some(a => a.id === approverId);

    if (!isAuthorized) {
      throw new ForbiddenError(
        `User not authorized to approve at this step`,
        ERROR_CODES.UNAUTHORIZED_APPROVAL
      );
    }

    // Create approval record
    const approval = await ExpenseApproval.create({
      expense_id: expenseId,
      approver_id: approverId,
      action: APPROVAL_ACTIONS.APPROVED,
      step_number: expense.current_approval_step,
      comments
    });

    await auditHelper.logAction(expenseId, approverId, 'APPROVED_BY_APPROVER',
      { step: expense.current_approval_step },
      { approval_id: approval.id, comments }
    );

    // Advance to next step or complete
    const expenseService = require('./expenseService');
    const nextStep = await expenseService.advanceApprovalStep(expenseId, approverId);

    this.logInfo(`Expense ${expenseId} approved at step ${expense.current_approval_step}`);
    return approval;
  }

  async rejectExpense(expenseId, approverId, comments) {
    const { Expense, ExpenseApproval, ApprovalStep, ApprovalWorkflow } = getDb().models;

    if (!comments) {
      throw new BadRequestError(`Rejection comments are required`, ERROR_CODES.VALIDATION_ERROR);
    }

    const expense = await Expense.findByPk(expenseId);
    if (!expense) {
      throw new NotFoundError(`Expense not found`, ERROR_CODES.EXPENSE_NOT_FOUND);
    }

    if (expense.status === EXPENSE_STATUS.REJECTED) {
      throw new BadRequestError(`Expense already rejected`, ERROR_CODES.INVALID_EXPENSE_STATUS_TRANSITION);
    }

    // Verify approver is authorized
    const workflow = await ApprovalWorkflow.findByPk(expense.workflow_id);
    const currentStepData = await ApprovalStep.findOne({
      where: { workflow_id: workflow.id, step_order: expense.current_approval_step }
    });

    const approverData = await workflowExecutor.getNextApprover(expense, currentStepData, workflow);
    const isAuthorized = approverData.approvers.some(a => a.id === approverId);

    if (!isAuthorized) {
      throw new ForbiddenError(
        `User not authorized to reject at this step`,
        ERROR_CODES.UNAUTHORIZED_APPROVAL
      );
    }

    // Create rejection record
    const approval = await ExpenseApproval.create({
      expense_id: expenseId,
      approver_id: approverId,
      action: APPROVAL_ACTIONS.REJECTED,
      step_number: expense.current_approval_step,
      comments
    });

    // Update expense status
    await expense.update({ status: EXPENSE_STATUS.REJECTED });

    await auditHelper.logAction(expenseId, approverId, 'REJECTED',
      { status: expense.status, step: expense.current_approval_step },
      { status: EXPENSE_STATUS.REJECTED, comments }
    );

    this.logInfo(`Expense ${expenseId} rejected at step ${expense.current_approval_step}`);
    return approval;
  }

  async requestModification(expenseId, approverId, comments) {
    const { Expense, ExpenseApproval, ApprovalStep, ApprovalWorkflow } = getDb().models;

    if (!comments) {
      throw new BadRequestError(`Comments are required`, ERROR_CODES.VALIDATION_ERROR);
    }

    const expense = await Expense.findByPk(expenseId);
    if (!expense) {
      throw new NotFoundError(`Expense not found`, ERROR_CODES.EXPENSE_NOT_FOUND);
    }

    // Verify approver is authorized
    const workflow = await ApprovalWorkflow.findByPk(expense.workflow_id);
    const currentStepData = await ApprovalStep.findOne({
      where: { workflow_id: workflow.id, step_order: expense.current_approval_step }
    });

    const approverData = await workflowExecutor.getNextApprover(expense, currentStepData, workflow);
    const isAuthorized = approverData.approvers.some(a => a.id === approverId);

    if (!isAuthorized) {
      throw new ForbiddenError(
        `User not authorized to request modification at this step`,
        ERROR_CODES.UNAUTHORIZED_APPROVAL
      );
    }

    // Create modification request record
    const approval = await ExpenseApproval.create({
      expense_id: expenseId,
      approver_id: approverId,
      action: APPROVAL_ACTIONS.REQUESTED_MODIFICATION,
      step_number: expense.current_approval_step,
      comments
    });

    await auditHelper.logAction(expenseId, approverId, 'MODIFICATION_REQUESTED',
      { step: expense.current_approval_step },
      { approval_id: approval.id, comments }
    );

    // Expense stays in PENDING_APPROVAL to allow resubmission
    this.logInfo(`Modification requested for expense ${expenseId}`);
    return approval;
  }

  async getExpenseApprovalHistory(expenseId) {
    const { ExpenseApproval } = getDb().models;

    return ExpenseApproval.findAll({
      where: { expense_id: expenseId },
      include: [
        {
          association: 'approver',
          attributes: ['id', 'email', 'first_name', 'last_name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = new ApprovalService();
