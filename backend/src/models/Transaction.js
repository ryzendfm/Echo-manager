const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
    },
    category: {
        type: DataTypes.ENUM('project_payment', 'salary', 'software', 'office', 'marketing', 'hosting', 'misc', 'freelance', 'refund'),
        allowNull: false,
        defaultValue: 'misc',
    },
    amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    project_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
    },
    client_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
    },
    payment_method: {
        type: DataTypes.ENUM('bank_transfer', 'upi', 'cash', 'cheque', 'card', 'other'),
        allowNull: true,
    },
    reference_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
}, {
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Transaction;
