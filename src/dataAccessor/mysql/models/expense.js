const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define(
    'Expense',
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
      submitter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'User who submitted the expense'
      },
      expense_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      workflow_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Links to ApprovalWorkflow'
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(
          'DRAFT',
          'SUBMITTED',
          'PENDING_APPROVAL',
          'APPROVED',
          'REJECTED',
          'PAYMENT_PROCESSED'
        ),
        allowNull: false,
        defaultValue: 'DRAFT'
      },
      current_approval_step: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: 'Current step number in approval workflow'
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
      tableName: 'expenses',
      timestamps: true
    }
  );

  return Expense;
};
