const BaseService = require('./baseService');
const { getDb } = require('../dataAccessor/mysql/databaseHandler');
const NotFoundError = require('../exception/notFoundError');
const BadRequestError = require('../exception/badRequestError');
const ForbiddenError = require('../exception/forbiddenError');
const auditHelper = require('../serviceHelper/auditHelper');
const workflowExecutor = require('../serviceHelper/workflowExecutor');
const { EXPENSE_STATUS, ERROR_CODES } = require('../constant/constants');

class ExpenseService extends BaseService {
  constructor() {
    super('ExpenseService');
  }

  async createExpense(orgId, submitterId, expenseTypeId, amount, description = null) {
    const { Expense, User, ExpenseType } = getDb().models;

    // Verify user exists in org
    const user = await User.findByPk(submitterId);
    if (!user || user.org_id !== orgId) {
      throw new NotFoundError(`User not found in organization`, ERROR_CODES.USER_NOT_FOUND);
    }

    // Verify expense type
    const expenseType = await ExpenseType.findByPk(expenseTypeId);
    if (!expenseType || expenseType.org_id !== orgId) {
      throw new NotFoundError(`Expense type not found`, ERROR_CODES.NOT_FOUND);
    }

    // Validate amount against max
    if (expenseType.max_amount && amount > expenseType.max_amount) {
      throw new BadRequestError(
        `Amount ${amount} exceeds max allowed ${expenseType.max_amount}`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const expense = await Expense.create({
      org_id: orgId,
      submitter_id: submitterId,
      expense_type_id: expenseTypeId,
      amount,
      description,
      status: EXPENSE_STATUS.DRAFT
    });

    await auditHelper.logAction(expense.id, submitterId, 'CREATED', null, {
      amount,
      status: EXPENSE_STATUS.DRAFT
    });

    this.logInfo(`Created expense ${expense.id}: $${amount} (${expenseType.name})`);
    return expense;
  }

  async getExpense(expenseId) {
    const { Expense } = getDb().models;

    const expense = await Expense.findByPk(expenseId, {
      include: [
        { association: 'submitter', attributes: ['id', 'email', 'first_name'] },
        { association: 'approvals', order: [['createdAt', 'DESC']] }
      ]
    });

    if (!expense) {
      throw new NotFoundError(`Expense not found`, ERROR_CODES.EXPENSE_NOT_FOUND);
    }

    return expense;
  }

  async listExpenses(orgId, status = null) {
    const { Expense } = getDb().models;

    const where = { org_id: orgId };
    if (status) {
      where.status = status;
    }

    return Expense.findAll({
      where,
      include: [
        { association: 'submitter', attributes: ['id', 'email', 'first_name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async submitExpense(expenseId, submitterId) {
    const { Expense } = getDb().models;
    const workflowService = require('./workflowService');

    const expense = await Expense.findByPk(expenseId);
    if (!expense) {
      throw new NotFoundError(`Expense not found`, ERROR_CODES.EXPENSE_NOT_FOUND);
    }

    // Verify submitter is authorized
    if (expense.submitter_id !== submitterId) {
      throw new ForbiddenError(`Not authorized to submit this expense`, ERROR_CODES.UNAUTHORIZED_APPROVAL);
    }

    // Only draft expenses can be submitted
    if (expense.status !== EXPENSE_STATUS.DRAFT) {
      throw new BadRequestError(
        `Cannot submit expense in ${expense.status} status`,
        ERROR_CODES.INVALID_EXPENSE_STATUS_TRANSITION
      );
    }

    // Get workflow for this expense type
    const workflow = await workflowService.getWorkflowByExpenseType(
      expense.org_id,
      expense.expense_type_id
    );

    await expense.update({
      status: EXPENSE_STATUS.SUBMITTED,
      workflow_id: workflow.id,
      current_approval_step: 1
    });

    await auditHelper.logAction(expenseId, submitterId, 'SUBMITTED',
      { status: EXPENSE_STATUS.DRAFT },
      { status: EXPENSE_STATUS.SUBMITTED, workflow_id: workflow.id }
    );

    this.logInfo(`Submitted expense ${expenseId} for approval`);
    return expense;
  }

  async updateExpenseStatus(expenseId, newStatus, actorId) {
    const { Expense } = getDb().models;

    const expense = await Expense.findByPk(expenseId);
    if (!expense) {
      throw new NotFoundError(`Expense not found`, ERROR_CODES.EXPENSE_NOT_FOUND);
    }

    const oldStatus = expense.status;
    await expense.update({ status: newStatus });

    await auditHelper.logAction(expenseId, actorId, `STATUS_CHANGED_TO_${newStatus}`,
      { status: oldStatus },
      { status: newStatus }
    );

    this.logInfo(`Expense ${expenseId} status changed: ${oldStatus} → ${newStatus}`);
    return expense;
  }

  async advanceApprovalStep(expenseId, actorId) {
    const { Expense, ApprovalStep } = getDb().models;

    const expense = await Expense.findByPk(expenseId);
    if (!expense) {
      throw new NotFoundError(`Expense not found`, ERROR_CODES.EXPENSE_NOT_FOUND);
    }

    const nextStep = await ApprovalStep.findOne({
      where: {
        workflow_id: expense.workflow_id,
        step_order: { [require('sequelize').Op.gt]: expense.current_approval_step }
      },
      order: [['step_order', 'ASC']]
    });

    if (!nextStep) {
      // No more steps - mark as approved
      await this.updateExpenseStatus(expenseId, EXPENSE_STATUS.APPROVED, actorId);
      return null;
    }

    const oldStep = expense.current_approval_step;
    await expense.update({ current_approval_step: nextStep.step_order });
    await auditHelper.logAction(expenseId, actorId, 'APPROVAL_STEP_ADVANCED',
      { current_step: oldStep },
      { current_step: nextStep.step_order }
    );

    this.logInfo(`Expense ${expenseId} advanced to step ${nextStep.step_order}`);
    return nextStep;
  }
}

module.exports = new ExpenseService();
