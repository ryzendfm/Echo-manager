const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, updateStatus, resetPassword, remove } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/', auth, getAll);
router.get('/:id', auth, getById);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.patch('/:id/status', auth, updateStatus);
router.patch('/:id/reset-password', auth, resetPassword);
router.delete('/:id', auth, remove);

module.exports = router;
