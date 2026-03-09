const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    project_uid: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    project_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    client_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('planning', 'in_progress', 'on_hold', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'planning',
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
    },
    deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    budget_estimated: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
    },
    total_budget: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    tech_stack: {
        type: DataTypes.JSON, // Stores array of strings e.g. ["React", "Node.js"]
        allowNull: true,
    },
    file_attachments: {
        type: DataTypes.STRING(1000), // URL or path to file
        allowNull: true,
    },
}, {
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Project;
