const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Employee = sequelize.define('Employee', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
    },
    employee_uid: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    designation: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    department: {
        type: DataTypes.ENUM('engineering', 'design', 'marketing', 'hr', 'sales', 'operations', 'finance', 'other'),
        allowNull: false,
        defaultValue: 'engineering',
    },
    employee_type: {
        type: DataTypes.ENUM('full-time', 'part-time', 'intern', 'contract'),
        allowNull: false,
        defaultValue: 'full-time',
    },
    date_of_joining: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    documents: {
        type: DataTypes.STRING(1000), // Path to resume/docs
        allowNull: true,
    },
}, {
    tableName: 'employees',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Employee;
