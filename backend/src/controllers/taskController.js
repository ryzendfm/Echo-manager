const Task = require('../models/Task');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const EmployeeProject = require('../models/EmployeeProject');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { createAndEmitBulkNotifications } = require('../utils/notificationHelper');

exports.getAll = async (req, res) => {
    try {
        const tasks = await Task.findAll({ order: [['created_at', 'DESC']] });
        // Enrich with assignee names
        const enriched = await Promise.all(tasks.map(async (t) => {
            let assigneeName = null;
            let project_name = null;
            if (t.assigned_to) {
                const emp = await Employee.findByPk(t.assigned_to);
                if (emp) {
                    const user = await User.findByPk(emp.user_id, { attributes: ['first_name', 'last_name'] });
                    assigneeName = user ? `${user.first_name} ${user.last_name}` : null;
                }
            }
            if (t.project_id) {
                const project = await Project.findByPk(t.project_id, { attributes: ['project_name'] });
                project_name = project ? project.project_name : null;
            }
            return { ...t.toJSON(), assignee_name: assigneeName, project_name };
        }));
        res.json({ success: true, tasks: enriched });
    } catch (error) {
        console.error('Get Tasks Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getById = async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        res.json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    try {
        const count = await Task.count();
        const task = await Task.create({
            ...req.body,
            task_uid: `TSK-${String(count + 1).padStart(3, '0')}`,
        });
        res.status(201).json({ success: true, task });
    } catch (error) {
        console.error('Create Task Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.update = async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        await task.update(req.body);
        res.json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.remove = async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        await task.destroy();
        res.json({ success: true, message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMyTasks = async (req, res) => {
    try {
        const emp = await Employee.findOne({ where: { user_id: req.user.id } });
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        const tasks = await Task.findAll({
            where: { assigned_to: emp.id },
            order: [['created_at', 'DESC']],
        });

        // Enrich with project names
        const enriched = await Promise.all(tasks.map(async (t) => {
            let project_name = null;
            if (t.project_id) {
                const project = await Project.findByPk(t.project_id, { attributes: ['project_name'] });
                project_name = project ? project.project_name : null;
            }
            return { ...t.toJSON(), project_name };
        }));

        res.json({ success: true, tasks: enriched });
    } catch (error) {
        console.error('Get My Tasks Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        await task.update({ status: req.body.status });

        // Auto-notify admins when a task is completed
        if (req.body.status === 'completed') {
            try {
                let employeeName = 'An employee';
                if (task.assigned_to) {
                    const emp = await Employee.findByPk(task.assigned_to);
                    if (emp) {
                        const empUser = await User.findByPk(emp.user_id, { attributes: ['first_name', 'last_name'] });
                        if (empUser) employeeName = `${empUser.first_name} ${empUser.last_name}`;
                    }
                }

                const admins = await User.findAll({
                    where: { role: 'admin', is_active: true },
                    attributes: ['id'],
                });
                const adminIds = admins.map(a => a.id);

                if (adminIds.length > 0) {
                    await createAndEmitBulkNotifications(req, {
                        type: 'task_completed',
                        title: 'Task Completed',
                        message: `${employeeName} completed task "${task.title}"`,
                        senderId: req.user.id,
                        recipientIds: adminIds,
                        referenceType: 'task',
                        referenceId: task.id,
                    });
                }
            } catch (notifError) {
                console.error('Task completion notification error:', notifError);
            }
        }

        res.json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Bulk assign task to multiple employees
exports.assignBulk = async (req, res) => {
    try {
        const { employee_ids, project_id, title, description, priority } = req.body;
        if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'employee_ids is required' });
        }
        if (!project_id || !title) {
            return res.status(400).json({ success: false, message: 'project_id and title are required' });
        }

        const startCount = await Task.count();
        const tasks = [];

        for (let i = 0; i < employee_ids.length; i++) {
            const uid = `TSK-${String(startCount + i + 1).padStart(3, '0')}`;
            const task = await Task.create({
                task_uid: uid,
                project_id,
                title,
                description: description || null,
                priority: priority || 'medium',
                status: 'todo',
                assigned_to: employee_ids[i],
            });
            tasks.push(task);
        }

        res.status(201).json({ success: true, tasks });
    } catch (error) {
        console.error('Assign Bulk Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all tasks assigned to a specific employee
exports.getByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const tasks = await Task.findAll({
            where: { assigned_to: employeeId },
            order: [['created_at', 'DESC']],
        });

        const enriched = await Promise.all(tasks.map(async (t) => {
            let assigneeName = null;
            let project_name = null;
            if (t.assigned_to) {
                const emp = await Employee.findByPk(t.assigned_to);
                if (emp) {
                    const user = await User.findByPk(emp.user_id, { attributes: ['first_name', 'last_name'] });
                    assigneeName = user ? `${user.first_name} ${user.last_name}` : null;
                }
            }
            if (t.project_id) {
                const project = await Project.findByPk(t.project_id, { attributes: ['project_name'] });
                project_name = project ? project.project_name : null;
            }
            return { ...t.toJSON(), assignee_name: assigneeName, project_name };
        }));

        res.json({ success: true, tasks: enriched });
    } catch (error) {
        console.error('Get Tasks By Employee Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get projects common to all given employees
exports.getCommonProjects = async (req, res) => {
    try {
        const idsParam = req.query.employee_ids;
        if (!idsParam) return res.json({ success: true, projects: [] });

        const employeeIds = idsParam.split(',').map(Number).filter(Boolean);
        if (employeeIds.length === 0) return res.json({ success: true, projects: [] });

        // Find project_ids that appear for ALL given employees
        const [rows] = await sequelize.query(
            `SELECT project_id FROM employee_projects 
             WHERE employee_id IN (:employeeIds) 
             GROUP BY project_id 
             HAVING COUNT(DISTINCT employee_id) = :total`,
            { replacements: { employeeIds, total: employeeIds.length } }
        );

        if (rows.length === 0) return res.json({ success: true, projects: [] });

        const projectIds = rows.map(r => r.project_id);
        const projects = await Project.findAll({ where: { id: { [Op.in]: projectIds } } });
        res.json({ success: true, projects });
    } catch (error) {
        console.error('Get Common Projects Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

