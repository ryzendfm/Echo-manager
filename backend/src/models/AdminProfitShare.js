const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdminProfitShare = sequelize.define('AdminProfitShare', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    share_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'admin_profit_shares',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = AdminProfitShare;
