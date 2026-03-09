const sequelize = require('../config/db');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // Check if column already exists
        const [results] = await sequelize.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'description'`
        );

        if (results.length === 0) {
            await sequelize.query(`ALTER TABLE tasks ADD COLUMN description TEXT NULL`);
            console.log('Added description column to tasks table.');
        } else {
            console.log('description column already exists, skipping.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
