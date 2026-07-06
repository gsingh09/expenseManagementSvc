const BaseService = require('./baseService');
const { getDb } = require('../dataAccessor/mysql/databaseHandler');
const NotFoundError = require('../exception/notFoundError');
const BadRequestError = require('../exception/badRequestError');
const ConflictError = require('../exception/conflictError');
const { APPROVAL_STRATEGIES, ERROR_CODES } = require('../constant/constants');

class WorkflowService extends BaseService {
  constructor() {
    super('WorkflowService');
  }

  async createWorkflow(orgId, expenseTypeId, strategy, name = null) {
    const { ApprovalWorkflow, ExpenseType } = getDb().models;

    // Validate strategy
    if (!Object.values(APPROVAL_STRATEGIES).includes(strategy)) {
      throw new BadRequestError(`Invalid strategy: ${strategy}`, ERROR_CODES.INVALID_WORKFLOW_STRATEGY);
    }

    // Verify expense type
    const expenseType = await ExpenseType.findByPk(expenseTypeId);
    if (!expenseType || parseInt(expenseType.org_id) !== parseInt(orgId)) {
      throw new NotFoundError(`Expense type not found in organization`, ERROR_CODES.NOT_FOUND);
    }

    // Check for existing workflow
    const existing = await ApprovalWorkflow.findOne({
      where: { org_id: orgId, expense_type_id: expenseTypeId }
    });

    if (existing) {
      throw new ConflictError(
        `Workflow already exists for this expense type`,
        ERROR_CODES.DUPLICATE_ENTRY
      );
    }

    const workflow = await ApprovalWorkflow.create({
      org_id: orgId,
      expense_type_id: expenseTypeId,
      strategy,
      name: name || `${expenseType.name} - ${strategy}`
    });

    this.logInfo(`Created workflow: ${workflow.id} (${strategy})`);
    return workflow;
  }

  async getWorkflow(workflowId) {
    const { ApprovalWorkflow } = getDb().models;

    const workflow = await ApprovalWorkflow.findByPk(workflowId, {
      include: [
        { association: 'approvalSteps', order: [['step_order', 'ASC']] }
      ]
    });

    if (!workflow) {
      throw new NotFoundError(`Workflow not found`, ERROR_CODES.WORKFLOW_NOT_FOUND);
    }

    return workflow;
  }

  async getWorkflowByExpenseType(orgId, expenseTypeId) {
    const { ApprovalWorkflow } = getDb().models;

    const workflow = await ApprovalWorkflow.findOne({
      where: { org_id: orgId, expense_type_id: expenseTypeId },
      include: [
        { association: 'approvalSteps', order: [['step_order', 'ASC']] }
      ]
    });

    if (!workflow) {
      throw new NotFoundError(`No workflow found for expense type`, ERROR_CODES.WORKFLOW_NOT_FOUND);
    }

    return workflow;
  }

  async addApprovalSteps(workflowId, steps) {
    const { ApprovalStep, ApprovalWorkflow } = getDb().models;

    if (!Array.isArray(steps) || steps.length === 0) {
      throw new BadRequestError(`Steps must be a non-empty array`, ERROR_CODES.VALIDATION_ERROR);
    }

    const workflow = await ApprovalWorkflow.findByPk(workflowId);
    if (!workflow) {
      throw new NotFoundError(`Workflow not found`, ERROR_CODES.WORKFLOW_NOT_FOUND);
    }

    const createdSteps = [];

    for (const step of steps) {
      const { stepOrder, requiredApprovalLevel, requiredRoleId } = step;

      // Validate that either level or role is provided
      if (requiredApprovalLevel === null && requiredRoleId === null) {
        throw new BadRequestError(
          `Either required_approval_level or required_role_id must be provided for step ${stepOrder}`,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      // Check for duplicate step order
      const existing = await ApprovalStep.findOne({
        where: { workflow_id: workflowId, step_order: stepOrder }
      });

      if (existing) {
        throw new ConflictError(`Step ${stepOrder} already exists`, ERROR_CODES.DUPLICATE_ENTRY);
      }

      const createdStep = await ApprovalStep.create({
        workflow_id: workflowId,
        step_order: stepOrder,
        required_approval_level: requiredApprovalLevel,
        required_role_id: requiredRoleId
      });

      createdSteps.push(createdStep);
    }

    this.logInfo(`Added ${steps.length} approval steps to workflow ${workflowId}`);
    return createdSteps;
  }

  async addApprovalStep(workflowId, stepOrder, requiredApprovalLevel = null, requiredRoleId = null) {
    return this.addApprovalSteps(workflowId, [{
      stepOrder,
      requiredApprovalLevel,
      requiredRoleId
    }]).then(steps => steps[0]);
  }

  async getApprovalSteps(workflowId) {
    const { ApprovalStep } = getDb().models;

    return ApprovalStep.findAll({
      where: { workflow_id: workflowId },
      order: [['step_order', 'ASC']]
    });
  }

  async getWorkflowsByOrg(orgId) {
    const { ApprovalWorkflow } = getDb().models;

    return ApprovalWorkflow.findAll({
      where: { org_id: orgId },
      order: [['id', 'ASC']]
    });
  }
}

module.exports = new WorkflowService();
