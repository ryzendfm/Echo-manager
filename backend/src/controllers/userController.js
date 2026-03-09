const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']],
        });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    try {
        const { email, password, first_name, last_name, role, phone } = req.body;
        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const count = await User.count();

        const user = await User.create({
            user_uid: `USR-${String(count + 1).padStart(3, '0')}`,
            first_name, last_name, email, phone, role,
            password: hashedPassword,
        });

        const { password: _, ...userData } = user.toJSON();
        res.status(201).json({ success: true, user: userData });
    } catch (error) {
        console.error('Create User Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.update = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const { password, ...updateData } = req.body;

        // Check for duplicate email if email is being changed
        if (updateData.email && updateData.email !== user.email) {
            const existing = await User.findOne({ where: { email: updateData.email } });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Email is already in use by another user' });
            }
        }

        await user.update(updateData);
        const { password: _, ...userData } = user.toJSON();
        res.json({ success: true, user: userData });
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await user.update({ is_active: req.body.isActive });
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await user.update({ password: hashedPassword });

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.remove = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await user.destroy();
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
