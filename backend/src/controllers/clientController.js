const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const User = require('../models/User');
const sequelize = require('../config/db');

const requireRole = (req, res, roles) => {
    const role = req.user && req.user.role;
    if (!role || !roles.includes(role)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return false;
    }
    return true;
};

const buildClientPayload = (body) => {
    // Support both nested (company/contact) and flat payloads for compatibility
    if (body.company || body.contact) {
        const { company = {}, contact = {} } = body;
        const contactFirst = contact.first_name || contact.firstName || '';
        const contactLast = contact.last_name || contact.lastName || '';
        const contactName = `${contactFirst} ${contactLast}`.trim() || contact.name || '';

        return {
            company_name: company.company_name || company.name,
            industry: company.industry || 'other',
            address: company.address || null,
            website_url: company.website_url || null,
            notes: company.notes || null,
            contact_name: contactName,
            contact_email: contact.email || contact.contact_email || null,
            contact_phone: contact.phone || contact.contact_phone || null,
            alternate_number: contact.alternate_number || null,
        };
    }

    // Fallback for existing flat shape
    const contactName = body.contact_name || body.company_name;
    return {
        company_name: body.company_name,
        industry: body.industry || 'other',
        address: body.address || null,
        website_url: body.website_url || null,
        notes: body.notes || null,
        contact_name: contactName,
        contact_email: body.contact_email || body.email || null,
        contact_phone: body.contact_phone || body.phone || null,
        alternate_number: body.alternate_number || null,
    };
};

const buildPortalPayload = (body) => {
    if (body.portal) return body.portal;
    // Fallback: treat flat password fields as portal enabled
    if (body.password) {
        return {
            enabled: true,
            password: body.password,
            confirm_password: body.confirm_password || body.password,
        };
    }
    return { enabled: false };
};

const createClientUser = async ({ client, contact, portal, transaction }) => {
    if (!portal.enabled) return null;

    if (!portal.password || portal.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }
    if (portal.password !== portal.confirm_password) {
        throw new Error('Passwords do not match');
    }

    const existing = await User.findOne({
        where: { email: contact.email },
        transaction,
    });
    if (existing) {
        throw new Error('Email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(portal.password, salt);
    const count = await User.count({ transaction });

    const firstName = contact.first_name || contact.firstName || contact.name || client.company_name;
    const lastName = contact.last_name || contact.lastName || '';

    const user = await User.create({
        user_uid: `USR-${String(count + 1).padStart(3, '0')}`,
        first_name: firstName,
        last_name: lastName || 'Client',
        email: contact.email,
        role: 'client',
        client_id: client.id,
        password: hashedPassword,
        is_active: true,
    }, { transaction });

    return user;
};

exports.getAll = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const clients = await Client.findAll({
            order: [['created_at', 'DESC']],
            include: [{
                model: User,
                attributes: ['id', 'is_active'],
                required: false
            }]
        });
        res.json({ success: true, clients });
    } catch (error) {
        console.error('Get Clients Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getById = async (req, res) => {
    try {
        if (!requireRole(req, res, ['admin'])) return;
        const client = await Client.findByPk(req.params.id);
        if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
        res.json({ success: true, client });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        if (!requireRole(req, res, ['admin'])) {
            await t.rollback();
            return;
        }

        const companyPayload = buildClientPayload(req.body);
        const portal = buildPortalPayload(req.body);
        const contact = req.body.contact || {
            first_name: req.body.contact_first_name,
            last_name: req.body.contact_last_name,
            email: companyPayload.contact_email,
            phone: companyPayload.contact_phone,
        };

        if (!companyPayload.company_name) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Company name is required' });
        }

        const count = await Client.count({ transaction: t });
        const client = await Client.create({
            ...companyPayload,
            client_uid: `CLT-${String(count + 1).padStart(3, '0')}`,
        }, { transaction: t });

        const user = await createClientUser({ client, contact, portal, transaction: t });

        await t.commit();
        res.status(201).json({ success: true, client, user });
    } catch (error) {
        await t.rollback();
        console.error('Create Client Error:', error);
        const validationMessages = ['Email already exists', 'Password must be at least 6 characters', 'Passwords do not match'];
        const status = validationMessages.includes(error.message) ? 400 : 500;
        res.status(status).json({ success: false, message: error.message || 'Server error' });
    }
};

exports.update = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        if (!requireRole(req, res, ['admin'])) {
            await t.rollback();
            return;
        }

        const client = await Client.findByPk(req.params.id, { transaction: t });
        if (!client) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        const companyPayload = buildClientPayload(req.body);
        // Pass through is_active if explicitly provided (for activate/deactivate)
        if (typeof req.body.is_active === 'boolean') {
            companyPayload.is_active = req.body.is_active;
        }
        const portal = buildPortalPayload(req.body);
        const contact = req.body.contact || {
            first_name: req.body.contact_first_name,
            last_name: req.body.contact_last_name,
            email: companyPayload.contact_email,
            phone: companyPayload.contact_phone,
        };

        await client.update(companyPayload, { transaction: t });

        const existingUser = await User.findOne({
            where: { client_id: client.id, role: 'client' },
            transaction: t,
        });

        if (portal.enabled) {
            if (existingUser) {
                // Update basic details
                const updates = {
                    first_name: contact.first_name || contact.firstName || existingUser.first_name,
                    last_name: contact.last_name || contact.lastName || existingUser.last_name,
                    email: contact.email || existingUser.email,
                };

                if (portal.password) {
                    if (portal.password.length < 6) {
                        throw new Error('Password must be at least 6 characters');
                    }
                    if (portal.password !== portal.confirm_password) {
                        throw new Error('Passwords do not match');
                    }
                    const salt = await bcrypt.genSalt(10);
                    updates.password = await bcrypt.hash(portal.password, salt);
                }

                updates.is_active = true;
                await existingUser.update(updates, { transaction: t });
            } else {
                await createClientUser({ client, contact, portal, transaction: t });
            }
        } else if (existingUser) {
            // Disable portal access but keep history
            await existingUser.update({ is_active: false }, { transaction: t });
        }

        await t.commit();
        res.json({ success: true, client });
    } catch (error) {
        await t.rollback();
        console.error('Update Client Error:', error);
        const validationMessages = ['Email already exists', 'Password must be at least 6 characters', 'Passwords do not match'];
        const status = validationMessages.includes(error.message) ? 400 : 500;
        res.status(status).json({ success: false, message: error.message || 'Server error' });
    }
};
