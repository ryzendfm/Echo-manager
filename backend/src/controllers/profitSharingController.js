const { ProfitSharingSetting, AdminProfitShare, User, Transaction } = require('../models/associations');

const requireAdmin = (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return false;
    }
    return true;
};

// GET /profit-sharing — get settings, admins, and calculated breakdown
exports.getOverview = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        // Get or create default settings
        let settings = await ProfitSharingSetting.findOne();
        if (!settings) {
            settings = await ProfitSharingSetting.create({
                company_share_percent: 50,
                admins_share_percent: 50,
            });
        }

        // Get admin shares
        const adminShares = await AdminProfitShare.findAll({
            where: { is_active: true },
            include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'email'] }],
        });

        // Calculate total profit
        const transactions = await Transaction.findAll();
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
        const totalProfit = totalIncome - totalExpense;

        const companyShare = totalProfit * (parseFloat(settings.company_share_percent) / 100);
        const adminsPool = totalProfit * (parseFloat(settings.admins_share_percent) / 100);

        const adminBreakdown = adminShares.map(a => ({
            id: a.id,
            user_id: a.user_id,
            name: a.User ? `${a.User.first_name} ${a.User.last_name}` : 'Unknown',
            email: a.User?.email || '',
            share_percent: parseFloat(a.share_percent),
            share_amount: adminsPool * (parseFloat(a.share_percent) / 100),
        }));

        res.json({
            success: true,
            settings: {
                company_share_percent: parseFloat(settings.company_share_percent),
                admins_share_percent: parseFloat(settings.admins_share_percent),
            },
            totalProfit,
            totalIncome,
            totalExpense,
            companyShare,
            adminsPool,
            adminBreakdown,
        });
    } catch (error) {
        console.error('Get Profit Sharing Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /profit-sharing/settings
exports.updateSettings = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { company_share_percent } = req.body;
        const companyPct = parseFloat(company_share_percent);
        if (isNaN(companyPct) || companyPct < 0 || companyPct > 100) {
            return res.status(400).json({ success: false, message: 'Invalid percentage' });
        }

        let settings = await ProfitSharingSetting.findOne();
        if (!settings) {
            settings = await ProfitSharingSetting.create({
                company_share_percent: companyPct,
                admins_share_percent: 100 - companyPct,
            });
        } else {
            await settings.update({
                company_share_percent: companyPct,
                admins_share_percent: 100 - companyPct,
            });
        }

        res.json({ success: true, settings });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /profit-sharing/admins
exports.getAdmins = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const admins = await AdminProfitShare.findAll({
            where: { is_active: true },
            include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'email'] }],
        });
        res.json({ success: true, admins });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /profit-sharing/admins — add admin to pool
exports.addAdmin = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { user_id, share_percent } = req.body;

        // Check if already exists
        const existing = await AdminProfitShare.findOne({ where: { user_id, is_active: true } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Admin already in profit sharing pool' });
        }

        const admin = await AdminProfitShare.create({
            user_id,
            share_percent: share_percent || 0,
        });

        res.status(201).json({ success: true, admin });
    } catch (error) {
        console.error('Add Admin Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /profit-sharing/admins/:id
exports.updateAdmin = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const admin = await AdminProfitShare.findByPk(req.params.id);
        if (!admin) return res.status(404).json({ success: false, message: 'Not found' });
        await admin.update({ share_percent: req.body.share_percent });
        res.json({ success: true, admin });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /profit-sharing/admins/bulk — update all admin shares at once
exports.updateAdminsBulk = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { admins } = req.body; // [{ id, share_percent }]
        for (const a of admins) {
            await AdminProfitShare.update({ share_percent: a.share_percent }, { where: { id: a.id } });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /profit-sharing/admins/:id
exports.removeAdmin = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const admin = await AdminProfitShare.findByPk(req.params.id);
        if (!admin) return res.status(404).json({ success: false, message: 'Not found' });
        await admin.update({ is_active: false });
        res.json({ success: true, message: 'Admin removed from profit sharing' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
