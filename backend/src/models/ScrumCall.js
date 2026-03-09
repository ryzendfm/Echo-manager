const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ScrumCall = sequelize.define('ScrumCall', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    scrum_uid: {
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
    selection_type: {
        type: DataTypes.ENUM('all', 'individual', 'team'),
        allowNull: false,
    },
    created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    meeting_link: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'scrum_calls',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = ScrumCall;
