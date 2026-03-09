const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    invoice_uid: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
    },
    client_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    project_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
    },
    amount: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
    },
    status: {
        type: DataTypes.ENUM('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
    },
    due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    items: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },
    subtotal: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
    },
    tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
    },
    tax_amount: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
    },
    discount_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
    },
    discount_amount: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
    },
    total_amount: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Invoice;
