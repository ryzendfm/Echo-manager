const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProfitSharingSetting = sequelize.define('ProfitSharingSetting', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    company_share_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 50,
    },
    admins_share_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 50,
    },
}, {
    tableName: 'profit_sharing_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = ProfitSharingSetting;
