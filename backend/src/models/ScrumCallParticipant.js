const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ScrumCallParticipant = sequelize.define('ScrumCallParticipant', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    scrum_call_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    employee_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    attended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    tableName: 'scrum_call_participants',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['scrum_call_id', 'employee_id'],
        },
    ],
});

module.exports = ScrumCallParticipant;
