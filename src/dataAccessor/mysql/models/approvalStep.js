const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ApprovalStep = sequelize.define(
    'ApprovalStep',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      workflow_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      step_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Sequential step number (1, 2, 3, ...)'
      },
      required_approval_level: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For HIERARCHY strategy: 0=EMPLOYEE, 1=MANAGER, 2=SR_MANAGER, 3=DIRECTOR, 4=CLEVEL_FINANCE'
      },
      required_role_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For ROLE_BASED strategy: role_id to check'
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
      tableName: 'approval_steps',
      timestamps: true
    }
  );

  return ApprovalStep;
};
