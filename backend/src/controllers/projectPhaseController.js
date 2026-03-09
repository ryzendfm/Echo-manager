const { Project, ProjectPhase, PhasePayment, Transaction, Client } = require('../models/associations');
const sequelize = require('../config/db');
const path = require('path');
const fs = require('fs');

const requireAdmin = (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return false;
    }
    return true;
};

// GET /project-phases/project/:projectId
exports.getPhases = async (req, res) => {
    try {
        const phases = await ProjectPhase.findAll({
            where: { project_id: req.params.projectId },
            include: [{ model: PhasePayment, as: 'payments' }],
            order: [['created_at', 'ASC']],
        });
        res.json({ success: true, phases });
    } catch (error) {
        console.error('Get Phases Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /project-phases/project/:projectId — bulk create/update phases
exports.savePhases = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { phases } = req.body;
        const projectId = req.params.projectId;

        const project = await Project.findByPk(projectId);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        // Get existing phase IDs
        const existingPhases = await ProjectPhase.findAll({ where: { project_id: projectId } });
        const existingIds = existingPhases.map(p => p.id);
        const incomingIds = phases.filter(p => p.id).map(p => p.id);

        // Delete phases that are no longer in the list
        const toDelete = existingIds.filter(id => !incomingIds.includes(id));
        if (toDelete.length > 0) {
            await ProjectPhase.destroy({ where: { id: toDelete } });
        }

        // Create or update phases
        const savedPhases = [];
        for (const phase of phases) {
            if (phase.id && existingIds.includes(phase.id)) {
                const existing = await ProjectPhase.findByPk(phase.id);
                await existing.update({
                    phase_name: phase.phase_name,
                    phase_description: phase.phase_description || null,
                    phase_amount: phase.phase_amount || 0,
                });
                savedPhases.push(existing);
            } else {
                const created = await ProjectPhase.create({
                    project_id: projectId,
                    phase_name: phase.phase_name,
                    phase_description: phase.phase_description || null,
                    phase_amount: phase.phase_amount || 0,
                });
                savedPhases.push(created);
            }
        }

        res.json({ success: true, phases: savedPhases });
    } catch (error) {
        console.error('Save Phases Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /project-phases/:phaseId/payments — record a payment (with optional receipt upload)
exports.recordPayment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        if (!requireAdmin(req, res)) return;
        const { amount, payment_date, payment_method, notes, project_id } = req.body;
        const phase = await ProjectPhase.findByPk(req.params.phaseId);
        if (!phase) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Phase not found' });
        }

        const project = await Project.findByPk(phase.project_id);

        // Check sequential locking — get all phases for this project, ordered
        const allPhases = await ProjectPhase.findAll({
            where: { project_id: phase.project_id },
            order: [['created_at', 'ASC']],
        });
        const phaseIndex = allPhases.findIndex(p => p.id === phase.id);
        if (phaseIndex > 0 && allPhases[phaseIndex - 1].status !== 'paid') {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Previous phase must be completed first' });
        }

        // Handle receipt file upload
        let receiptPath = null;
        if (req.file) {
            const safeProjectName = project.project_name.replace(/[^a-zA-Z0-9]/g, '_');
            const targetDir = path.join('uploads', 'projec', safeProjectName);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            const safePhaseName = phase.phase_name.replace(/[^a-zA-Z0-9]/g, '_');
            const ext = path.extname(req.file.originalname);
            const fileName = `${safePhaseName}_receipt_${Date.now()}${ext}`;
            const finalPath = path.join(targetDir, fileName);
            fs.renameSync(req.file.path, finalPath);
            receiptPath = finalPath.replace(/\\/g, '/');
        }

        // Create finance transaction automatically
        const transaction = await Transaction.create({
            type: 'income',
            category: 'project_payment',
            amount: amount,
            date: payment_date || new Date().toISOString().split('T')[0],
            description: `${project.project_name} — ${phase.phase_name} Payment`,
            project_id: project.id,
            client_id: project.client_id,
            payment_method: payment_method || null,
            reference_number: null,
        }, { transaction: t });

        // Create phase payment record
        const payment = await PhasePayment.create({
            phase_id: phase.id,
            amount: amount,
            payment_date: payment_date || new Date().toISOString().split('T')[0],
            payment_method: payment_method || null,
            notes: notes || null,
            receipt_path: receiptPath,
            finance_transaction_id: transaction.id,
        }, { transaction: t });

        // Update phase amount_paid and status
        const newPaid = parseFloat(phase.amount_paid) + parseFloat(amount);
        const phaseAmount = parseFloat(phase.phase_amount);
        let status = 'unpaid';
        if (newPaid >= phaseAmount) status = 'paid';
        else if (newPaid > 0) status = 'partial';

        await phase.update({ amount_paid: newPaid, status }, { transaction: t });

        await t.commit();
        res.status(201).json({ success: true, payment, transaction, phase });
    } catch (error) {
        await t.rollback();
        console.error('Record Payment Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /project-phases/:phaseId — update phase details (name, amount, description, receipt)
exports.updatePhase = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const phase = await ProjectPhase.findByPk(req.params.phaseId, {
            include: [{ model: Project, as: 'project' }]
        });
        if (!phase) return res.status(404).json({ success: false, message: 'Phase not found' });

        const { phase_name, phase_amount, phase_description } = req.body;

        // Handle receipt file upload if provided
        let receiptPath = phase.receipt_path;
        if (req.file) {
            // Usually the project is available. If using the alias 'project' check that it's loaded properly.
            // If project wasn't loaded due to missing alias, fallback to finding it:
            const project = phase.project || await Project.findByPk(phase.project_id);
            const safeProjectName = project ? project.project_name.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown_Project';
            const targetDir = path.join('uploads', 'projec', safeProjectName);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            const safePhaseName = (phase_name || phase.phase_name).replace(/[^a-zA-Z0-9]/g, '_');
            const ext = path.extname(req.file.originalname);
            const fileName = `${safePhaseName}_phase_receipt_${Date.now()}${ext}`;
            const finalPath = path.join(targetDir, fileName);
            fs.renameSync(req.file.path, finalPath);
            receiptPath = finalPath.replace(/\\/g, '/');
        }

        await phase.update({
            ...(phase_name !== undefined && { phase_name }),
            ...(phase_amount !== undefined && { phase_amount }),
            ...(phase_description !== undefined && { phase_description }),
            ...(receiptPath !== undefined && { receipt_path: receiptPath }),
        });

        // Recalculate status based on new amount
        if (phase_amount !== undefined) {
            const amt = parseFloat(phase_amount);
            const paid = parseFloat(phase.amount_paid);
            let status = 'unpaid';
            if (paid > 0 && paid >= amt) status = 'paid';
            else if (paid > 0) status = 'partial';
            await phase.update({ status });
        }

        res.json({ success: true, phase });
    } catch (error) {
        console.error('Update Phase Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /project-phases/:phaseId
exports.deletePhase = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const phase = await ProjectPhase.findByPk(req.params.phaseId, {
            include: [{ model: PhasePayment, as: 'payments' }],
        });
        if (!phase) return res.status(404).json({ success: false, message: 'Phase not found' });

        if (phase.payments && phase.payments.length > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete a phase that has payments recorded' });
        }

        await phase.destroy();
        res.json({ success: true, message: 'Phase deleted' });
    } catch (error) {
        console.error('Delete Phase Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /project-phases/:phaseId/payments/:paymentId — edit a specific payment
exports.updatePayment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        if (!requireAdmin(req, res)) return;
        const { amount, payment_date, payment_method, notes } = req.body;
        const payment = await PhasePayment.findByPk(req.params.paymentId);
        if (!payment) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        const phase = await ProjectPhase.findByPk(payment.phase_id);
        if (!phase) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Phase not found' });
        }

        const oldAmount = parseFloat(payment.amount);
        const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount;

        // Handle receipt file upload
        let receiptPath = payment.receipt_path;
        if (req.file) {
            const project = await Project.findByPk(phase.project_id);
            const safeProjectName = project ? project.project_name.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown_Project';
            const targetDir = path.join('uploads', 'projec', safeProjectName);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            const safePhaseName = phase.phase_name.replace(/[^a-zA-Z0-9]/g, '_');
            const ext = path.extname(req.file.originalname);
            const fileName = `${safePhaseName}_receipt_${Date.now()}${ext}`;
            const finalPath = path.join(targetDir, fileName);
            fs.renameSync(req.file.path, finalPath);
            receiptPath = finalPath.replace(/\\/g, '/');
        }

        // Update the payment record
        await payment.update({
            ...(amount !== undefined && { amount: newAmount }),
            ...(payment_date !== undefined && { payment_date }),
            ...(payment_method !== undefined && { payment_method }),
            ...(notes !== undefined && { notes }),
            receipt_path: receiptPath,
        }, { transaction: t });

        // Update the linked finance transaction if amount changed
        if (payment.finance_transaction_id && amount !== undefined && newAmount !== oldAmount) {
            await Transaction.update(
                { amount: newAmount },
                { where: { id: payment.finance_transaction_id }, transaction: t }
            );
        }

        // Recalculate phase amount_paid from all its payments
        const allPayments = await PhasePayment.findAll({ where: { phase_id: phase.id }, transaction: t });
        const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.id === payment.id ? newAmount : p.amount), 0);
        const phaseAmount = parseFloat(phase.phase_amount);
        let status = 'unpaid';
        if (totalPaid >= phaseAmount) status = 'paid';
        else if (totalPaid > 0) status = 'partial';

        await phase.update({ amount_paid: totalPaid, status }, { transaction: t });

        await t.commit();
        res.json({ success: true, payment, phase });
    } catch (error) {
        await t.rollback();
        console.error('Update Payment Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /project-phases/:phaseId/payments — reset phase by deleting all its payments
exports.resetPhasePayments = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        if (!requireAdmin(req, res)) return;
        const phase = await ProjectPhase.findByPk(req.params.phaseId, {
            include: [{ model: PhasePayment, as: 'payments' }],
        });
        if (!phase) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Phase not found' });
        }

        if (!phase.payments || phase.payments.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'No payments to reset' });
        }

        // Delete linked finance transactions and receipt files
        for (const payment of phase.payments) {
            if (payment.finance_transaction_id) {
                await Transaction.destroy({ where: { id: payment.finance_transaction_id }, transaction: t });
            }
            if (payment.receipt_path && fs.existsSync(payment.receipt_path)) {
                try { fs.unlinkSync(payment.receipt_path); } catch (e) { /* ignore */ }
            }
        }

        // Delete all payments for this phase
        await PhasePayment.destroy({ where: { phase_id: phase.id }, transaction: t });

        // Reset phase status
        await phase.update({ amount_paid: 0, status: 'unpaid' }, { transaction: t });

        await t.commit();
        res.json({ success: true, message: 'Phase payments reset successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Reset Phase Payments Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /project-phases/project/:projectId/financials
exports.getProjectFinancials = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const project = await Project.findByPk(projectId, {
            include: [
                { model: Client, attributes: ['company_name'] },
                { model: ProjectPhase, as: 'phases' },
            ],
        });
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const totalCollected = (project.phases || []).reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
        const totalBudget = parseFloat(project.total_budget || 0);

        const expenses = await Transaction.findAll({
            where: { project_id: projectId, type: 'expense' },
        });
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        res.json({
            success: true,
            financials: {
                project_id: project.id,
                project_name: project.project_name,
                client_name: project.Client?.company_name || '',
                total_budget: totalBudget,
                total_collected: totalCollected,
                total_expenses: totalExpenses,
                profit_loss: totalCollected - totalExpenses,
                status: project.status === 'completed' ? 'Completed' : totalExpenses > totalBudget ? 'Over Budget' : 'On Track',
            },
        });
    } catch (error) {
        console.error('Get Financials Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /project-phases/all-financials — all projects financial overview
exports.getAllFinancials = async (req, res) => {
    try {
        const projects = await Project.findAll({
            include: [
                { model: Client, attributes: ['company_name'] },
                { model: ProjectPhase, as: 'phases' },
            ],
            order: [['created_at', 'DESC']],
        });

        const allExpenses = await Transaction.findAll({ where: { type: 'expense' } });
        const expenseByProject = {};
        allExpenses.forEach(e => {
            if (e.project_id) {
                expenseByProject[e.project_id] = (expenseByProject[e.project_id] || 0) + parseFloat(e.amount || 0);
            }
        });

        const financials = projects.map(p => {
            const totalCollected = (p.phases || []).reduce((sum, ph) => sum + parseFloat(ph.amount_paid || 0), 0);
            const totalBudget = parseFloat(p.total_budget || 0);
            const totalExpenses = expenseByProject[p.id] || 0;
            return {
                project_id: p.id,
                project_name: p.project_name,
                client_name: p.Client?.company_name || '',
                total_budget: totalBudget,
                total_collected: totalCollected,
                total_expenses: totalExpenses,
                profit_loss: totalCollected - totalExpenses,
                status: p.status === 'completed' ? 'Completed' : totalExpenses > totalBudget && totalBudget > 0 ? 'Over Budget' : 'On Track',
            };
        });

        res.json({ success: true, financials });
    } catch (error) {
        console.error('Get All Financials Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
