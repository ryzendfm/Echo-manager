const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getOverview,
    updateSettings,
    getAdmins,
    addAdmin,
    updateAdmin,
    updateAdminsBulk,
    removeAdmin,
} = require('../controllers/profitSharingController');

router.get('/', auth, getOverview);
router.put('/settings', auth, updateSettings);
router.get('/admins', auth, getAdmins);
router.post('/admins', auth, addAdmin);
router.put('/admins/bulk', auth, updateAdminsBulk);
router.put('/admins/:id', auth, updateAdmin);
router.delete('/admins/:id', auth, removeAdmin);

module.exports = router;
