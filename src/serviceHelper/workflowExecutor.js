const { APPROVAL_STRATEGIES, APPROVAL_LEVELS } = require('../constant/constants');
const { getDb } = require('../dataAccessor/mysql/databaseHandler');
const logger = require('../logger/logger');

/**
 * Core workflow execution engine supporting HIERARCHY, ROLE_BASED, and CUSTOM strategies
 */
class WorkflowExecutor {
  /**
   * Get the next approver(s) for an expense at a given step
   * @param {Object} expense - Expense object with workflow data
   * @param {Object} approvalStep - Current ApprovalStep
   * @param {Object} approvalWorkflow - ApprovalWorkflow with strategy
   * @returns {Promise<Object>} { approvers: Array<User>, nextStep: ApprovalStep }
   */
  async getNextApprover(expense, approvalStep, approvalWorkflow) {
    const { User, Role } = getDb().models;

    if (!approvalWorkflow) {
      throw new Error('ApprovalWorkflow not found');
    }

    const strategy = approvalWorkflow.strategy;
    logger.debug(`[WorkflowExecutor] Strategy: ${strategy}, Step: ${approvalStep.step_order}`);

    let approvers = [];

    switch (strategy) {
      case APPROVAL_STRATEGIES.HIERARCHY:
        approvers = await this._getHierarchyApprovers(
          expense,
          approvalStep,
          User
        );
        break;

      case APPROVAL_STRATEGIES.ROLE_BASED:
        approvers = await this._getRoleBasedApprovers(
          expense,
          approvalStep,
          User,
          Role
        );
        break;

      case APPROVAL_STRATEGIES.CUSTOM:
        approvers = await this._getCustomApprovers(
          expense,
          approvalStep,
          approvalWorkflow,
          User,
          Role
        );
        break;

      default:
        throw new Error(`Unknown approval strategy: ${strategy}`);
    }

    if (approvers.length === 0) {
      logger.warn(`[WorkflowExecutor] No approver found for step ${approvalStep.step_order}`);
    }

    return { approvers, nextStep: approvalStep };
  }

  /**
   * HIERARCHY strategy: Walk manager_id chain up to required_approval_level
   */
  async _getHierarchyApprovers(expense, approvalStep, User) {
    const requiredLevel = approvalStep.required_approval_level;
    const submitter = await User.findByPk(expense.submitter_id);

    if (!submitter) {
      throw new Error(`Submitter user ${expense.submitter_id} not found`);
    }

    logger.debug(
      `[WorkflowExecutor] HIERARCHY: Finding approver with level >= ${requiredLevel} starting from manager of ${submitter.email}`
    );

    // Walk up the manager chain
    let currentUser = submitter;
    const visited = new Set();

    while (currentUser) {
      // Get user's roles to determine approval level
      const userRoles = await currentUser.getRoles();
      const maxApprovalLevel = userRoles.length > 0
        ? Math.max(...userRoles.map(r => r.approval_level))
        : APPROVAL_LEVELS.EMPLOYEE;

      logger.debug(
        `[WorkflowExecutor] Checking user ${currentUser.email} (level: ${maxApprovalLevel})`
      );

      if (maxApprovalLevel >= requiredLevel && currentUser.id !== submitter.id) {
        return [currentUser];
      }

      // Move to manager
      if (!currentUser.manager_id) {
        logger.warn(
          `[WorkflowExecutor] Reached top of hierarchy, no approver found with level >= ${requiredLevel}`
        );
        return [];
      }

      if (visited.has(currentUser.manager_id)) {
        logger.error(`[WorkflowExecutor] Circular manager reference detected`);
        return [];
      }

      visited.add(currentUser.id);
      currentUser = await User.findByPk(currentUser.manager_id);
    }

    return [];
  }

  /**
   * ROLE_BASED strategy: Find all users with required_role_id (exclude submitter)
   */
  async _getRoleBasedApprovers(expense, approvalStep, User, Role) {
    const requiredRoleId = approvalStep.required_role_id;

    if (!requiredRoleId) {
      throw new Error('ROLE_BASED strategy requires required_role_id');
    }

    logger.debug(
      `[WorkflowExecutor] ROLE_BASED: Finding users with role ${requiredRoleId}`
    );

    const role = await Role.findByPk(requiredRoleId);
    if (!role) {
      throw new Error(`Role ${requiredRoleId} not found`);
    }

    // Get all users with this role
    const approvers = await role.getUsers({
      where: {
        org_id: expense.org_id
      }
    });

    // Filter out the submitter
    const filtered = approvers.filter(u => u.id !== expense.submitter_id);

    logger.debug(
      `[WorkflowExecutor] Found ${filtered.length} approvers with role ${role.name}`
    );

    return filtered;
  }

  /**
   * CUSTOM strategy: Get next approver from CustomApprovalFlowStep
   */
  async _getCustomApprovers(expense, approvalStep, approvalWorkflow, User, Role) {
    const { CustomApprovalFlow, CustomApprovalFlowStep } = getDb().models;

    logger.debug(
      `[WorkflowExecutor] CUSTOM: Finding custom flow steps for workflow ${approvalWorkflow.id}`
    );

    // Get the custom flow (there should be exactly one per workflow)
    const customFlow = await CustomApprovalFlow.findOne({
      where: { workflow_id: approvalWorkflow.id }
    });

    if (!customFlow) {
      logger.warn(`[WorkflowExecutor] No CustomApprovalFlow found for workflow ${approvalWorkflow.id}`);
      return [];
    }

    // Get the step in the custom flow for this approval_step
    const flowStep = await CustomApprovalFlowStep.findOne({
      where: {
        flow_id: customFlow.id,
        approval_step_id: approvalStep.id
      }
    });

    if (!flowStep) {
      logger.warn(
        `[WorkflowExecutor] ApprovalStep ${approvalStep.id} not in custom flow ${customFlow.id}`
      );
      return [];
    }

    logger.debug(
      `[WorkflowExecutor] Found flow step ${flowStep.step_number} for approval step ${approvalStep.id}`
    );

    // Now delegate back to HIERARCHY or ROLE_BASED based on the approval_step config
    if (approvalStep.required_approval_level !== null) {
      return this._getHierarchyApprovers(expense, approvalStep, User);
    } else if (approvalStep.required_role_id !== null) {
      return this._getRoleBasedApprovers(expense, approvalStep, User, Role);
    }

    logger.error(
      `[WorkflowExecutor] ApprovalStep ${approvalStep.id} has neither level nor role_id`
    );
    return [];
  }

  /**
   * Get all approval steps for a workflow in order
   */
  async getApprovalSteps(workflowId) {
    const { ApprovalStep } = getDb().models;

    const steps = await ApprovalStep.findAll({
      where: { workflow_id: workflowId },
      order: [['step_order', 'ASC']]
    });

    return steps;
  }

  /**
   * Get the next approval step after current_approval_step
   */
  async getNextApprovalStep(workflowId, currentStep) {
    const { ApprovalStep } = getDb().models;

    const nextStep = await ApprovalStep.findOne({
      where: {
        workflow_id: workflowId,
        step_order: {
          [require('sequelize').Op.gt]: currentStep
        }
      },
      order: [['step_order', 'ASC']]
    });

    return nextStep;
  }
}

module.exports = new WorkflowExecutor();
