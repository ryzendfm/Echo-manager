const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    type: {
        type: DataTypes.ENUM('task_completed', 'leave_request', 'leave_approved', 'leave_rejected', 'admin_announcement', 'general'),
        allowNull: false,
        defaultValue: 'general',
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    sender_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
    },
    recipient_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    reference_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    reference_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Notification;
