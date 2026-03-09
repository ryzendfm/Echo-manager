const Employee = require('../models/Employee');
const User = require('../models/User');
const Project = require('../models/Project');
const EmployeeProject = require('../models/EmployeeProject');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const fs = require('fs');
const path = require('path');

// Helper to move file from temp to final
const moveFile = (tempPath, finalDir) => {
    if (!tempPath || !tempPath.includes('temp')) return tempPath;

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
    return tempPath;
};

const validateEmployeeUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) return { ok: false, message: 'User not found' };
    if (!['employee', 'intern'].includes(user.role)) {
        return { ok: false, message: 'Only users with role employee/intern can be linked as employees' };
    }
    return { ok: true, user };
};

exports.getAll = async (req, res) => {
    try {
        const employees = await Employee.findAll({ order: [['created_at', 'DESC']] });
        // Enrich with user data
        const enriched = (await Promise.all(employees.map(async (emp) => {
            const user = await User.findByPk(emp.user_id, { attributes: ['first_name', 'last_name', 'email', 'avatar', 'role'] });
            if (user && !['employee', 'intern'].includes(user.role)) return null;
            return { ...emp.toJSON(), user: user ? user.toJSON() : null };
        }))).filter(Boolean);
        res.json({ success: true, employees: enriched });
    } catch (error) {
        console.error('Get Employees Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getById = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
        const user = await User.findByPk(employee.user_id, { attributes: { exclude: ['password'] } });
        if (user && !['employee', 'intern'].includes(user.role)) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.json({ success: true, employee: { ...employee.toJSON(), user: user ? user.toJSON() : null } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Backward compatibility: allow linking an existing user_id (legacy flow)
        if (req.body.user_id) {
            const validation = await validateEmployeeUser(req.body.user_id);
            if (!validation.ok) {
                await t.rollback();
                return res.status(400).json({ success: false, message: validation.message });
            }

            const existing = await Employee.findOne({ where: { user_id: req.body.user_id }, transaction: t });
            if (existing) {
                await t.rollback();
                return res.status(400).json({ success: false, message: 'This user is already linked as an employee' });
            }

            const count = await Employee.count({ transaction: t });
            const employee = await Employee.create({
                ...req.body,
                employee_uid: `EMP-${String(count + 1).padStart(3, '0')}`,
            }, { transaction: t });

            await t.commit();
            return res.status(201).json({ success: true, employee });
        }

        // New flow: create user + employee together
        const { user, employee } = req.body || {};
        if (!user?.email || !user?.password || !user?.confirm_password) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Email, password, and confirm password are required' });
        }
        if (!user.first_name || !user.last_name) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'First name and last name are required' });
        }
        if (user.password.length < 6) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }
        if (user.password !== user.confirm_password) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }
        if (!employee?.designation) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Designation is required' });
        }

        const existingUser = await User.findOne({ where: { email: user.email }, transaction: t });
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const userCount = await User.count({ transaction: t });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);

        // Prepare file paths
        const safeName = `${user.first_name}_${user.last_name}`.replace(/[^a-zA-Z0-9_]/g, '_');

        let avatarPath = null;
        if (user.avatar) {
            const avatarDir = path.join('uploads', 'Employees', safeName, 'profile picture');
            avatarPath = moveFile(user.avatar, avatarDir);
        }

        let documentsPath = null;
        if (employee.documents) {
            const docsDir = path.join('uploads', 'Employees', safeName, 'documents');
            documentsPath = moveFile(employee.documents, docsDir);
        }

        const userRole = employee?.employee_type === 'intern' ? 'intern' : 'employee';

        const createdUser = await User.create({
            user_uid: `USR-${String(userCount + 1).padStart(3, '0')}`,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone || null,
            role: userRole,
            password: hashedPassword,
            avatar: avatarPath,
            is_active: true,
        }, { transaction: t });

        const existingEmp = await Employee.findOne({ where: { user_id: createdUser.id }, transaction: t });
        if (existingEmp) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'This user is already linked as an employee' });
        }

        const empCount = await Employee.count({ transaction: t });
        const createdEmployee = await Employee.create({
            user_id: createdUser.id,
            designation: employee.designation,
            department: employee.department || 'engineering',
            employee_type: employee.employee_type || 'full-time',
            date_of_joining: employee.date_of_joining,
            is_active: employee.is_active ?? true,
            employee_uid: `EMP-${String(empCount + 1).padStart(3, '0')}`,
            documents: documentsPath,
        }, { transaction: t });

        await t.commit();
        return res.status(201).json({ success: true, employee: createdEmployee });
    } catch (error) {
        await t.rollback();
        console.error('Create Employee Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

exports.update = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        if (req.body.user_id && req.body.user_id !== employee.user_id) {
            const validation = await validateEmployeeUser(req.body.user_id);
            if (!validation.ok) {
                return res.status(400).json({ success: false, message: validation.message });
            }

            const existing = await Employee.findOne({ where: { user_id: req.body.user_id } });
            if (existing) {
                return res.status(400).json({ success: false, message: 'This user is already linked as an employee' });
            }
        }

        // Update User details if provided
        // We need to fetch User to get name for folder structure anyway
        const user = await User.findByPk(employee.user_id);
        if (user) {
            const safeName = `${user.first_name}_${user.last_name}`.replace(/[^a-zA-Z0-9_]/g, '_');

            // Handle Avatar Update
            if (req.body.user && req.body.user.avatar && req.body.user.avatar.includes('temp')) {
                // Delete old avatar
                if (user.avatar && fs.existsSync(user.avatar)) {
                    try { fs.unlinkSync(user.avatar); } catch (e) { console.error('Error deleting old avatar:', e); }
                }
                const avatarDir = path.join('uploads', 'Employees', safeName, 'profile picture');
                req.body.user.avatar = moveFile(req.body.user.avatar, avatarDir);
                await user.update({ avatar: req.body.user.avatar });
            }

            // Update other user fields if needed (e.g. name change might affect folder? For now keep simple)
        }

        // Handle Documents Update
        let updateData = { ...req.body };
        if (updateData.documents && updateData.documents.includes('temp')) {
            const user = await User.findByPk(employee.user_id);
            const safeName = user ? `${user.first_name}_${user.last_name}`.replace(/[^a-zA-Z0-9_]/g, '_') : 'Unknown_Employee';

            // Delete old docs
            if (employee.documents && fs.existsSync(employee.documents)) {
                try { fs.unlinkSync(employee.documents); } catch (e) { console.error('Error deleting old doc:', e); }
            }

            const docsDir = path.join('uploads', 'Employees', safeName, 'documents');
            updateData.documents = moveFile(updateData.documents, docsDir);
        }

        await employee.update(updateData);
        res.json({ success: true, employee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get projects assigned to an employee
exports.getProjects = async (req, res) => {
    try {
        const assignments = await EmployeeProject.findAll({ where: { employee_id: req.params.id } });
        const projectIds = assignments.map(a => a.project_id);
        if (projectIds.length === 0) return res.json({ success: true, projects: [] });
        const projects = await Project.findAll({ where: { id: projectIds } });
        res.json({ success: true, projects });
    } catch (error) {
        console.error('Get Employee Projects Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Assign projects to an employee (replaces existing assignments)
exports.assignProjects = async (req, res) => {
    try {
        const { project_ids } = req.body;
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        // Remove old assignments
        await EmployeeProject.destroy({ where: { employee_id: req.params.id } });

        // Create new assignments
        if (project_ids && project_ids.length > 0) {
            const records = project_ids.map(pid => ({ employee_id: req.params.id, project_id: pid }));
            await EmployeeProject.bulkCreate(records);
        }

        const assignments = await EmployeeProject.findAll({ where: { employee_id: req.params.id } });
        const updatedIds = assignments.map(a => a.project_id);
        const projects = updatedIds.length > 0 ? await Project.findAll({ where: { id: updatedIds } }) : [];
        res.json({ success: true, projects });
    } catch (error) {
        console.error('Assign Projects Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get projects for the logged-in employee
exports.getMyProjects = async (req, res) => {
    try {
        const emp = await Employee.findOne({ where: { user_id: req.user.id } });
        if (!emp) return res.status(404).json({ success: false, message: 'Employee profile not found' });

        const assignments = await EmployeeProject.findAll({ where: { employee_id: emp.id } });
        const projectIds = assignments.map(a => a.project_id);
        if (projectIds.length === 0) return res.json({ success: true, projects: [] });

        const projects = await Project.findAll({ where: { id: projectIds } });
        res.json({ success: true, projects });
    } catch (error) {
        console.error('Get My Projects Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

