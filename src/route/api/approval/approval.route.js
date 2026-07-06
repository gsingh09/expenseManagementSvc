const express = require('express');
const approvalController = require('../../../controller/approvalController');
const adminController = require('../../../controller/adminController');

const router = express.Router({ mergeParams: true });

// Get pending approvals for user
router.get('/pending-approvals', (req, res) =>
  approvalController.getPendingApprovals(req, res)
);

// Assign role to user
router.post('/roles', (req, res) =>
  adminController.assignRoleToUser(req, res)
);

// Approval actions on expenses
router.post('/expenses/:expenseId/approve', (req, res) =>
  approvalController.approveExpense(req, res)
);

router.post('/expenses/:expenseId/reject', (req, res) =>
  approvalController.rejectExpense(req, res)
);

router.post('/expenses/:expenseId/request-modification', (req, res) =>
  approvalController.requestModification(req, res)
);

// Audit and approval history
router.get('/expenses/:expenseId/audit-log', (req, res) =>
  approvalController.getAuditLog(req, res)
);

router.get('/expenses/:expenseId/approvals', (req, res) =>
  approvalController.getApprovalHistory(req, res)
);

module.exports = router;
