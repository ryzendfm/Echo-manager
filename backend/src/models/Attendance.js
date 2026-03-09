const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    employee_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    check_in: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    check_out: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    total_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'half-day', 'late', 'on-leave', 'holiday'),
        allowNull: false,
        defaultValue: 'present',
    },
    work_mode: {
        type: DataTypes.ENUM('office', 'remote', 'hybrid'),
        allowNull: false,
        defaultValue: 'office',
    },
    notes: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
}, {
    tableName: 'attendance',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Attendance;
