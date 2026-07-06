const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExpenseType = sequelize.define(
    'ExpenseType',
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      max_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
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
      tableName: 'expense_types',
      timestamps: true
    }
  );

  return ExpenseType;
};
