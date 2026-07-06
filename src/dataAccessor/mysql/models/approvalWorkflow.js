const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ApprovalWorkflow = sequelize.define(
    'ApprovalWorkflow',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      org_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      expense_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      strategy: {
        type: DataTypes.ENUM('HIERARCHY', 'ROLE_BASED', 'CUSTOM'),
        allowNull: false,
        comment: 'Approval strategy: HIERARCHY (manager chain), ROLE_BASED (users with role), CUSTOM (admin-defined steps)'
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'approval_workflows',
      timestamps: true
    }
  );

  return ApprovalWorkflow;
};
