const express = require('express');
const router = express.Router();
const {
    apply,
    getMyLeaves,
    getMyBalance,
    getAll,
    approve,
    reject,
    cancel,
} = require('../controllers/leaveController');
const auth = require('../middleware/auth');

router.post('/', auth, apply);
router.get('/me', auth, getMyLeaves);
router.get('/me/balance', auth, getMyBalance);
router.get('/', auth, getAll);
router.patch('/:id/approve', auth, approve);
router.patch('/:id/reject', auth, reject);
router.patch('/:id/cancel', auth, cancel);

module.exports = router;
