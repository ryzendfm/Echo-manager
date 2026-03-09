const Notification = require('../models/Notification');
const { emitToUser, emitToUsers } = require('./socketEmitter');

/**
 * Create a single notification and emit it via Socket.io.
 */
async function createAndEmitNotification(req, { type, title, message, senderId, recipientId, referenceType, referenceId }) {
    const notification = await Notification.create({
        type,
        title,
        message,
        sender_id: senderId || null,
        recipient_id: recipientId,
        reference_type: referenceType || null,
        reference_id: referenceId || null,
    });

    const io = req.app.get('io');
    const userSocketMap = req.app.get('userSocketMap');
    emitToUser(io, userSocketMap, recipientId, 'notification', notification.toJSON());

    return notification;
}

/**
 * Create notifications for multiple recipients using bulkCreate (single DB query)
 * and emit to each connected user via Socket.io.
 */
async function createAndEmitBulkNotifications(req, { type, title, message, senderId, recipientIds, referenceType, referenceId }) {
    if (!recipientIds || recipientIds.length === 0) return [];

    // Build array of notification objects for bulkCreate
    const notificationRows = recipientIds.map(recipientId => ({
        type,
        title,
        message,
        sender_id: senderId || null,
        recipient_id: recipientId,
        reference_type: referenceType || null,
        reference_id: referenceId || null,
        is_read: false,
    }));

    // Single DB query for all inserts
    const notifications = await Notification.bulkCreate(notificationRows);

    // Emit to each connected recipient
    const io = req.app.get('io');
    const userSocketMap = req.app.get('userSocketMap');

    notifications.forEach(notification => {
        emitToUser(io, userSocketMap, notification.recipient_id, 'notification', notification.toJSON());
    });

    return notifications;
}

module.exports = { createAndEmitNotification, createAndEmitBulkNotifications };
