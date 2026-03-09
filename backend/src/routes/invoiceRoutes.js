const express = require('express');
const router = express.Router();
const { getAll, getMyInvoices, getById, create, update, remove } = require('../controllers/invoiceController');
const auth = require('../middleware/auth');

router.get('/', auth, getAll);
router.get('/me', auth, getMyInvoices);
router.get('/:id', auth, getById);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

module.exports = router;
