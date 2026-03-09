const ScrumCall = require('../models/ScrumCall');
const ScrumCallParticipant = require('../models/ScrumCallParticipant');
const Employee = require('../models/Employee');
const User = require('../models/User');
const EmployeeProject = require('../models/EmployeeProject');
const { Op } = require('sequelize');

// Auto-update scrum call statuses based on scheduled time and duration
const autoUpdateStatuses = async () => {
    const now = new Date();
    const activeCalls = await ScrumCall.findAll({
        where: { status: { [Op.in]: ['scheduled', 'in_progress'] } },
    });
    for (const call of activeCalls) {
        const startTime = new Date(call.scheduled_at);
        const endTime = new Date(call.scheduled_at);
        endTime.setMinutes(endTime.getMinutes() + (call.duration_minutes || 30));

        if (now >= endTime) {
            await call.update({ status: 'completed' });
        } else if (now >= startTime && call.status === 'scheduled') {
            await call.update({ status: 'in_progress' });
        }
    }
};

const requireRole = (req, res, roles) => {
    const role = req.user && req.user.role;
    if (!role || !roles.includes(role)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return false;
    }
    return true;
};

const getEmployeeForUser = async (userId) => {
    return Employee.findOne({ where: { user_id: userId } });
};

// Generate next SCR-XXX uid
const generateScrumUid = async () => {
    const last = await ScrumCall.findOne({ order: [['id', 'DESC']] });
    const nextNum = last ? last.id + 1 : 1;
    return `SCR-${String(nextNum).padStart(3, '0')}`;
};

// POST /api/v1/scrum-calls
exports.create = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const { title, description, scheduled_at, duration_minutes, selection_type, employee_ids, project_ids, meeting_link } = req.body;

        if (!title || !scheduled_at || !selection_type) {
            return res.status(400).json({ success: false, message: 'title, scheduled_at, and selection_type are required' });
        }

        // Resolve participant employee IDs
        let participantEmployeeIds = [];

        if (selection_type === 'all') {
            const allEmployees = await Employee.findAll({
                where: { is_active: true },
                include: [{ model: User, where: { role: { [Op.in]: ['employee', 'intern'] } }, attributes: ['id'] }],
            });
            participantEmployeeIds = allEmployees.map(e => e.id);
        } else if (selection_type === 'individual') {
            if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
                return res.status(400).json({ success: false, message: 'employee_ids array is required for individual selection' });
            }
            participantEmployeeIds = employee_ids;
        } else if (selection_type === 'team') {
            if (!project_ids || !Array.isArray(project_ids) || project_ids.length === 0) {
                return res.status(400).json({ success: false, message: 'project_ids array is required for team selection' });
            }
            const assignments = await EmployeeProject.findAll({
                where: { project_id: { [Op.in]: project_ids } },
            });
            // Deduplicate
            participantEmployeeIds = [...new Set(assignments.map(a => a.employee_id))];
        }

        if (participantEmployeeIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No participants found for the given selection' });
        }

        const scrum_uid = await generateScrumUid();

        const scrumCall = await ScrumCall.create({
            scrum_uid,
            title,
            description: description || null,
            scheduled_at,
            duration_minutes: duration_minutes || 30,
            status: 'scheduled',
            selection_type,
            created_by: req.user.id,
            meeting_link: meeting_link || null,
        });

        // Bulk create participants
        const participantRecords = participantEmployeeIds.map(empId => ({
            scrum_call_id: scrumCall.id,
            employee_id: empId,
            attended: false,
        }));
        await ScrumCallParticipant.bulkCreate(participantRecords);

        // Fetch back with participants
        const created = await ScrumCall.findByPk(scrumCall.id, {
            include: [
                {
                    model: ScrumCallParticipant,
                    as: 'participants',
                    include: [{ model: Employee, include: [{ model: User, attributes: ['first_name', 'last_name', 'email', 'avatar'] }] }],
                },
                { model: User, as: 'creator', attributes: ['first_name', 'last_name'] },
            ],
        });

        res.status(201).json({ success: true, scrumCall: created });
    } catch (error) {
        console.error('Create ScrumCall Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/v1/scrum-calls
exports.getAll = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        await autoUpdateStatuses();

        const { status, from, to } = req.query;
        const where = {};

        if (status) where.status = status;
        if (from || to) {
            where.scheduled_at = {};
            if (from) where.scheduled_at[Op.gte] = new Date(from);
            if (to) where.scheduled_at[Op.lte] = new Date(to + 'T23:59:59');
        }

        const scrumCalls = await ScrumCall.findAll({
            where,
            order: [['scheduled_at', 'DESC']],
            include: [
                {
                    model: ScrumCallParticipant,
                    as: 'participants',
                    include: [{ model: Employee, include: [{ model: User, attributes: ['first_name', 'last_name', 'email', 'avatar'] }] }],
                },
                { model: User, as: 'creator', attributes: ['first_name', 'last_name'] },
            ],
        });

        res.json({ success: true, scrumCalls });
    } catch (error) {
        console.error('Get All ScrumCalls Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/v1/scrum-calls/me
exports.getMyScrumCalls = async (req, res) => {
    try {
        if (!requireRole(req, res, ['employee', 'intern'])) return;

        await autoUpdateStatuses();

        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        const { status } = req.query;

        // Find scrum call IDs where this employee is a participant
        const myParticipations = await ScrumCallParticipant.findAll({
            where: { employee_id: emp.id },
            attributes: ['scrum_call_id', 'attended'],
        });

        const scrumCallIds = myParticipations.map(p => p.scrum_call_id);
        if (scrumCallIds.length === 0) {
            return res.json({ success: true, scrumCalls: [] });
        }

        const where = { id: { [Op.in]: scrumCallIds } };
        if (status) where.status = status;

        const scrumCalls = await ScrumCall.findAll({
            where,
            order: [['scheduled_at', 'DESC']],
            include: [
                {
                    model: ScrumCallParticipant,
                    as: 'participants',
                    include: [{ model: Employee, include: [{ model: User, attributes: ['first_name', 'last_name', 'email', 'avatar'] }] }],
                },
                { model: User, as: 'creator', attributes: ['first_name', 'last_name'] },
            ],
        });

        // Attach the current employee's attendance status
        const attendanceMap = {};
        myParticipations.forEach(p => { attendanceMap[p.scrum_call_id] = p.attended; });

        const enriched = scrumCalls.map(sc => ({
            ...sc.toJSON(),
            myAttendance: attendanceMap[sc.id] || false,
        }));

        res.json({ success: true, scrumCalls: enriched });
    } catch (error) {
        console.error('Get My ScrumCalls Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/v1/scrum-calls/:id
exports.getById = async (req, res) => {
    try {
        await autoUpdateStatuses();

        const scrumCall = await ScrumCall.findByPk(req.params.id, {
            include: [
                {
                    model: ScrumCallParticipant,
                    as: 'participants',
                    include: [{ model: Employee, include: [{ model: User, attributes: ['first_name', 'last_name', 'email', 'avatar', 'role'] }] }],
                },
                { model: User, as: 'creator', attributes: ['first_name', 'last_name'] },
            ],
        });

        if (!scrumCall) return res.status(404).json({ success: false, message: 'Scrum call not found' });

        res.json({ success: true, scrumCall });
    } catch (error) {
        console.error('Get ScrumCall Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /api/v1/scrum-calls/:id
exports.update = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const scrumCall = await ScrumCall.findByPk(req.params.id);
        if (!scrumCall) return res.status(404).json({ success: false, message: 'Scrum call not found' });

        const { title, description, scheduled_at, duration_minutes, meeting_link } = req.body;

        await scrumCall.update({
            title: title !== undefined ? title : scrumCall.title,
            description: description !== undefined ? description : scrumCall.description,
            scheduled_at: scheduled_at !== undefined ? scheduled_at : scrumCall.scheduled_at,
            duration_minutes: duration_minutes !== undefined ? duration_minutes : scrumCall.duration_minutes,
            meeting_link: meeting_link !== undefined ? meeting_link : scrumCall.meeting_link,
        });

        // Fetch back with participants
        const updated = await ScrumCall.findByPk(scrumCall.id, {
            include: [
                {
                    model: ScrumCallParticipant,
                    as: 'participants',
                    include: [{ model: Employee, include: [{ model: User, attributes: ['first_name', 'last_name', 'email', 'avatar'] }] }],
                },
                { model: User, as: 'creator', attributes: ['first_name', 'last_name'] },
            ],
        });

        res.json({ success: true, scrumCall: updated });
    } catch (error) {
        console.error('Update ScrumCall Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/v1/scrum-calls/:id/status
exports.updateStatus = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const scrumCall = await ScrumCall.findByPk(req.params.id);
        if (!scrumCall) return res.status(404).json({ success: false, message: 'Scrum call not found' });

        const { status } = req.body;
        if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        await scrumCall.update({ status });

        res.json({ success: true, scrumCall });
    } catch (error) {
        console.error('Update ScrumCall Status Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/v1/scrum-calls/:id/attendance
exports.markAttendance = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const scrumCall = await ScrumCall.findByPk(req.params.id);
        if (!scrumCall) return res.status(404).json({ success: false, message: 'Scrum call not found' });

        const { attendees } = req.body;
        // attendees is an array of { employee_id, attended }
        if (!attendees || !Array.isArray(attendees)) {
            return res.status(400).json({ success: false, message: 'attendees array is required' });
        }

        for (const entry of attendees) {
            await ScrumCallParticipant.update(
                { attended: entry.attended },
                { where: { scrum_call_id: scrumCall.id, employee_id: entry.employee_id } }
            );
        }

        // Fetch updated
        const updated = await ScrumCall.findByPk(scrumCall.id, {
            include: [
                {
                    model: ScrumCallParticipant,
                    as: 'participants',
                    include: [{ model: Employee, include: [{ model: User, attributes: ['first_name', 'last_name', 'email', 'avatar'] }] }],
                },
                { model: User, as: 'creator', attributes: ['first_name', 'last_name'] },
            ],
        });

        res.json({ success: true, scrumCall: updated });
    } catch (error) {
        console.error('Mark Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/v1/scrum-calls/:id/notes
exports.updateNotes = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const scrumCall = await ScrumCall.findByPk(req.params.id);
        if (!scrumCall) return res.status(404).json({ success: false, message: 'Scrum call not found' });

        const { notes } = req.body;
        await scrumCall.update({ notes: notes || null });

        res.json({ success: true, scrumCall });
    } catch (error) {
        console.error('Update ScrumCall Notes Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /api/v1/scrum-calls/:id
exports.delete = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;

        const scrumCall = await ScrumCall.findByPk(req.params.id);
        if (!scrumCall) return res.status(404).json({ success: false, message: 'Scrum call not found' });

        // Delete participants first, then the scrum call
        await ScrumCallParticipant.destroy({ where: { scrum_call_id: scrumCall.id } });
        await scrumCall.destroy();

        res.json({ success: true, message: 'Scrum call deleted' });
    } catch (error) {
        console.error('Delete ScrumCall Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
