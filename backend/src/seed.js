const sequelize = require('./config/db');
const bcrypt = require('bcryptjs');

// Import all models
const User = require('./models/User');
const Employee = require('./models/Employee');
const Client = require('./models/Client');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Invoice = require('./models/Invoice');
const Transaction = require('./models/Transaction');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        // Sync all models — force: true will DROP existing tables
        await sequelize.sync({ force: true });
        console.log('Tables created.');

        const salt = await bcrypt.genSalt(10);

        // ===========================
        // 1. USERS
        // ===========================
        const users = await User.bulkCreate([
            { user_uid: 'USR-001', first_name: 'Admin', last_name: 'User', email: 'admin@echo.com', password: await bcrypt.hash('admin123', salt), role: 'admin', is_active: true },
            { user_uid: 'USR-002', first_name: 'Sooriyaa', last_name: 'Dev', email: 'sooriyaa@gmail.com', password: await bcrypt.hash('tns7142006', salt), role: 'admin', is_active: true },
            { user_uid: 'USR-003', first_name: 'Rahul', last_name: 'Sharma', email: 'rahul@echo.com', password: await bcrypt.hash('pass123', salt), role: 'employee', is_active: true },
            { user_uid: 'USR-004', first_name: 'Priya', last_name: 'Nair', email: 'priya@echo.com', password: await bcrypt.hash('pass123', salt), role: 'employee', is_active: true },
            { user_uid: 'USR-005', first_name: 'Arjun', last_name: 'Menon', email: 'arjun@echo.com', password: await bcrypt.hash('pass123', salt), role: 'employee', is_active: true },
            { user_uid: 'USR-006', first_name: 'Sneha', last_name: 'Reddy', email: 'sneha@echo.com', password: await bcrypt.hash('pass123', salt), role: 'employee', is_active: true },
            { user_uid: 'USR-007', first_name: 'Karthik', last_name: 'Iyer', email: 'karthik@echo.com', password: await bcrypt.hash('pass123', salt), role: 'intern', is_active: true },
            { user_uid: 'USR-008', first_name: 'Deepa', last_name: 'Krishnan', email: 'deepa@techcorp.com', password: await bcrypt.hash('pass123', salt), role: 'client', is_active: true },
            { user_uid: 'USR-009', first_name: 'Vikram', last_name: 'Singh', email: 'vikram@startup.in', password: await bcrypt.hash('pass123', salt), role: 'client', is_active: true },
            { user_uid: 'USR-010', first_name: 'Meera', last_name: 'Patel', email: 'meera@greenleaf.com', password: await bcrypt.hash('pass123', salt), role: 'client', is_active: true },
        ]);
        console.log(`Created ${users.length} users.`);

        // ===========================
        // 2. EMPLOYEES
        // ===========================
        const employees = await Employee.bulkCreate([
            { user_id: 3, employee_uid: 'EMP-001', designation: 'Senior Full Stack Developer', department: 'engineering', employee_type: 'full-time', date_of_joining: '2023-01-15', is_active: true },
            { user_id: 4, employee_uid: 'EMP-002', designation: 'UI/UX Designer', department: 'design', employee_type: 'full-time', date_of_joining: '2023-03-01', is_active: true },
            { user_id: 5, employee_uid: 'EMP-003', designation: 'Backend Developer', department: 'engineering', employee_type: 'full-time', date_of_joining: '2023-06-10', is_active: true },
            { user_id: 6, employee_uid: 'EMP-004', designation: 'Digital Marketer', department: 'marketing', employee_type: 'part-time', date_of_joining: '2024-01-20', is_active: true },
            { user_id: 7, employee_uid: 'EMP-005', designation: 'Frontend Intern', department: 'engineering', employee_type: 'intern', date_of_joining: '2025-09-01', is_active: true },
        ]);
        console.log(`Created ${employees.length} employees.`);

        // ===========================
        // 3. CLIENTS
        // ===========================
        const clients = await Client.bulkCreate([
            { user_id: 8, client_uid: 'CLT-001', company_name: 'TechCorp Solutions', industry: 'technology', contact_name: 'Deepa Krishnan', contact_email: 'deepa@techcorp.com', contact_phone: '+91 9876543210', is_active: true },
            { user_id: 9, client_uid: 'CLT-002', company_name: 'StartupHub India', industry: 'e_commerce', contact_name: 'Vikram Singh', contact_email: 'vikram@startup.in', contact_phone: '+91 9123456780', is_active: true },
            { user_id: 10, client_uid: 'CLT-003', company_name: 'GreenLeaf Organics', industry: 'healthcare', contact_name: 'Meera Patel', contact_email: 'meera@greenleaf.com', contact_phone: '+91 9988776655', is_active: true },
            { client_uid: 'CLT-004', company_name: 'EduBridge Academy', industry: 'education', contact_name: 'Anil Kumar', contact_email: 'anil@edubridge.in', contact_phone: '+91 8877665544', is_active: true },
            { client_uid: 'CLT-005', company_name: 'FinSecure Holdings', industry: 'finance', contact_name: 'Sanjay Gupta', contact_email: 'sanjay@finsecure.com', contact_phone: '+91 7766554433', is_active: false },
        ]);
        console.log(`Created ${clients.length} clients.`);

        // ===========================
        // 4. PROJECTS
        // ===========================
        const projects = await Project.bulkCreate([
            { project_uid: 'PRJ-001', project_name: 'TechCorp E-Commerce Platform', client_id: 1, status: 'in_progress', priority: 'high', deadline: '2026-04-30', budget_estimated: 450000 },
            { project_uid: 'PRJ-002', project_name: 'StartupHub Mobile App', client_id: 2, status: 'planning', priority: 'urgent', deadline: '2026-06-15', budget_estimated: 680000 },
            { project_uid: 'PRJ-003', project_name: 'GreenLeaf Brand Identity', client_id: 3, status: 'completed', priority: 'medium', deadline: '2025-12-01', budget_estimated: 120000 },
            { project_uid: 'PRJ-004', project_name: 'EduBridge LMS Portal', client_id: 4, status: 'in_progress', priority: 'high', deadline: '2026-08-01', budget_estimated: 520000 },
            { project_uid: 'PRJ-005', project_name: 'FinSecure Dashboard Redesign', client_id: 5, status: 'on_hold', priority: 'low', deadline: '2026-09-30', budget_estimated: 200000 },
            { project_uid: 'PRJ-006', project_name: 'TechCorp API Gateway', client_id: 1, status: 'in_progress', priority: 'medium', deadline: '2026-05-15', budget_estimated: 350000 },
            { project_uid: 'PRJ-007', project_name: 'StartupHub Analytics Dashboard', client_id: 2, status: 'planning', priority: 'medium', deadline: '2026-07-01', budget_estimated: 280000 },
        ]);
        console.log(`Created ${projects.length} projects.`);

        // ===========================
        // 5. TASKS  
        // ===========================
        const tasks = await Task.bulkCreate([
            { task_uid: 'TSK-001', title: 'Design Product Catalog UI', project_id: 1, assigned_to: 2, status: 'in_progress', priority: 'high', due_date: '2026-03-15' },
            { task_uid: 'TSK-002', title: 'Build REST API for Orders', project_id: 1, assigned_to: 1, status: 'todo', priority: 'high', due_date: '2026-03-20' },
            { task_uid: 'TSK-003', title: 'Setup Payment Gateway Integration', project_id: 1, assigned_to: 3, status: 'todo', priority: 'urgent', due_date: '2026-04-01' },
            { task_uid: 'TSK-004', title: 'Create Mobile App Wireframes', project_id: 2, assigned_to: 2, status: 'completed', priority: 'medium', due_date: '2026-02-10' },
            { task_uid: 'TSK-005', title: 'Develop Authentication Module', project_id: 2, assigned_to: 1, status: 'in_review', priority: 'high', due_date: '2026-03-01' },
            { task_uid: 'TSK-006', title: 'Logo Design & Style Guide', project_id: 3, assigned_to: 2, status: 'completed', priority: 'medium', due_date: '2025-11-15' },
            { task_uid: 'TSK-007', title: 'Build Course Dashboard', project_id: 4, assigned_to: 1, status: 'in_progress', priority: 'high', due_date: '2026-05-01' },
            { task_uid: 'TSK-008', title: 'Student Progress Tracker', project_id: 4, assigned_to: 5, status: 'todo', priority: 'medium', due_date: '2026-06-15' },
            { task_uid: 'TSK-009', title: 'SEO & Social Media Campaign', project_id: 3, assigned_to: 4, status: 'completed', priority: 'low', due_date: '2025-11-30' },
            { task_uid: 'TSK-010', title: 'Build API Rate Limiter', project_id: 6, assigned_to: 3, status: 'in_progress', priority: 'high', due_date: '2026-04-10' },
        ]);
        console.log(`Created ${tasks.length} tasks.`);

        // ===========================
        // 6. INVOICES
        // ===========================
        const invoices = await Invoice.bulkCreate([
            { invoice_uid: 'INV-2026-001', client_id: 1, project_id: 1, amount: 150000, status: 'paid', due_date: '2026-02-15' },
            { invoice_uid: 'INV-2026-002', client_id: 1, project_id: 1, amount: 150000, status: 'sent', due_date: '2026-03-15' },
            { invoice_uid: 'INV-2026-003', client_id: 2, project_id: 2, amount: 200000, status: 'draft', due_date: '2026-04-01' },
            { invoice_uid: 'INV-2025-004', client_id: 3, project_id: 3, amount: 120000, status: 'paid', due_date: '2025-12-01' },
            { invoice_uid: 'INV-2026-005', client_id: 4, project_id: 4, amount: 260000, status: 'partially_paid', due_date: '2026-05-01' },
            { invoice_uid: 'INV-2026-006', client_id: 1, project_id: 6, amount: 175000, status: 'overdue', due_date: '2026-01-31' },
            { invoice_uid: 'INV-2026-007', client_id: 2, project_id: 7, amount: 140000, status: 'draft', due_date: '2026-06-01' },
            { invoice_uid: 'INV-2026-008', client_id: 5, project_id: 5, amount: 100000, status: 'cancelled', due_date: '2026-03-30' },
        ]);
        console.log(`Created ${invoices.length} invoices.`);

        // ===========================
        // 7. TRANSACTIONS
        // ===========================
        const transactions = await Transaction.bulkCreate([
            // Income
            { type: 'income', category: 'project_payment', amount: 150000, date: '2026-02-10', description: 'TechCorp E-Commerce — Milestone 1 Payment', project_id: 1, client_id: 1, payment_method: 'bank_transfer', reference_number: 'TXN-20260210-001' },
            { type: 'income', category: 'project_payment', amount: 120000, date: '2025-11-28', description: 'GreenLeaf Brand Identity — Full Payment', project_id: 3, client_id: 3, payment_method: 'upi', reference_number: 'TXN-20251128-001' },
            { type: 'income', category: 'project_payment', amount: 130000, date: '2026-01-20', description: 'EduBridge LMS — Advance Payment', project_id: 4, client_id: 4, payment_method: 'bank_transfer', reference_number: 'TXN-20260120-001' },
            { type: 'income', category: 'freelance', amount: 45000, date: '2026-02-01', description: 'Freelance Landing Page for NovaTech', payment_method: 'upi', reference_number: 'TXN-20260201-001' },
            // Expenses
            { type: 'expense', category: 'salary', amount: 85000, date: '2026-02-01', description: 'Rahul Sharma — Feb 2026 Salary', payment_method: 'bank_transfer' },
            { type: 'expense', category: 'salary', amount: 65000, date: '2026-02-01', description: 'Priya Nair — Feb 2026 Salary', payment_method: 'bank_transfer' },
            { type: 'expense', category: 'salary', amount: 70000, date: '2026-02-01', description: 'Arjun Menon — Feb 2026 Salary', payment_method: 'bank_transfer' },
            { type: 'expense', category: 'salary', amount: 25000, date: '2026-02-01', description: 'Sneha Reddy — Feb 2026 (Part-time)', payment_method: 'bank_transfer' },
            { type: 'expense', category: 'salary', amount: 15000, date: '2026-02-01', description: 'Karthik Iyer — Feb 2026 Stipend', payment_method: 'bank_transfer' },
            { type: 'expense', category: 'software', amount: 12500, date: '2026-01-15', description: 'Figma Team Plan — Annual', payment_method: 'card' },
            { type: 'expense', category: 'hosting', amount: 8500, date: '2026-01-10', description: 'AWS Hosting — Jan 2026', payment_method: 'card' },
            { type: 'expense', category: 'office', amount: 35000, date: '2026-01-05', description: 'Office Rent — Jan 2026', payment_method: 'bank_transfer' },
            { type: 'expense', category: 'marketing', amount: 18000, date: '2026-02-05', description: 'Google Ads — Feb Campaign', payment_method: 'card' },
        ]);
        console.log(`Created ${transactions.length} transactions.`);

        console.log('\n✅ Seed complete! All mock data has been inserted.');
        console.log('\n📋 Login credentials:');
        console.log('  Admin:    admin@echo.com / admin123');
        console.log('  Admin:    sooriyaa@gmail.com / tns7142006');
        console.log('  Employee: rahul@echo.com / pass123');
        console.log('  Client:   deepa@techcorp.com / pass123');

        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();
