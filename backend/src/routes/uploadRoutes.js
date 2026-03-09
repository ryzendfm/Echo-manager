const express = require('express');
const router = express.Router();
const { uploadTemp } = require('../config/uploadConfig');

router.post('/temp', uploadTemp.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        // Return the path relative to the backend root, normalized
        const tempPath = req.file.path.replace(/\\/g, '/');
        res.json({ success: true, tempPath, originalName: req.file.originalname });
    } catch (error) {
        console.error('Temp Upload Error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

module.exports = router;
