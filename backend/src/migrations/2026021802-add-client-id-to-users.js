'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'client_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('users', ['client_id'], {
      name: 'users_client_id_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'users_client_id_idx');
    await queryInterface.removeColumn('users', 'client_id');
  },
};

