const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PhasePayment = sequelize.define('PhasePayment', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    phase_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
    },
    payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    payment_method: {
        type: DataTypes.ENUM('bank_transfer', 'upi', 'cash', 'cheque', 'card', 'other'),
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    receipt_path: {
        type: DataTypes.STRING(1000),
        allowNull: true,
    },
    finance_transaction_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
    },
}, {
    tableName: 'phase_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = PhasePayment;
