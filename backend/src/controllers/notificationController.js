const Notification = require('../models/Notification');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Client = require('../models/Client');
const EmployeeProject = require('../models/EmployeeProject');
const { Op } = require('sequelize');
const { createAndEmitBulkNotifications } = require('../utils/notificationHelper');
const { emitToUser } = require('../utils/socketEmitter');

// GET /notifications — paginated list for current user
exports.getMyNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const unreadOnly = req.query.unread_only === 'true';

        const where = { recipient_id: req.user.id };
        if (unreadOnly) where.is_read = false;

        const { count, rows } = await Notification.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit,
            offset,
            include: [{
                model: User,
                as: 'sender',
                attributes: ['id', 'first_name', 'last_name', 'avatar', 'role'],
                required: false,
            }],
        });

        res.json({
            success: true,
            notifications: rows,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /notifications/by-user/:userId — admin: get notifications for a specific user
exports.getByUserId = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows } = await Notification.findAndCountAll({
            where: { recipient_id: req.params.userId },
            order: [['created_at', 'DESC']],
            limit,
            offset,
            include: [{
                model: User,
                as: 'sender',
                attributes: ['id', 'first_name', 'last_name', 'avatar', 'role'],
                required: false,
            }],
        });

        res.json({
            success: true,
            notifications: rows,
            pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
        });
    } catch (error) {
        console.error('Get User Notifications Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /notifications/unread-count
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.count({
            where: { recipient_id: req.user.id, is_read: false },
        });
        res.json({ success: true, count });
    } catch (error) {
        console.error('Get Unread Count Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /notifications/:id/read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, recipient_id: req.user.id },
        });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await notification.update({ is_read: true, read_at: new Date() });

        // Emit to all user's tabs for cross-tab sync
        const io = req.app.get('io');
        const userSocketMap = req.app.get('userSocketMap');
        emitToUser(io, userSocketMap, req.user.id, 'notification_read', {
            id: notification.id,
        });

        res.json({ success: true, notification });
    } catch (error) {
        console.error('Mark As Read Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /notifications/read-all
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { is_read: true, read_at: new Date() },
            { where: { recipient_id: req.user.id, is_read: false } }
        );

        // Emit to all user's tabs for cross-tab sync
        const io = req.app.get('io');
        const userSocketMap = req.app.get('userSocketMap');
        emitToUser(io, userSocketMap, req.user.id, 'notifications_all_read', {});

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark All Read Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /notifications/send — Admin only
exports.sendNotification = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { title, message, target_type, target_id } = req.body;

        if (!title || !message || !target_type) {
            return res.status(400).json({ success: false, message: 'title, message, and target_type are required' });
        }

        let recipientIds = [];

        switch (target_type) {
            case 'all_employees': {
                const users = await User.findAll({
                    where: { role: { [Op.in]: ['employee', 'intern'] }, is_active: true },
                    attributes: ['id'],
                });
                recipientIds = users.map(u => u.id);
                break;
            }
            case 'project_team': {
                if (!target_id) {
                    return res.status(400).json({ success: false, message: 'target_id (project_id) is required for project_team' });
                }
                const assignments = await EmployeeProject.findAll({
                    where: { project_id: target_id },
                    attributes: ['employee_id'],
                });
                const employeeIds = assignments.map(a => a.employee_id);
                if (employeeIds.length > 0) {
                    const employees = await Employee.findAll({
                        where: { id: { [Op.in]: employeeIds } },
                        attributes: ['user_id'],
                    });
                    recipientIds = employees.map(e => e.user_id);
                }
                break;
            }
            case 'individual': {
                if (!target_id) {
                    return res.status(400).json({ success: false, message: 'target_id (user_id) is required for individual' });
                }
                recipientIds = [target_id];
                break;
            }
            case 'client': {
                if (!target_id) {
                    return res.status(400).json({ success: false, message: 'target_id (client_id) is required for client' });
                }
                // target_id is a client.id — find the user account linked to this client
                const clientUser = await User.findOne({
                    where: { client_id: target_id, role: 'client' },
                    attributes: ['id'],
                });
                if (!clientUser) {
                    // Fallback: check legacy Client.user_id
                    const client = await Client.findByPk(target_id, { attributes: ['user_id'] });
                    if (client && client.user_id) {
                        recipientIds = [client.user_id];
                    }
                } else {
                    recipientIds = [clientUser.id];
                }
                break;
            }
            default:
                return res.status(400).json({ success: false, message: 'Invalid target_type' });
        }

        if (recipientIds.length === 0) {
            const msg = target_type === 'client'
                ? 'This client does not have a portal account. Enable portal access for the client first.'
                : 'No recipients found for the given target';
            return res.status(400).json({ success: false, message: msg });
        }

        const notifications = await createAndEmitBulkNotifications(req, {
            type: 'admin_announcement',
            title,
            message,
            senderId: req.user.id,
            recipientIds,
            referenceType: target_type === 'project_team' ? 'project' : null,
            referenceId: target_type === 'project_team' ? target_id : null,
        });

        res.status(201).json({ success: true, count: notifications.length, message: `Notification sent to ${notifications.length} recipient(s)` });
    } catch (error) {
        console.error('Send Notification Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /notifications/:id
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, recipient_id: req.user.id },
        });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await notification.destroy();
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete Notification Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
