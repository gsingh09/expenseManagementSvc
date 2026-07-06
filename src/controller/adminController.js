const BaseController = require('./baseController');
const organizationService = require('../service/organizationService');
const userService = require('../service/userService');
const workflowService = require('../service/workflowService');
const { getDb } = require('../dataAccessor/mysql/databaseHandler');

class AdminController extends BaseController {
  constructor() {
    super('AdminController');
  }

  async createOrganization(req, res) {
    try {
      const { name, slug } = req.body;
      const org = await organizationService.createOrganization(name, slug);
      this.sendSuccess(res, org, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async createExpenseType(req, res) {
    try {
      const { orgId } = req.params;
      const { name, maxAmount, description } = req.body;
      const { ExpenseType } = getDb().models;

      const type = await ExpenseType.create({
        org_id: orgId,
        name,
        max_amount: maxAmount,
        description
      });

      this.sendSuccess(res, type, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async createRole(req, res) {
    try {
      const { orgId } = req.params;
      const { name, approvalLevel } = req.body;
      const { Role } = getDb().models;

      const role = await Role.create({
        org_id: orgId,
        name,
        approval_level: approvalLevel
      });

      this.sendSuccess(res, role, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async createUser(req, res) {
    try {
      const { orgId } = req.params;
      const { email, firstName, lastName, deptId, managerId } = req.body;

      const user = await userService.createUser(orgId, {
        email,
        firstName,
        lastName,
        deptId,
        managerId
      });

      this.sendSuccess(res, user, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async assignRoleToUser(req, res) {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;

      const userRole = await userService.assignRole(userId, roleId);
      this.sendSuccess(res, userRole, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async createWorkflow(req, res) {
    try {
      const { orgId } = req.params;
      const { expenseTypeId, strategy, name } = req.body;

      const workflow = await workflowService.createWorkflow(
        orgId,
        expenseTypeId,
        strategy,
        name
      );

      this.sendSuccess(res, workflow, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async addApprovalStep(req, res) {
    try {
      const { workflowId } = req.params;
      const { steps } = req.body;

      const createdSteps = await workflowService.addApprovalSteps(workflowId, steps);
      this.sendSuccess(res, createdSteps, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getOrganizations(req, res) {
    try {
      const organizations = await organizationService.listOrganizations();
      this.sendSuccess(res, organizations, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getOrganization(req, res) {
    try {
      const { orgId } = req.params;
      const organization = await organizationService.getOrganization(orgId);
      this.sendSuccess(res, organization, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getExpenseTypes(req, res) {
    try {
      const { orgId } = req.params;
      const { ExpenseType } = getDb().models;

      const types = await ExpenseType.findAll({
        where: { org_id: orgId },
        order: [['name', 'ASC']]
      });

      this.sendSuccess(res, types, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getExpenseType(req, res) {
    try {
      const { orgId, typeId } = req.params;
      const { ExpenseType } = getDb().models;

      const type = await ExpenseType.findOne({
        where: { id: typeId, org_id: orgId }
      });

      if (!type) {
        throw new (require('../exception/notFoundError'))(`Expense type not found`, 'NOT_FOUND');
      }

      this.sendSuccess(res, type, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getRoles(req, res) {
    try {
      const { orgId } = req.params;
      const { Role } = getDb().models;

      const roles = await Role.findAll({
        where: { org_id: orgId },
        order: [['approval_level', 'ASC']]
      });

      this.sendSuccess(res, roles, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getRole(req, res) {
    try {
      const { orgId, roleId } = req.params;
      const { Role } = getDb().models;

      const role = await Role.findOne({
        where: { id: roleId, org_id: orgId }
      });

      if (!role) {
        throw new (require('../exception/notFoundError'))(`Role not found`, 'NOT_FOUND');
      }

      this.sendSuccess(res, role, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getUsers(req, res) {
    try {
      const { orgId } = req.params;
      const users = await userService.getUsersInOrg(orgId);
      this.sendSuccess(res, users, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await userService.getUser(userId);
      this.sendSuccess(res, user, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getDepartments(req, res) {
    try {
      const { orgId } = req.params;
      const { Department } = getDb().models;

      const departments = await Department.findAll({
        where: { org_id: orgId },
        order: [['name', 'ASC']]
      });

      this.sendSuccess(res, departments, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getDepartment(req, res) {
    try {
      const { orgId, deptId } = req.params;
      const { Department } = getDb().models;

      const dept = await Department.findOne({
        where: { id: deptId, org_id: orgId }
      });

      if (!dept) {
        throw new (require('../exception/notFoundError'))(`Department not found`, 'NOT_FOUND');
      }

      this.sendSuccess(res, dept, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getWorkflows(req, res) {
    try {
      const { orgId } = req.params;
      const workflows = await workflowService.getWorkflowsByOrg(orgId);
      this.sendSuccess(res, workflows, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async getWorkflow(req, res) {
    try {
      const { workflowId } = req.params;
      const workflow = await workflowService.getWorkflow(workflowId);
      this.sendSuccess(res, workflow, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }
}

module.exports = new AdminController();
