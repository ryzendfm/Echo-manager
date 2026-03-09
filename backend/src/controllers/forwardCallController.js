const ForwardCall = require('../models/ForwardCall');
const Client = require('../models/Client');
const User = require('../models/User');
const { Op } = require('sequelize');

const requireRole = (req, res, roles) => {
    const role = req.user && req.user.role;
    if (!role || !roles.includes(role)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return false;
    }
    return true;
};

const getClientForUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user || !user.client_id) return null;
    return Client.findByPk(user.client_id);
};

// Generate next FWD-XXX uid
const generateForwardUid = async () => {
    const last = await ForwardCall.findOne({ order: [['id', 'DESC']] });
    const nextNum = last ? last.id + 1 : 1;
    return `FWD-${String(nextNum).padStart(3, '0')}`;
};

// POST /api/v1/forward-calls
exports.create = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const { title, description, client_id, scheduled_at, duration_minutes, meeting_link } = req.body;

        if (!title || !scheduled_at || !client_id) {
            return res.status(400).json({ success: false, message: 'title, scheduled_at, and client_id are required' });
        }

        // Verify client exists and is active
        const client = await Client.findByPk(client_id);
        if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
        if (!client.is_active) return res.status(400).json({ success: false, message: 'Client is inactive' });

        const forward_uid = await generateForwardUid();

        const forwardCall = await ForwardCall.create({
            forward_uid,
            title,
            description: description || null,
            client_id,
            scheduled_at,
            duration_minutes: duration_minutes || 30,
            status: 'scheduled',
            created_by: req.user.id,
            meeting_link: meeting_link || null,
            attended: false,
        });

        // Fetch back with client and creator
        const created = await ForwardCall.findByPk(forwardCall.id, {
            include: [
                { model: Client, attributes: ['id', 'client_uid', 'company_name', 'industry', 'contact_name', 'contact_email'] },
                { model: User, as: 'forwardCreator', attributes: ['first_name', 'last_name'] },
            ],
        });

        res.status(201).json({ success: true, forwardCall: created });
    } catch (error) {
        console.error('Create ForwardCall Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/v1/forward-calls
exports.getAll = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const { status, from, to } = req.query;
        const where = {};

        if (status) where.status = status;
        if (from || to) {
            where.scheduled_at = {};
            if (from) where.scheduled_at[Op.gte] = new Date(from);
            if (to) where.scheduled_at[Op.lte] = new Date(to + 'T23:59:59');
        }

        const forwardCalls = await ForwardCall.findAll({
            where,
            order: [['scheduled_at', 'DESC']],
            include: [
                { model: Client, attributes: ['id', 'client_uid', 'company_name', 'industry', 'contact_name', 'contact_email'] },
                { model: User, as: 'forwardCreator', attributes: ['first_name', 'last_name'] },
            ],
        });

        res.json({ success: true, forwardCalls });
    } catch (error) {
        console.error('Get All ForwardCalls Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/v1/forward-calls/me
exports.getMyForwardCalls = async (req, res) => {
    try {
        if (!requireRole(req, res, ['client'])) return;

        const client = await getClientForUser(req.user.id);
        if (!client) return res.status(404).json({ success: false, message: 'Client profile not found' });

        const { status } = req.query;
        const where = { client_id: client.id };
        if (status) where.status = status;

        const forwardCalls = await ForwardCall.findAll({
            where,
            order: [['scheduled_at', 'DESC']],
            include: [
                { model: User, as: 'forwardCreator', attributes: ['first_name', 'last_name'] },
            ],
        });

        res.json({ success: true, forwardCalls });
    } catch (error) {
        console.error('Get My ForwardCalls Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/v1/forward-calls/:id
exports.getById = async (req, res) => {
    try {
        const forwardCall = await ForwardCall.findByPk(req.params.id, {
            include: [
                { model: Client, attributes: ['id', 'client_uid', 'company_name', 'industry', 'contact_name', 'contact_email', 'contact_phone'] },
                { model: User, as: 'forwardCreator', attributes: ['first_name', 'last_name'] },
            ],
        });

        if (!forwardCall) return res.status(404).json({ success: false, message: 'Forward call not found' });

        res.json({ success: true, forwardCall });
    } catch (error) {
        console.error('Get ForwardCall Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /api/v1/forward-calls/:id
exports.update = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const forwardCall = await ForwardCall.findByPk(req.params.id);
        if (!forwardCall) return res.status(404).json({ success: false, message: 'Forward call not found' });

        const { title, description, client_id, scheduled_at, duration_minutes, meeting_link } = req.body;

        // If changing client, verify new client exists
        if (client_id && client_id !== forwardCall.client_id) {
            const client = await Client.findByPk(client_id);
            if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
        }

        await forwardCall.update({
            title: title !== undefined ? title : forwardCall.title,
            description: description !== undefined ? description : forwardCall.description,
            client_id: client_id !== undefined ? client_id : forwardCall.client_id,
            scheduled_at: scheduled_at !== undefined ? scheduled_at : forwardCall.scheduled_at,
            duration_minutes: duration_minutes !== undefined ? duration_minutes : forwardCall.duration_minutes,
            meeting_link: meeting_link !== undefined ? meeting_link : forwardCall.meeting_link,
        });

        const updated = await ForwardCall.findByPk(forwardCall.id, {
            include: [
                { model: Client, attributes: ['id', 'client_uid', 'company_name', 'industry', 'contact_name', 'contact_email'] },
                { model: User, as: 'forwardCreator', attributes: ['first_name', 'last_name'] },
            ],
        });

        res.json({ success: true, forwardCall: updated });
    } catch (error) {
        console.error('Update ForwardCall Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/v1/forward-calls/:id/status
exports.updateStatus = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const forwardCall = await ForwardCall.findByPk(req.params.id);
        if (!forwardCall) return res.status(404).json({ success: false, message: 'Forward call not found' });

        const { status } = req.body;
        if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        await forwardCall.update({ status });

        res.json({ success: true, forwardCall });
    } catch (error) {
        console.error('Update ForwardCall Status Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/v1/forward-calls/:id/attendance
exports.markAttendance = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const forwardCall = await ForwardCall.findByPk(req.params.id);
        if (!forwardCall) return res.status(404).json({ success: false, message: 'Forward call not found' });

        const { attended } = req.body;
        if (typeof attended !== 'boolean') {
            return res.status(400).json({ success: false, message: 'attended (boolean) is required' });
        }

        await forwardCall.update({ attended });

        res.json({ success: true, forwardCall });
    } catch (error) {
        console.error('Mark Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /api/v1/forward-calls/:id
exports.delete = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const forwardCall = await ForwardCall.findByPk(req.params.id);
        if (!forwardCall) return res.status(404).json({ success: false, message: 'Forward call not found' });

        await forwardCall.destroy();

        res.json({ success: true, message: 'Forward call deleted' });
    } catch (error) {
        console.error('Delete ForwardCall Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
