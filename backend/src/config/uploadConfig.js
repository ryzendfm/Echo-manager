const multer = require('multer');
const path = require('path');
const fs = require('fs');

const projectDocStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join('uploads', 'Clients', 'projects', 'documents');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const tempStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join('uploads', 'temp');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: PDF, JPEG, PNG, DOC, DOCX'), false);
    }
};

const upload = multer({
    storage: projectDocStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadTemp = multer({
    storage: tempStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const receiptStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join('uploads', 'temp');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const uploadReceipt = multer({
    storage: receiptStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { upload, uploadTemp, uploadReceipt };
