const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectPhase = sequelize.define('ProjectPhase', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    project_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    phase_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    phase_description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    phase_amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    receipt_path: {
        type: DataTypes.STRING(1024),
        allowNull: true,
    },
    amount_paid: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
        allowNull: false,
        defaultValue: 'unpaid',
    },
}, {
    tableName: 'project_phases',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = ProjectPhase;
