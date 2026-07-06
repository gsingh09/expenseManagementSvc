const { getSequelize } = require('../mysqlClient');

const loadModels = () => {
  const sequelize = getSequelize();

  // Load all models
  const Organization = require('./organization')(sequelize);
  const Department = require('./department')(sequelize);
  const Role = require('./role')(sequelize);
  const User = require('./user')(sequelize);
  const UserRole = require('./userRole')(sequelize);
  const ExpenseType = require('./expenseType')(sequelize);
  const ApprovalWorkflow = require('./approvalWorkflow')(sequelize);
  const ApprovalStep = require('./approvalStep')(sequelize);
  const CustomApprovalFlow = require('./customApprovalFlow')(sequelize);
  const CustomApprovalFlowStep = require('./customApprovalFlowStep')(sequelize);
  const Expense = require('./expense')(sequelize);
  const ExpenseApproval = require('./expenseApproval')(sequelize);
  const AuditLog = require('./auditLog')(sequelize);

  // Define associations

  // Organization
  Organization.hasMany(Department, { foreignKey: 'org_id' });
  Organization.hasMany(Role, { foreignKey: 'org_id' });
  Organization.hasMany(User, { foreignKey: 'org_id' });
  Organization.hasMany(ExpenseType, { foreignKey: 'org_id' });
  Organization.hasMany(ApprovalWorkflow, { foreignKey: 'org_id' });
  Organization.hasMany(Expense, { foreignKey: 'org_id' });

  // Department
  Department.belongsTo(Organization, { foreignKey: 'org_id' });
  Department.hasMany(User, { foreignKey: 'dept_id' });
  Department.belongsTo(Department, { foreignKey: 'parent_dept_id', as: 'parentDepartment' });

  // Role
  Role.belongsTo(Organization, { foreignKey: 'org_id' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id' });
  Role.hasMany(ApprovalStep, { foreignKey: 'required_role_id' });

  // User
  User.belongsTo(Organization, { foreignKey: 'org_id' });
  User.belongsTo(Department, { foreignKey: 'dept_id' });
  User.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
  User.hasMany(User, { foreignKey: 'manager_id', as: 'subordinates' });
  User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id' });
  User.hasMany(Expense, { foreignKey: 'submitter_id', as: 'submittedExpenses' });
  User.hasMany(ExpenseApproval, { foreignKey: 'approver_id', as: 'approvalActions' });
  User.hasMany(AuditLog, { foreignKey: 'actor_id' });

  // UserRole (junction table)
  UserRole.belongsTo(User, { foreignKey: 'user_id' });
  UserRole.belongsTo(Role, { foreignKey: 'role_id' });

  // ExpenseType
  ExpenseType.belongsTo(Organization, { foreignKey: 'org_id' });
  ExpenseType.hasMany(ApprovalWorkflow, { foreignKey: 'expense_type_id' });

  // ApprovalWorkflow
  ApprovalWorkflow.belongsTo(Organization, { foreignKey: 'org_id' });
  ApprovalWorkflow.belongsTo(ExpenseType, { foreignKey: 'expense_type_id' });
  ApprovalWorkflow.hasMany(ApprovalStep, { foreignKey: 'workflow_id' });
  ApprovalWorkflow.hasMany(CustomApprovalFlow, { foreignKey: 'workflow_id' });
  ApprovalWorkflow.hasMany(Expense, { foreignKey: 'workflow_id' });

  // ApprovalStep
  ApprovalStep.belongsTo(ApprovalWorkflow, { foreignKey: 'workflow_id' });
  ApprovalStep.belongsTo(Role, { foreignKey: 'required_role_id' });
  ApprovalStep.hasMany(CustomApprovalFlowStep, { foreignKey: 'approval_step_id' });

  // CustomApprovalFlow
  CustomApprovalFlow.belongsTo(ApprovalWorkflow, { foreignKey: 'workflow_id' });
  CustomApprovalFlow.hasMany(CustomApprovalFlowStep, { foreignKey: 'flow_id' });

  // CustomApprovalFlowStep
  CustomApprovalFlowStep.belongsTo(CustomApprovalFlow, { foreignKey: 'flow_id' });
  CustomApprovalFlowStep.belongsTo(ApprovalStep, { foreignKey: 'approval_step_id' });

  // Expense
  Expense.belongsTo(Organization, { foreignKey: 'org_id' });
  Expense.belongsTo(User, { foreignKey: 'submitter_id', as: 'submitter' });
  Expense.belongsTo(ExpenseType, { foreignKey: 'expense_type_id' });
  Expense.belongsTo(ApprovalWorkflow, { foreignKey: 'workflow_id' });
  Expense.hasMany(ExpenseApproval, { foreignKey: 'expense_id', as: 'approvals' });
  Expense.hasMany(AuditLog, { foreignKey: 'expense_id' });

  // ExpenseApproval
  ExpenseApproval.belongsTo(Expense, { foreignKey: 'expense_id' });
  ExpenseApproval.belongsTo(User, { foreignKey: 'approver_id', as: 'approver' });

  // AuditLog
  AuditLog.belongsTo(Expense, { foreignKey: 'expense_id' });
  AuditLog.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });

  return {
    sequelize,
    Organization,
    Department,
    Role,
    User,
    UserRole,
    ExpenseType,
    ApprovalWorkflow,
    ApprovalStep,
    CustomApprovalFlow,
    CustomApprovalFlowStep,
    Expense,
    ExpenseApproval,
    AuditLog
  };
};

module.exports = { loadModels };
