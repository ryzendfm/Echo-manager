const Project = require('../models/Project');
const Client = require('../models/Client');
const Employee = require('../models/Employee');
const EmployeeProject = require('../models/EmployeeProject');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Helper to move file from temp to final
const moveFile = (tempPath, finalDir) => {
    if (!tempPath || !tempPath.includes('temp')) return tempPath; // Already in final or invalid

    const finalName = path.basename(tempPath);
    const finalPath = path.join(finalDir, finalName);

    // Ensure final directory exists
    if (!fs.existsSync(finalDir)) {
        fs.mkdirSync(finalDir, { recursive: true });
    }

    // Check if temp file exists
    const absoluteTempPath = path.resolve(tempPath);
    if (fs.existsSync(absoluteTempPath)) {
        fs.renameSync(absoluteTempPath, finalPath);
        return finalPath.replace(/\\/g, '/');
    }
    return tempPath; // Return original if move failed (or just log it)
};

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

const getEmployeeForUser = async (userId) => {
    return Employee.findOne({ where: { user_id: userId } });
};

const canAccessProject = async (req, project) => {
    const role = req.user && req.user.role;
    if (role === 'admin') return true;

    if (role === 'client') {
        const client = await getClientForUser(req.user.id);
        return !!client && project.client_id === client.id;
    }

    if (role === 'employee' || role === 'intern') {
        const emp = await getEmployeeForUser(req.user.id);
        if (!emp) return false;
        const assignment = await EmployeeProject.findOne({
            where: { employee_id: emp.id, project_id: project.id },
        });
        return !!assignment;
    }

    return false;
};

// Get all teams (projects with their assigned employees)
exports.getAllTeams = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const EmployeeProject = require('../models/EmployeeProject');
        const Employee = require('../models/Employee');
        const User = require('../models/User');

        const projects = await Project.findAll({ order: [['created_at', 'DESC']] });

        const teams = await Promise.all(projects.map(async (project) => {
            const assignments = await EmployeeProject.findAll({ where: { project_id: project.id } });
            const employeeIds = assignments.map(a => a.employee_id);

            let members = [];
            if (employeeIds.length > 0) {
                const employees = await Employee.findAll({ where: { id: employeeIds } });
                members = await Promise.all(employees.map(async (emp) => {
                    const user = await User.findByPk(emp.user_id, {
                        attributes: ['first_name', 'last_name', 'email', 'avatar']
                    });
                    return { ...emp.toJSON(), user: user ? user.toJSON() : null };
                }));
            }

            return {
                project: project.toJSON(),
                teamName: `${project.project_name} Team`,
                members,
                memberCount: members.length,
            };
        }));

        res.json({ success: true, teams });
    } catch (error) {
        console.error('Get All Teams Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAll = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const projects = await Project.findAll({
            order: [['created_at', 'DESC']],
            include: [{ model: Client, attributes: ['company_name'] }]
        });
        res.json({ success: true, projects });
    } catch (error) {
        console.error('Get Projects Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMyProjects = async (req, res) => {
    try {
        if (!requireRole(req, res, ['client'])) return;
        const client = await getClientForUser(req.user.id);
        if (!client) return res.status(404).json({ success: false, message: 'Client profile not found' });

        const projects = await Project.findAll({
            where: { client_id: client.id },
            order: [['created_at', 'DESC']],
        });
        res.json({ success: true, projects });
    } catch (error) {
        console.error('Get My Projects Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getById = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id, {
            include: [{ model: Client, attributes: ['company_name'] }],
        });
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        const allowed = await canAccessProject(req, project);
        if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });
        res.json({ success: true, project });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const { project_name, client_id, status, priority, budget_estimated, total_budget, deadline, description, tech_stack, file_attachments } = req.body;

        if (!project_name || !client_id) {
            return res.status(400).json({ success: false, message: 'Project name and Client ID are required' });
        }

        // Generate new Project UID by finding the maximum existing numeric ID
        const allProjects = await Project.findAll({ attributes: ['project_uid'] });
        let maxId = 0;
        allProjects.forEach(p => {
            if (p.project_uid && p.project_uid.startsWith('PRJ-')) {
                const parts = p.project_uid.split('-');
                if (parts.length === 2) {
                    const num = parseInt(parts[1], 10);
                    if (!isNaN(num) && num > maxId) {
                        maxId = num;
                    }
                }
            }
        });
        const nextId = maxId + 1;

        let parsedTechStack = tech_stack;
        if (typeof tech_stack === 'string') {
            try {
                parsedTechStack = JSON.parse(tech_stack);
            } catch (e) {
                // Handle comma-separated strings or just plain strings
                parsedTechStack = tech_stack.includes(',')
                    ? tech_stack.split(',').map(s => s.trim())
                    : [tech_stack];
            }
        }

        // Fetch Client to get Company Name for folder structure
        const client = await Client.findByPk(client_id);
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        // Handle File Move from Temp with Hierarchy
        let finalFilePath = '';
        if (file_attachments) {
            // Sanitize names for folder paths
            const safeClientName = client.company_name.replace(/[^a-zA-Z0-9]/g, '_');
            const safeProjectName = project_name.replace(/[^a-zA-Z0-9]/g, '_');
            const targetDir = path.join('uploads', 'Clients', safeClientName, safeProjectName);

            finalFilePath = moveFile(file_attachments, targetDir);
        }

        const project = await Project.create({
            project_name,
            client_id: parseInt(client_id),
            status: status || 'planning',
            priority: priority || 'medium',
            budget_estimated: budget_estimated || 0,
            total_budget: total_budget || 0,
            deadline: deadline || null,
            project_uid: `PRJ-${String(nextId).padStart(3, '0')}`,
            description: description || '',
            tech_stack: parsedTechStack || [],
            file_attachments: finalFilePath,
        });
        res.status(201).json({ success: true, project });
    } catch (error) {
        console.error('Create Project Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

exports.update = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const updateData = { ...req.body };

        // Parse tech_stack if it comes as a string (from FormData)
        if (typeof updateData.tech_stack === 'string') {
            try {
                updateData.tech_stack = JSON.parse(updateData.tech_stack);
            } catch (e) {
                updateData.tech_stack = updateData.tech_stack.includes(',')
                    ? updateData.tech_stack.split(',').map(s => s.trim()).filter(Boolean)
                    : [updateData.tech_stack];
            }
        }

        // Handle File Update (Move from Temp)
        if (updateData.file_attachments && updateData.file_attachments.includes('temp')) {
            // Delete old file if exists
            if (project.file_attachments && fs.existsSync(project.file_attachments)) {
                try {
                    fs.unlinkSync(project.file_attachments);
                } catch (e) {
                    console.error('Error deleting old file:', e);
                }
            }

            // Fetch Client for folder structure (if not already fetched or if needed)
            const client = await Client.findByPk(project.client_id);
            const safeClientName = client ? client.company_name.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown_Client';
            // Use updated project name if changed, else existing
            const pName = updateData.project_name || project.project_name;
            const safeProjectName = pName.replace(/[^a-zA-Z0-9]/g, '_');

            const targetDir = path.join('uploads', 'Clients', safeClientName, safeProjectName);

            // Move new file
            updateData.file_attachments = moveFile(updateData.file_attachments, targetDir);
        } else if (updateData.file_attachments === null || updateData.file_attachments === '') {
            // If file_attachments is explicitly set to null or empty, delete the old file
            if (project.file_attachments && fs.existsSync(project.file_attachments)) {
                try {
                    fs.unlinkSync(project.file_attachments);
                } catch (e) {
                    console.error('Error deleting old file:', e);
                }
            }
            updateData.file_attachments = null; // Ensure it's set to null in DB
        } else if (!updateData.file_attachments) {
            // If file_attachments is not provided in the update, keep the existing one
            delete updateData.file_attachments;
        }

        await project.update(updateData);
        res.json({ success: true, project });
    } catch (error) {
        console.error('Update Project Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

exports.remove = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        await project.destroy();
        res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get employees assigned to a project
exports.getEmployees = async (req, res) => {
    try {
        const EmployeeProject = require('../models/EmployeeProject');
        const Employee = require('../models/Employee');
        const User = require('../models/User');

        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        const allowed = await canAccessProject(req, project);
        if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

        const assignments = await EmployeeProject.findAll({ where: { project_id: req.params.id } });
        const employeeIds = assignments.map(a => a.employee_id);
        if (employeeIds.length === 0) return res.json({ success: true, employees: [] });

        const employees = await Employee.findAll({ where: { id: employeeIds } });
        const enriched = await Promise.all(employees.map(async (emp) => {
            const user = await User.findByPk(emp.user_id, { attributes: ['first_name', 'last_name', 'email', 'avatar'] });
            return { ...emp.toJSON(), user: user ? user.toJSON() : null };
        }));
        res.json({ success: true, employees: enriched });
    } catch (error) {
        console.error('Get Project Employees Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Assign employees to a project (replaces existing assignments)
exports.assignEmployees = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const EmployeeProject = require('../models/EmployeeProject');
        const Employee = require('../models/Employee');
        const User = require('../models/User');

        const { employee_ids } = req.body;
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        // Remove old assignments for this project
        await EmployeeProject.destroy({ where: { project_id: req.params.id } });

        // Create new assignments
        if (employee_ids && employee_ids.length > 0) {
            const records = employee_ids.map(eid => ({ employee_id: eid, project_id: req.params.id }));
            await EmployeeProject.bulkCreate(records);
        }

        const assignments = await EmployeeProject.findAll({ where: { project_id: req.params.id } });
        const updatedIds = assignments.map(a => a.employee_id);
        const employees = updatedIds.length > 0 ? await Employee.findAll({ where: { id: updatedIds } }) : [];
        const enriched = await Promise.all(employees.map(async (emp) => {
            const user = await User.findByPk(emp.user_id, { attributes: ['first_name', 'last_name', 'email', 'avatar'] });
            return { ...emp.toJSON(), user: user ? user.toJSON() : null };
        }));
        res.json({ success: true, employees: enriched });
    } catch (error) {
        console.error('Assign Employees Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
