'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // For clients that already have user_id set, copy that relationship
    // into users.client_id so existing logins continue to work.
    const sequelize = queryInterface.sequelize;

    // MySQL-safe update using a JOIN
    await sequelize.query(`
      UPDATE users u
      JOIN clients c ON c.user_id = u.id
      SET u.client_id = c.id
      WHERE c.user_id IS NOT NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    // Best-effort rollback: clear client_id where it was set by this migration.
    // This assumes only client-linked users have client_id set.
    const sequelize = queryInterface.sequelize;
    await sequelize.query(`
      UPDATE users
      SET client_id = NULL
      WHERE client_id IS NOT NULL
    `);
  },
};

