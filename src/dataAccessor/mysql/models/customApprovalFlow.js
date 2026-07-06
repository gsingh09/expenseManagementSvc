const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustomApprovalFlow = sequelize.define(
    'CustomApprovalFlow',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      workflow_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Links to ApprovalWorkflow with strategy=CUSTOM'
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
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
      tableName: 'custom_approval_flows',
      timestamps: true
    }
  );

  return CustomApprovalFlow;
};
