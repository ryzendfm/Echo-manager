const express = require('express');
const router = express.Router();
const {
    create,
    getAll,
    getMyForwardCalls,
    getById,
    update,
    updateStatus,
    markAttendance,
    delete: deleteForwardCall,
} = require('../controllers/forwardCallController');
const auth = require('../middleware/auth');

router.get('/me', auth, getMyForwardCalls);
router.get('/', auth, getAll);
router.get('/:id', auth, getById);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.patch('/:id/status', auth, updateStatus);
router.patch('/:id/attendance', auth, markAttendance);
router.delete('/:id', auth, deleteForwardCall);

module.exports = router;
