const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Leave = sequelize.define('Leave', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    employee_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    leave_type: {
        type: DataTypes.ENUM('casual', 'sick', 'earned', 'unpaid'),
        allowNull: false,
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    total_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    reason: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
    },
    approved_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
    },
    approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    rejection_reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
}, {
    tableName: 'leaves',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Leave;
