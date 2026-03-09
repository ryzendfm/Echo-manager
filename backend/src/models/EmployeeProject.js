const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EmployeeProject = sequelize.define('EmployeeProject', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    employee_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    project_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
}, {
    tableName: 'employee_projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['employee_id', 'project_id'],
        },
    ],
});

module.exports = EmployeeProject;
