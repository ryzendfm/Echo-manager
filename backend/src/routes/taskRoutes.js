const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, getMyTasks, updateStatus, assignBulk, getCommonProjects, getByEmployee } = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.get('/me', auth, getMyTasks);
router.get('/common-projects', auth, getCommonProjects);
router.post('/assign-bulk', auth, assignBulk);
router.get('/by-employee/:employeeId', auth, getByEmployee);
router.get('/', auth, getAll);
router.get('/:id', auth, getById);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.patch('/:id/status', auth, updateStatus);
router.delete('/:id', auth, remove);

module.exports = router;


