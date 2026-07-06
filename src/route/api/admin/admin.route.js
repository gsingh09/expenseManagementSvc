const express = require('express');
const adminController = require('../../../controller/adminController');

const router = express.Router();

// Organization management
router.get('/organizations', (req, res) => adminController.getOrganizations(req, res));

router.get('/organizations/:orgId', (req, res) => adminController.getOrganization(req, res));

router.post('/organizations', (req, res) => adminController.createOrganization(req, res));

// Expense types
router.get('/organizations/:orgId/expense-types', (req, res) =>
  adminController.getExpenseTypes(req, res)
);

router.get('/organizations/:orgId/expense-types/:typeId', (req, res) =>
  adminController.getExpenseType(req, res)
);

router.post('/organizations/:orgId/expense-types', (req, res) =>
  adminController.createExpenseType(req, res)
);

// Roles
router.get('/organizations/:orgId/roles', (req, res) =>
  adminController.getRoles(req, res)
);

router.get('/organizations/:orgId/roles/:roleId', (req, res) =>
  adminController.getRole(req, res)
);

router.post('/organizations/:orgId/roles', (req, res) =>
  adminController.createRole(req, res)
);

// Users
router.get('/organizations/:orgId/users', (req, res) =>
  adminController.getUsers(req, res)
);

router.get('/users/:userId', (req, res) =>
  adminController.getUser(req, res)
);

router.post('/organizations/:orgId/users', (req, res) =>
  adminController.createUser(req, res)
);

// Departments
router.get('/organizations/:orgId/departments', (req, res) =>
  adminController.getDepartments(req, res)
);

router.get('/organizations/:orgId/departments/:deptId', (req, res) =>
  adminController.getDepartment(req, res)
);

// Workflows
router.get('/organizations/:orgId/workflows', (req, res) =>
  adminController.getWorkflows(req, res)
);

router.get('/workflows/:workflowId', (req, res) =>
  adminController.getWorkflow(req, res)
);

router.post('/organizations/:orgId/workflows', (req, res) =>
  adminController.createWorkflow(req, res)
);

router.post('/organizations/:orgId/workflows/:workflowId/steps', (req, res) =>
  adminController.addApprovalStep(req, res)
);

module.exports = router;
