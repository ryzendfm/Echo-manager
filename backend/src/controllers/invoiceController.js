const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const User = require('../models/User');

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

exports.getAll = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin', 'employee', 'manager'])) return; // Added employee/manager access if needed

        const { client_id, project_id } = req.query;
        const where = {};
        if (client_id) where.client_id = client_id;
        if (project_id) where.project_id = project_id;

        const invoices = await Invoice.findAll({
            where,
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, invoices });
    } catch (error) {
        console.error('Get Invoices Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMyInvoices = async (req, res) => {
    try {
        if (!requireRole(req, res, ['client'])) return;
        const client = await getClientForUser(req.user.id);
        if (!client) return res.status(404).json({ success: false, message: 'Client profile not found' });

        const invoices = await Invoice.findAll({
            where: { client_id: client.id },
            order: [['created_at', 'DESC']],
        });
        res.json({ success: true, invoices });
    } catch (error) {
        console.error('Get My Invoices Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getById = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        if (req.user?.role === 'client') {
            const client = await getClientForUser(req.user.id);
            if (!client || invoice.client_id !== client.id) {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
        } else if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        res.json({ success: true, invoice });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const count = await Invoice.count();
        const year = new Date().getFullYear();
        const invoice = await Invoice.create({
            ...req.body,
            invoice_uid: `INV-${year}-${String(count + 1).padStart(3, '0')}`,
        });
        res.status(201).json({ success: true, invoice });
    } catch (error) {
        console.error('Create Invoice Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.update = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        await invoice.update(req.body);
        res.json({ success: true, invoice });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.remove = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        await invoice.destroy();
        res.json({ success: true, message: 'Invoice deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
