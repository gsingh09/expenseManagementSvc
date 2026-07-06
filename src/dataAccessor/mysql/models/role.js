const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define(
    'Role',
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
      approval_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '0=EMPLOYEE, 1=MANAGER, 2=SR_MANAGER, 3=DIRECTOR, 4=CLEVEL_FINANCE'
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
      tableName: 'roles',
      timestamps: true
    }
  );

  return Role;
};
