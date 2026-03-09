const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, getProjects, assignProjects, getMyProjects } = require('../controllers/employeeController');
const auth = require('../middleware/auth');

router.get('/me/projects', auth, getMyProjects);
router.get('/', auth, getAll);
router.get('/:id', auth, getById);
router.get('/:id/projects', auth, getProjects);
router.post('/:id/projects', auth, assignProjects);
router.post('/', auth, create);
router.put('/:id', auth, update);

module.exports = router;

