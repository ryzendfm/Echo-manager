'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'address', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn('clients', 'website_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn('clients', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('clients', 'notes');
    await queryInterface.removeColumn('clients', 'website_url');
    await queryInterface.removeColumn('clients', 'address');
  },
};

