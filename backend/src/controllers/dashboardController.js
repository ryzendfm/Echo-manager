const Project = require('../models/Project');
const Employee = require('../models/Employee');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Task = require('../models/Task');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const EmployeeProject = require('../models/EmployeeProject');
const { Op, fn, col, literal } = require('sequelize');

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

const getClientForUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user || !user.client_id) return null;
    return Client.findByPk(user.client_id);
};

exports.getAdminStats = async (req, res) => {
    try {
        const activeProjectsWhere = { status: { [Op.in]: ['in_progress', 'planning'] } };
        const activeProjects = await Project.count({ where: activeProjectsWhere });
        const activeProjectsList = await Project.findAll({
            where: activeProjectsWhere,
            attributes: ['id', 'project_name', 'status', 'deadline'],
            order: [['deadline', 'ASC']],
        });

        const totalEmployees = await Employee.count({ where: { is_active: true } });
        const employeesList = await Employee.findAll({
            where: { is_active: true },
            attributes: ['id', 'employee_uid', 'designation', 'department'],
            include: [{ model: User, attributes: ['first_name', 'last_name', 'email'] }],
            order: [['created_at', 'DESC']],
        });

        const totalClients = await Client.count({ where: { is_active: true } });
        const clientsList = await Client.findAll({
            where: { is_active: true },
            attributes: ['id', 'client_uid', 'company_name', 'contact_name', 'contact_email'],
            order: [['created_at', 'DESC']],
        });

        // Revenue this month from transactions
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const revenueWhere = { type: 'income', date: { [Op.gte]: firstOfMonth.toISOString().split('T')[0] } };
        const incomeThisMonth = await Transaction.sum('amount', { where: revenueWhere }) || 0;
        const revenueTransactionsList = await Transaction.findAll({
            where: revenueWhere,
            attributes: ['id', 'amount', 'date', 'description', 'category', 'payment_method'],
            order: [['date', 'DESC']],
        });

        const pendingInvoicesWhere = { status: { [Op.in]: ['sent', 'draft', 'partially_paid'] } };
        const pendingInvoices = await Invoice.count({ where: pendingInvoicesWhere });
        const pendingInvoicesList = await Invoice.findAll({
            where: pendingInvoicesWhere,
            attributes: ['id', 'invoice_uid', 'total_amount', 'status', 'due_date'],
            include: [{ model: Client, attributes: ['company_name'] }],
            order: [['due_date', 'ASC']],
        });
        const overdueInvoices = await Invoice.count({ where: { status: 'overdue' } });

        const overdueProjectsWhere = { deadline: { [Op.lt]: new Date().toISOString().split('T')[0] }, status: { [Op.notIn]: ['completed', 'cancelled'] } };
        const overdueProjects = await Project.count({ where: overdueProjectsWhere });
        const overdueProjectsList = await Project.findAll({
            where: overdueProjectsWhere,
            attributes: ['id', 'project_name', 'status', 'deadline'],
            order: [['deadline', 'ASC']],
        });

        res.json({
            success: true,
            stats: {
                activeProjects,
                activeProjectsList,
                totalEmployees,
                employeesList,
                totalClients,
                clientsList,
                revenueThisMonth: incomeThisMonth,
                revenueTransactionsList,
                pendingInvoices,
                pendingInvoicesList,
                overdueInvoices,
                overdueProjects,
                overdueProjectsList,
            }
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getEmployeeStats = async (req, res) => {
    try {
        if (!requireRole(req, res, ['employee', 'intern'])) return;
        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        const assignments = await EmployeeProject.findAll({ where: { employee_id: emp.id } });
        const projectIds = assignments.map(a => a.project_id);

        const activeProjectsWhere = {
            id: { [Op.in]: projectIds },
            status: { [Op.notIn]: ['completed', 'cancelled'] },
            is_active: true,
        };
        const activeProjects = projectIds.length === 0
            ? 0
            : await Project.count({ where: activeProjectsWhere });
        const activeProjectsList = projectIds.length === 0
            ? []
            : await Project.findAll({
                where: activeProjectsWhere,
                attributes: ['id', 'project_name', 'status', 'deadline'],
                order: [['deadline', 'ASC']],
            });

        const pendingTasksWhere = { assigned_to: emp.id, status: { [Op.notIn]: ['completed'] } };
        const pendingTasks = await Task.count({ where: pendingTasksWhere });
        const pendingTasksList = await Task.findAll({
            where: pendingTasksWhere,
            attributes: ['id', 'task_uid', 'title', 'status', 'priority', 'due_date'],
            include: [{ model: Project, attributes: ['project_name'] }],
            order: [['due_date', 'ASC']],
        });

        const highPriorityTasks = await Task.count({
            where: {
                assigned_to: emp.id,
                status: { [Op.notIn]: ['completed'] },
                priority: { [Op.in]: ['high', 'urgent'] },
            },
        });

        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const attendanceWhere = { employee_id: emp.id, date: { [Op.gte]: firstOfMonth.toISOString().split('T')[0] } };
        const totalAttendance = await Attendance.count({ where: attendanceWhere });
        const presentAttendance = await Attendance.count({
            where: {
                ...attendanceWhere,
                status: { [Op.in]: ['present', 'late'] },
            },
        });
        const attendancePercent = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;
        const attendanceList = await Attendance.findAll({
            where: attendanceWhere,
            attributes: ['id', 'date', 'status', 'check_in', 'check_out', 'total_hours', 'work_mode'],
            order: [['date', 'DESC']],
        });

        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = await Attendance.findOne({ where: { employee_id: emp.id, date: today } });
        const presentToday = !!todayAttendance && ['present', 'late'].includes(todayAttendance.status);

        const allocation = { casual: 12, sick: 6, earned: 15 };
        const currentYear = new Date().getFullYear();
        const approvedLeaves = await Leave.findAll({
            where: {
                employee_id: emp.id,
                status: 'approved',
                start_date: { [Op.gte]: `${currentYear}-01-01`, [Op.lte]: `${currentYear}-12-31` },
            },
        });
        const used = { casual: 0, sick: 0, earned: 0, unpaid: 0 };
        approvedLeaves.forEach((l) => {
            if (used[l.leave_type] !== undefined) used[l.leave_type] += l.total_days;
        });
        const remaining = {
            casual: Math.max(0, allocation.casual - used.casual),
            sick: Math.max(0, allocation.sick - used.sick),
            earned: Math.max(0, allocation.earned - used.earned),
        };
        const leaveRemainingDays = remaining.casual + remaining.sick + remaining.earned;

        // Next deadline: project with closest deadline from today (only projects this employee is assigned to)
        let nextDeadlineInDays = null;
        let nextDeadlineProjectName = null;
        let upcomingDeadlinesList = [];
        if (projectIds.length > 0) {
            const upcomingProjects = await Project.findAll({
                where: {
                    id: { [Op.in]: projectIds },
                    status: { [Op.notIn]: ['completed', 'cancelled'] },
                    deadline: { [Op.ne]: null, [Op.gte]: today },
                },
                order: [['deadline', 'ASC']],
                attributes: ['id', 'project_name', 'status', 'deadline'],
            });
            upcomingDeadlinesList = upcomingProjects;
            if (upcomingProjects.length > 0) {
                const upcoming = upcomingProjects[0];
                const diffMs = new Date(upcoming.deadline) - new Date(today);
                nextDeadlineInDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                nextDeadlineProjectName = upcoming.project_name;
            }
        }

        res.json({
            success: true,
            stats: {
                activeProjects,
                activeProjectsList,
                pendingTasks,
                pendingTasksList,
                highPriorityTasks,
                attendancePercent,
                attendanceList,
                presentToday,
                leaveRemainingDays,
                leaveBreakdown: remaining,
                nextDeadlineInDays,
                nextDeadlineProjectName,
                upcomingDeadlinesList,
            }
        });
    } catch (error) {
        console.error('Employee Dashboard Stats Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getClientStats = async (req, res) => {
    try {
        if (!requireRole(req, res, ['client'])) return;
        const client = await getClientForUser(req.user.id);
        if (!client) return res.status(404).json({ success: false, message: 'Client profile not found' });

        const totalProjects = await Project.count({ where: { client_id: client.id } });
        const totalProjectsList = await Project.findAll({
            where: { client_id: client.id },
            attributes: ['id', 'project_name', 'status', 'deadline'],
            order: [['created_at', 'DESC']],
        });

        const completedProjects = await Project.count({ where: { client_id: client.id, status: 'completed' } });
        const completedProjectsList = await Project.findAll({
            where: { client_id: client.id, status: 'completed' },
            attributes: ['id', 'project_name', 'status', 'deadline'],
            order: [['updated_at', 'DESC']],
        });

        const activeProjectsList = await Project.findAll({
            where: {
                client_id: client.id,
                status: { [Op.notIn]: ['completed', 'cancelled'] },
            },
            attributes: ['id', 'project_name', 'status', 'deadline'],
            order: [['deadline', 'ASC']],
        });

        const pendingInvoiceStatuses = ['sent', 'partially_paid', 'overdue'];
        const pendingInvoicesWhere = { client_id: client.id, status: { [Op.in]: pendingInvoiceStatuses } };
        const pendingInvoicesCount = await Invoice.count({ where: pendingInvoicesWhere });
        const pendingInvoicesAmount = await Invoice.sum('amount', { where: pendingInvoicesWhere }) || 0;
        const pendingInvoicesList = await Invoice.findAll({
            where: pendingInvoicesWhere,
            attributes: ['id', 'invoice_uid', 'total_amount', 'status', 'due_date'],
            order: [['due_date', 'ASC']],
        });

        // Next deadline: project with closest deadline from today (only this client's projects)
        const today = new Date().toISOString().split('T')[0];
        const upcomingDeadlines = await Project.findAll({
            where: {
                client_id: client.id,
                status: { [Op.notIn]: ['completed', 'cancelled'] },
                deadline: { [Op.ne]: null, [Op.gte]: today },
            },
            order: [['deadline', 'ASC']],
            attributes: ['id', 'project_name', 'status', 'deadline'],
        });

        let nextDeadlineInDays = null;
        let nextDeadlineProjectName = null;
        if (upcomingDeadlines.length > 0) {
            const upcoming = upcomingDeadlines[0];
            const diffMs = new Date(upcoming.deadline) - new Date(today);
            nextDeadlineInDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            nextDeadlineProjectName = upcoming.project_name;
        }

        res.json({
            success: true,
            stats: {
                totalProjects,
                totalProjectsList,
                completedProjects,
                completedProjectsList,
                activeProjectsList,
                pendingInvoicesCount,
                pendingInvoicesList,
                pendingInvoicesAmount: parseFloat(pendingInvoicesAmount),
                nextDeadlineInDays,
                nextDeadlineProjectName,
                upcomingDeadlinesList: upcomingDeadlines,
            }
        });
    } catch (error) {
        console.error('Client Dashboard Stats Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getRevenueChart = async (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const chartData = [];
        for (let m = 0; m < 12; m++) {
            const startDate = `${year}-${String(m + 1).padStart(2, '0')}-01`;
            const endDate = m === 11
                ? `${parseInt(year) + 1}-01-01`
                : `${year}-${String(m + 2).padStart(2, '0')}-01`;

            const income = await Transaction.sum('amount', {
                where: { type: 'income', date: { [Op.gte]: startDate, [Op.lt]: endDate } }
            }) || 0;

            const expense = await Transaction.sum('amount', {
                where: { type: 'expense', date: { [Op.gte]: startDate, [Op.lt]: endDate } }
            }) || 0;

            chartData.push({ name: months[m], income: parseFloat(income), expense: parseFloat(expense) });
        }

        res.json({ success: true, chartData });
    } catch (error) {
        console.error('Revenue Chart Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getRecentActivity = async (req, res) => {
    try {
        // Build activity from recent records
        const activities = [];

        // Recent projects
        const recentProjects = await Project.findAll({ order: [['created_at', 'DESC']], limit: 3 });
        for (const p of recentProjects) {
            const client = await Client.findByPk(p.client_id);
            activities.push({
                user: client?.company_name || 'System',
                initials: (client?.company_name || 'S').substring(0, 2).toUpperCase(),
                action: 'project created',
                target: p.project_name,
                time: p.created_at,
            });
        }

        // Recent invoices
        const recentInvoices = await Invoice.findAll({ order: [['created_at', 'DESC']], limit: 3 });
        for (const inv of recentInvoices) {
            const client = await Client.findByPk(inv.client_id);
            activities.push({
                user: client?.company_name || 'System',
                initials: (client?.company_name || 'S').substring(0, 2).toUpperCase(),
                action: `invoice ${inv.status}`,
                target: inv.invoice_uid,
                time: inv.created_at,
            });
        }

        // Recent transactions
        const recentTxns = await Transaction.findAll({ order: [['date', 'DESC']], limit: 3 });
        for (const t of recentTxns) {
            activities.push({
                user: 'Finance',
                initials: 'FI',
                action: `${t.type} recorded`,
                target: t.description,
                time: t.created_at,
            });
        }

        // Sort by time descending and take top 6
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        const topActivities = activities.slice(0, 6).map(a => ({
            ...a,
            time: getTimeAgo(a.time),
        }));

        res.json({ success: true, activities: topActivities });
    } catch (error) {
        console.error('Recent Activity Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

exports.getEmployeeCharts = async (req, res) => {
    try {
        if (!requireRole(req, res, ['employee', 'intern'])) return;
        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        // 1. Task Completion Velocity (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const completedTasks = await Task.findAll({
            where: {
                assigned_to: emp.id,
                status: 'completed',
                updated_at: { [Op.gte]: sevenDaysAgo }
            },
            attributes: [
                [fn('DATE', col('updated_at')), 'date'],
                [fn('COUNT', col('id')), 'count']
            ],
            group: [fn('DATE', col('updated_at'))]
        });

        const velocityData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const record = completedTasks.find(r => r.dataValues.date === dateStr);
            
            velocityData.push({
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDate: dateStr,
                completed: record ? parseInt(record.dataValues.count) : 0,
            });
        }

        // 2. Workload by Project (Active Tasks)
        const activeTasks = await Task.findAll({
            where: {
                assigned_to: emp.id,
                status: { [Op.ne]: 'completed' }
            },
            include: [{ model: Project, attributes: ['project_name'] }],
            attributes: ['project_id', [fn('COUNT', col('Task.id')), 'count']],
            group: ['project_id', 'Project.id', 'Project.project_name']
        });

        const workloadData = activeTasks.map(t => ({
            project: t.Project ? t.Project.project_name : 'Unknown',
            tasks: parseInt(t.dataValues.count),
            fullProjectName: t.Project ? t.Project.project_name : 'Unknown'
        }));

        res.json({
            success: true,
            charts: {
                velocity: velocityData,
                workload: workloadData,
            }
        });
    } catch (error) {
        console.error('Employee Charts Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getClientCharts = async (req, res) => {
    try {
        if (!requireRole(req, res, ['client'])) return;
        const client = await getClientForUser(req.user.id);
        if (!client) return res.status(404).json({ success: false, message: 'Client profile not found' });

        const activeProjects = await Project.findAll({
            where: { 
                client_id: client.id,
                status: { [Op.notIn]: ['completed', 'cancelled'] }
            }
        });

        const budgetBilledData = [];

        for (const project of activeProjects) {
            const invoices = await Invoice.findAll({
                where: { project_id: project.id },
                attributes: [[fn('SUM', col('total_amount')), 'total_billed']]
            });
            const totalBilled = invoices[0].dataValues.total_billed || 0;

            budgetBilledData.push({
                project: project.project_name.substring(0, 15) + (project.project_name.length > 15 ? '...' : ''),
                fullProjectName: project.project_name,
                budget: parseFloat(project.budget_estimated),
                billed: parseFloat(totalBilled)
            });
        }

        res.json({
            success: true,
            charts: {
                budgetBilled: budgetBilledData,
            }
        });
    } catch (error) {
        console.error('Client Charts Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
