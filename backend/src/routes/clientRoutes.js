const express = require('express');
const router = express.Router();
const { getAll, getById, create, update } = require('../controllers/clientController');
const auth = require('../middleware/auth');

router.get('/', auth, getAll);
router.get('/:id', auth, getById);
router.post('/', auth, create);
router.put('/:id', auth, update);

module.exports = router;
