const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
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
      dept_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      manager_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Self-reference to manager (hierarchical chain)'
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false
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
      tableName: 'users',
      timestamps: true
    }
  );

  return User;
};
