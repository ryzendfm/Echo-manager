const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join('uploads', 'temp');
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

function cleanTempFiles() {
    if (!fs.existsSync(TEMP_DIR)) return;

    const now = Date.now();
    let cleaned = 0;

    try {
        const files = fs.readdirSync(TEMP_DIR);
        for (const file of files) {
            const filePath = path.join(TEMP_DIR, file);
            try {
                const stat = fs.statSync(filePath);
                if (now - stat.mtimeMs > MAX_AGE_MS) {
                    fs.unlinkSync(filePath);
                    cleaned++;
                }
            } catch (e) {
                // Skip files that can't be accessed
            }
        }
        if (cleaned > 0) {
            console.log(`Temp cleanup: removed ${cleaned} stale file(s)`);
        }
    } catch (e) {
        console.error('Temp cleanup error:', e.message);
    }
}

function startTempCleanupScheduler() {
    // Run immediately on startup
    cleanTempFiles();
    // Then run every hour
    setInterval(cleanTempFiles, MAX_AGE_MS);
}

module.exports = { startTempCleanupScheduler };
