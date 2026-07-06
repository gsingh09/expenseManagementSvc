const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustomApprovalFlowStep = sequelize.define(
    'CustomApprovalFlowStep',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      flow_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Links to CustomApprovalFlow'
      },
      approval_step_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Links to ApprovalStep'
      },
      step_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Position in custom flow (e.g., 1st, 2nd, 3rd approver)'
      },
      execution_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Original step_order from ApprovalStep (for reference)'
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
      tableName: 'custom_approval_flow_steps',
      timestamps: true
    }
  );

  return CustomApprovalFlowStep;
};
