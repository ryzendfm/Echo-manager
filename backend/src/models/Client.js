const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Client = sequelize.define('Client', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    // Legacy link to User, kept for backward compatibility.
    user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        unique: true,
    },
    client_uid: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    company_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    industry: {
        type: DataTypes.ENUM('e_commerce', 'healthcare', 'education', 'finance', 'technology', 'real_estate', 'other'),
        allowNull: false,
        defaultValue: 'other',
    },
    contact_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    contact_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    alternate_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    website_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'clients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Client;
