const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define(
    'AuditLog',
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
      actor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'User who performed the action'
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'e.g., CREATED, SUBMITTED, APPROVED, REJECTED, etc.'
      },
      old_value: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Previous value (for updates)'
      },
      new_value: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'New value (for updates or creates)'
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
      tableName: 'audit_logs',
      timestamps: true
    }
  );

  return AuditLog;
};
