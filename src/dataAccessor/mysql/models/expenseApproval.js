const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExpenseApproval = sequelize.define(
    'ExpenseApproval',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      expense_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      approver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'User who approved/rejected'
      },
      action: {
        type: DataTypes.ENUM('APPROVED', 'REJECTED', 'REQUESTED_MODIFICATION'),
        allowNull: false
      },
      step_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Which approval step this action is for'
      },
      comments: {
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
      tableName: 'expense_approvals',
      timestamps: true
    }
  );

  return ExpenseApproval;
};
