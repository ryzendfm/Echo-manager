const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    task_uid: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    project_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('todo', 'in_progress', 'in_review', 'completed', 'blocked'),
        allowNull: false,
        defaultValue: 'todo',
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
    },
    due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    assigned_to: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Task;
