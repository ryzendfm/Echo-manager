const Transaction = require('../models/Transaction');

exports.getAll = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({ order: [['date', 'DESC']] });
        res.json({ success: true, transactions });
    } catch (error) {
        console.error('Get Transactions Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    try {
        const transaction = await Transaction.create(req.body);
        res.status(201).json({ success: true, transaction });
    } catch (error) {
        console.error('Create Transaction Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.update = async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id);
        if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
        await transaction.update(req.body);
        res.json({ success: true, transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.remove = async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id);
        if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
        await transaction.destroy();
        res.json({ success: true, message: 'Transaction deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
