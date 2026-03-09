const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ForwardCall = sequelize.define('ForwardCall', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    forward_uid: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    client_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    scheduled_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled',
    },
    created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    meeting_link: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    attended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    tableName: 'forward_calls',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = ForwardCall;
