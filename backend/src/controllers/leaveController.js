const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { Op } = require('sequelize');
const { createAndEmitNotification, createAndEmitBulkNotifications } = require('../utils/notificationHelper');

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

exports.apply = async (req, res) => {
    try {
        if (!requireRole(req, res, ['employee', 'intern'])) return;
        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        const { leave_type, start_date, end_date, reason } = req.body;

        if (!leave_type || !start_date || !end_date || !reason) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Calculate total days
        const start = new Date(start_date);
        const end = new Date(end_date);
        const total_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (total_days < 1) {
            return res.status(400).json({ success: false, message: 'End date must be on or after start date' });
        }

        const leave = await Leave.create({
            employee_id: emp.id,
            leave_type,
            start_date,
            end_date,
            total_days,
            reason,
            status: 'pending',
        });

        // Notify admins about the leave request
        try {
            const empUser = await User.findByPk(req.user.id, { attributes: ['first_name', 'last_name'] });
            const employeeName = empUser ? `${empUser.first_name} ${empUser.last_name}` : 'An employee';

            const admins = await User.findAll({
                where: { role: 'admin', is_active: true },
                attributes: ['id'],
            });
            const adminIds = admins.map(a => a.id);

            if (adminIds.length > 0) {
                await createAndEmitBulkNotifications(req, {
                    type: 'leave_request',
                    title: 'New Leave Request',
                    message: `${employeeName} requested ${leave_type} leave (${start_date} to ${end_date})`,
                    senderId: req.user.id,
                    recipientIds: adminIds,
                    referenceType: 'leave',
                    referenceId: leave.id,
                });
            }
        } catch (notifError) {
            console.error('Leave request notification error:', notifError);
        }

        res.status(201).json({ success: true, leave });
    } catch (error) {
        console.error('Apply Leave Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMyLeaves = async (req, res) => {
    try {
        if (!requireRole(req, res, ['employee', 'intern'])) return;
        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        const leaves = await Leave.findAll({
            where: { employee_id: emp.id },
            order: [['created_at', 'DESC']],
        });

        res.json({ success: true, leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMyBalance = async (req, res) => {
    try {
        if (!requireRole(req, res, ['employee', 'intern'])) return;
        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        // Default leave allocation per year
        const allocation = { casual: 12, sick: 6, earned: 15 };

        // Get all approved leaves for current year
        const currentYear = new Date().getFullYear();
        const approvedLeaves = await Leave.findAll({
            where: {
                employee_id: emp.id,
                status: 'approved',
                start_date: {
                    [Op.gte]: `${currentYear}-01-01`,
                    [Op.lte]: `${currentYear}-12-31`,
                },
            },
        });

        const used = { casual: 0, sick: 0, earned: 0, unpaid: 0 };
        approvedLeaves.forEach((l) => {
            if (used[l.leave_type] !== undefined) {
                used[l.leave_type] += l.total_days;
            }
        });

        // Also count pending leaves
        const pendingLeaves = await Leave.findAll({
            where: {
                employee_id: emp.id,
                status: 'pending',
                start_date: {
                    [Op.gte]: `${currentYear}-01-01`,
                    [Op.lte]: `${currentYear}-12-31`,
                },
            },
        });
        const pending = { casual: 0, sick: 0, earned: 0, unpaid: 0 };
        pendingLeaves.forEach((l) => {
            if (pending[l.leave_type] !== undefined) {
                pending[l.leave_type] += l.total_days;
            }
        });

        const balance = {
            casual: { total: allocation.casual, used: used.casual, pending: pending.casual, remaining: allocation.casual - used.casual },
            sick: { total: allocation.sick, used: used.sick, pending: pending.sick, remaining: allocation.sick - used.sick },
            earned: { total: allocation.earned, used: used.earned, pending: pending.earned, remaining: allocation.earned - used.earned },
        };

        res.json({ success: true, balance });
    } catch (error) {
        console.error('Get Balance Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.cancel = async (req, res) => {
    try {
        if (!requireRole(req, res, ['employee', 'intern'])) return;
        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        const leave = await Leave.findOne({
            where: { id: req.params.id, employee_id: emp.id },
        });

        if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
        if (leave.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled' });
        }

        await leave.update({ status: 'cancelled' });
        res.json({ success: true, leave });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAll = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const leaves = await Leave.findAll({
            include: [{
                model: Employee,
                include: [{
                    model: User,
                    attributes: ['first_name', 'last_name', 'avatar', 'role'],
                    where: { role: { [Op.in]: ['employee', 'intern'] } },
                }]
            }],
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, leaves });
    } catch (error) {
        console.error('Get All Leaves Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.approve = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const leave = await Leave.findByPk(req.params.id);
        if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

        await leave.update({
            status: 'approved',
            approved_by: req.user.id,
            approved_at: new Date(),
        });

        // Notify the employee about approval
        try {
            const emp = await Employee.findByPk(leave.employee_id, { attributes: ['user_id'] });
            if (emp) {
                await createAndEmitNotification(req, {
                    type: 'leave_approved',
                    title: 'Leave Approved',
                    message: `Your ${leave.leave_type} leave (${leave.start_date} to ${leave.end_date}) has been approved`,
                    senderId: req.user.id,
                    recipientId: emp.user_id,
                    referenceType: 'leave',
                    referenceId: leave.id,
                });
            }
        } catch (notifError) {
            console.error('Leave approval notification error:', notifError);
        }

        res.json({ success: true, leave });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.reject = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const leave = await Leave.findByPk(req.params.id);
        if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

        await leave.update({
            status: 'rejected',
            approved_by: req.user.id,
            rejection_reason: req.body.reason || '',
        });

        // Notify the employee about rejection
        try {
            const emp = await Employee.findByPk(leave.employee_id, { attributes: ['user_id'] });
            if (emp) {
                await createAndEmitNotification(req, {
                    type: 'leave_rejected',
                    title: 'Leave Rejected',
                    message: `Your ${leave.leave_type} leave (${leave.start_date} to ${leave.end_date}) has been rejected${req.body.reason ? ': ' + req.body.reason : ''}`,
                    senderId: req.user.id,
                    recipientId: emp.user_id,
                    referenceType: 'leave',
                    referenceId: leave.id,
                });
            }
        } catch (notifError) {
            console.error('Leave rejection notification error:', notifError);
        }

        res.json({ success: true, leave });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
