const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { Op } = require('sequelize');

const MAX_HOURS = 8;

// Helper: get employee record for logged-in user
const getEmployeeForUser = async (userId) => {
    return Employee.findOne({ where: { user_id: userId } });
};

// Auto-checkout employees who have been checked in for more than MAX_HOURS
const autoCheckoutExpired = async () => {
    const now = new Date();
    const openRecords = await Attendance.findAll({
        where: { check_in: { [Op.ne]: null }, check_out: null },
    });
    for (const record of openRecords) {
        const checkIn = new Date(record.check_in);
        const maxCheckout = new Date(checkIn.getTime() + MAX_HOURS * 60 * 60 * 1000);
        if (now >= maxCheckout) {
            await record.update({
                check_out: maxCheckout,
                total_hours: MAX_HOURS,
            });
        }
    }
};

exports.checkIn = async (req, res) => {
    try {
        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        const today = new Date().toISOString().split('T')[0];

        // Check if already checked in today
        const existing = await Attendance.findOne({ where: { employee_id: emp.id, date: today } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already checked in today' });
        }

        const { work_mode, notes } = req.body;
        const attendance = await Attendance.create({
            employee_id: emp.id,
            date: today,
            check_in: new Date(),
            status: 'present',
            work_mode: work_mode || 'office',
            notes: notes || '',
        });

        res.status(201).json({ success: true, attendance });
    } catch (error) {
        console.error('Check-in Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.checkOut = async (req, res) => {
    try {
        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ where: { employee_id: emp.id, date: today } });

        if (!attendance) {
            return res.status(400).json({ success: false, message: 'No check-in found for today' });
        }
        if (attendance.check_out) {
            return res.status(400).json({ success: false, message: 'Already checked out today' });
        }

        const checkOut = new Date();
        const checkIn = new Date(attendance.check_in);
        const rawHours = (checkOut - checkIn) / (1000 * 60 * 60);
        const totalHours = Math.min(rawHours, MAX_HOURS);

        // If past max hours, set check_out to check_in + MAX_HOURS
        const actualCheckout = rawHours >= MAX_HOURS
            ? new Date(checkIn.getTime() + MAX_HOURS * 60 * 60 * 1000)
            : checkOut;

        await attendance.update({
            check_out: actualCheckout,
            total_hours: parseFloat(totalHours.toFixed(2)),
        });

        res.json({ success: true, attendance });
    } catch (error) {
        console.error('Check-out Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getToday = async (req, res) => {
    try {
        await autoCheckoutExpired();
        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ where: { employee_id: emp.id, date: today } });

        res.json({ success: true, attendance: attendance || null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMyAttendance = async (req, res) => {
    try {
        await autoCheckoutExpired();
        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        const { month, year } = req.query;
        const where = { employee_id: emp.id };

        if (month && year) {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month
            where.date = { [Op.between]: [startDate, endDate] };
        }

        const records = await Attendance.findAll({
            where,
            order: [['date', 'DESC']],
        });

        res.json({ success: true, attendance: records });
    } catch (error) {
        console.error('Get Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /attendance/by-employee/:employeeId — admin: get attendance for a specific employee
exports.getByEmployee = async (req, res) => {
    try {
        await autoCheckoutExpired();
        const { month, year } = req.query;
        const where = { employee_id: req.params.employeeId };

        if (month && year) {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];
            where.date = { [Op.between]: [startDate, endDate] };
        }

        const records = await Attendance.findAll({
            where,
            order: [['date', 'DESC']],
        });

        res.json({ success: true, attendance: records });
    } catch (error) {
        console.error('Get Employee Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAll = async (req, res) => {
    try {
        await autoCheckoutExpired();
        const records = await Attendance.findAll({ order: [['date', 'DESC']] });
        res.json({ success: true, attendance: records });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getByDate = async (req, res) => {
    try {
        await autoCheckoutExpired();
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date parameter is required' });
        }

        // Get all active employees
        const allEmployees = await Employee.findAll({
            where: { is_active: true },
            include: [{
                model: User,
                where: { role: { [Op.in]: ['employee', 'intern'] } },
                attributes: ['id', 'first_name', 'last_name', 'email', 'avatar', 'role'],
            }],
        });

        // Get attendance records for the given date
        const attendanceRecords = await Attendance.findAll({
            where: { date },
            include: [{
                model: Employee,
                include: [{
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'email', 'avatar', 'role'],
                }],
            }],
        });

        // Build a set of employee IDs who have present-type attendance
        const presentEmployeeIds = new Set();
        const attendanceByEmpId = {};
        attendanceRecords.forEach((record) => {
            attendanceByEmpId[record.employee_id] = record;
            if (['present', 'late', 'half-day'].includes(record.status)) {
                presentEmployeeIds.add(record.employee_id);
            }
        });

        // Separate present and absent
        const present = [];
        const absent = [];

        allEmployees.forEach((emp) => {
            const record = attendanceByEmpId[emp.id];
            if (presentEmployeeIds.has(emp.id)) {
                present.push(record);
            } else {
                absent.push({
                    employee_id: emp.id,
                    status: record ? record.status : 'absent',
                    notes: record ? record.notes : null,
                    Employee: {
                        id: emp.id,
                        employee_uid: emp.employee_uid,
                        designation: emp.designation,
                        department: emp.department,
                        employee_type: emp.employee_type,
                        User: emp.User,
                    },
                });
            }
        });

        const totalEmployees = allEmployees.length;
        const totalPresent = present.length;
        const totalAbsent = absent.length;

        res.json({
            success: true,
            attendance: present,
            absent,
            summary: {
                total_present: totalPresent,
                total_absent: totalAbsent,
                total_employees: totalEmployees,
                present_percentage: totalEmployees ? Math.round((totalPresent / totalEmployees) * 100) : 0,
                absent_percentage: totalEmployees ? Math.round((totalAbsent / totalEmployees) * 100) : 0,
            },
        });
    } catch (error) {
        console.error('Get By Date Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMonthlyOverview = async (req, res) => {
    try {
        await autoCheckoutExpired();
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'Month and year parameters are required' });
        }

        const m = String(month).padStart(2, '0');
        const startDate = `${year}-${m}-01`;
        const daysInMonth = new Date(year, month, 0).getDate();
        const endDate = `${year}-${m}-${String(daysInMonth).padStart(2, '0')}`;

        // Get total active employees
        const allEmployees = await Employee.findAll({
            where: { is_active: true },
            include: [{
                model: User,
                where: { role: { [Op.in]: ['employee', 'intern'] } },
                attributes: ['id'],
            }],
        });
        const totalEmployees = allEmployees.length;

        // Get all attendance records for the month
        const records = await Attendance.findAll({
            where: {
                date: { [Op.between]: [startDate, endDate] },
            },
            attributes: ['date', 'status'],
        });

        // Group by date
        const overview = {};

        // Pre-fill all past dates (up to today) with zero counts
        const today = new Date().toISOString().split('T')[0];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${m}-${String(d).padStart(2, '0')}`;
            // Only include dates up to today
            if (dateStr > today) break;
            // Skip Sundays
            const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
            if (dayOfWeek === 0) continue;
            overview[dateStr] = { present_count: 0, absent_count: totalEmployees, late_count: 0, total_employees: totalEmployees };
        }

        // Fill in actual attendance data
        records.forEach((record) => {
            const d = record.date;
            if (!overview[d]) {
                overview[d] = { present_count: 0, absent_count: totalEmployees, late_count: 0, total_employees: totalEmployees };
            }
            if (['present', 'late', 'half-day'].includes(record.status)) {
                overview[d].present_count++;
                if (record.status === 'late') overview[d].late_count++;
            }
        });

        // Recalculate absent counts
        Object.keys(overview).forEach((d) => {
            overview[d].absent_count = totalEmployees - overview[d].present_count;
        });

        res.json({ success: true, overview, total_employees: totalEmployees });
    } catch (error) {
        console.error('Monthly Overview Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
