const express = require('express');
const router = express.Router();
const {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    sendNotification,
    deleteNotification,
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, getMyNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.patch('/read-all', auth, markAllAsRead);
router.patch('/:id/read', auth, markAsRead);
router.post('/send', auth, sendNotification);
router.delete('/:id', auth, deleteNotification);

module.exports = router;
