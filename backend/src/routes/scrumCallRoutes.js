const express = require('express');
const router = express.Router();
const {
    create,
    getAll,
    getMyScrumCalls,
    getById,
    update,
    updateStatus,
    markAttendance,
    updateNotes,
    delete: deleteScrumCall,
} = require('../controllers/scrumCallController');
const auth = require('../middleware/auth');

router.get('/me', auth, getMyScrumCalls);
router.get('/', auth, getAll);
router.get('/:id', auth, getById);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.patch('/:id/status', auth, updateStatus);
router.patch('/:id/attendance', auth, markAttendance);
router.patch('/:id/notes', auth, updateNotes);
router.delete('/:id', auth, deleteScrumCall);

module.exports = router;
