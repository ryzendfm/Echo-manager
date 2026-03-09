const express = require('express');
const router = express.Router();
const { getAll, getMyProjects, getById, create, update, remove, getEmployees, assignEmployees, getAllTeams } = require('../controllers/projectController');
const auth = require('../middleware/auth');
const { upload } = require('../config/uploadConfig');

router.get('/', auth, getAll);
router.get('/teams', auth, getAllTeams);
router.get('/me', auth, getMyProjects);
router.get('/:id', auth, getById);
router.get('/:id/employees', auth, getEmployees);
router.post('/', auth, upload.single('file_attachments'), create);
router.post('/:id/employees', auth, assignEmployees);
router.put('/:id', auth, upload.single('file_attachments'), update);
router.delete('/:id', auth, remove);

module.exports = router;
