'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('invoices', 'items', {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: [],
        });
        await queryInterface.addColumn('invoices', 'subtotal', {
            type: Sequelize.DECIMAL(14, 2),
            defaultValue: 0,
        });
        await queryInterface.addColumn('invoices', 'tax_rate', {
            type: Sequelize.DECIMAL(5, 2),
            defaultValue: 0,
        });
        await queryInterface.addColumn('invoices', 'tax_amount', {
            type: Sequelize.DECIMAL(14, 2),
            defaultValue: 0,
        });
        await queryInterface.addColumn('invoices', 'discount_rate', {
            type: Sequelize.DECIMAL(5, 2),
            defaultValue: 0,
        });
        await queryInterface.addColumn('invoices', 'discount_amount', {
            type: Sequelize.DECIMAL(14, 2),
            defaultValue: 0,
        });
        await queryInterface.addColumn('invoices', 'total_amount', {
            type: Sequelize.DECIMAL(14, 2),
            defaultValue: 0,
        });
        await queryInterface.addColumn('invoices', 'notes', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('invoices', 'items');
        await queryInterface.removeColumn('invoices', 'subtotal');
        await queryInterface.removeColumn('invoices', 'tax_rate');
        await queryInterface.removeColumn('invoices', 'tax_amount');
        await queryInterface.removeColumn('invoices', 'discount_rate');
        await queryInterface.removeColumn('invoices', 'discount_amount');
        await queryInterface.removeColumn('invoices', 'total_amount');
        await queryInterface.removeColumn('invoices', 'notes');
    }
};
