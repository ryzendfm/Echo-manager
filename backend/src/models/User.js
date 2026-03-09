const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    user_uid: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    role: {
        type: DataTypes.ENUM('admin', 'employee', 'intern', 'client'),
        allowNull: false,
        defaultValue: 'employee',
    },
    avatar: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    is_email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    password_reset_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    password_reset_expires: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
    },
    client_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
    },
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = User;
