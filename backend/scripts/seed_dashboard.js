const sequelize = require('../src/config/db');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Client = require('../src/models/Client');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');
const Invoice = require('../src/models/Invoice');
const Attendance = require('../src/models/Attendance');
const EmployeeProject = require('../src/models/EmployeeProject');

async function seedData() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        // Setup Employee (ryz@gmail.com)
        const empUser = await User.findOne({ where: { email: 'ryz@gmail.com' } });
        let emp = null;
        if (empUser) {
            emp = await Employee.findOne({ where: { user_id: empUser.id } });
        } else {
            console.log('User ryz@gmail.com not found. Create them first if you want specific employee data.');
        }

        // Setup Client (lish@gmail.com)
        const clientUser = await User.findOne({ where: { email: 'lish@gmail.com' } });
        let client = null;
        if (clientUser) {
            client = await Client.findOne({ where: { id: clientUser.client_id } });
            // Fallback if client is stored differently in some setups:
            if (!client) {
                client = await Client.findOne({ where: { company_email: 'lish@gmail.com' } });
            }
        } else {
            console.log('User lish@gmail.com not found. Working with a dummy client or first available.');
            client = await Client.findOne();
        }

        if (!emp && !client) {
            console.log("Couldn't find target users. Exiting.");
            process.exit(0);
        }

        // 1. Create Projects for Client
        console.log('Creating projects...');
        const projectsToCreate = [
            { project_uid: 'PRJ-ALPHA', project_name: 'Alpha Web Redesign', client_id: client ? client.id : 1, status: 'in_progress', priority: 'high', budget_estimated: 150000, deadline: '2026-10-01' },
            { project_uid: 'PRJ-BETA', project_name: 'Beta Mobile App', client_id: client ? client.id : 1, status: 'planning', priority: 'medium', budget_estimated: 250000, deadline: '2026-12-01' },
            { project_uid: 'PRJ-GAMMA', project_name: 'Gamma API Migration', client_id: client ? client.id : 1, status: 'in_progress', priority: 'urgent', budget_estimated: 85000, deadline: '2026-06-01' }
        ];

        const createdProjects = [];
        for (const p of projectsToCreate) {
            try {
                const proj = await Project.create(p);
                createdProjects.push(proj);
            } catch (e) {
                console.log(`Skipping project ${p.project_name} (might already exist)`);
                const existing = await Project.findOne({ where: { project_uid: p.project_uid } });
                if (existing) createdProjects.push(existing);
            }
        }

        // 2. Assign Employee to these Projects if emp exists
        if (emp) {
            console.log('Assigning employee to projects...');
            for (const p of createdProjects) {
                try {
                    await EmployeeProject.create({ employee_id: emp.id, project_id: p.id, role: 'Developer' });
                } catch (e) {
                    console.log(`Employee mapping to project ${p.project_name} might already exist, skipping...`);
                }
            }
        }

        // 3. Create Tasks
        console.log('Creating tasks...');
        const taskPromises = [];

        // For Alpha Web Redesign
        taskPromises.push(Task.create({ task_uid: 'TASK-ALPHA-01', project_id: createdProjects[0].id, assigned_to: emp ? emp.id : null, title: 'Setup repository', status: 'completed', priority: 'high', updated_at: new Date() }));
        taskPromises.push(Task.create({ task_uid: 'TASK-ALPHA-02', project_id: createdProjects[0].id, assigned_to: emp ? emp.id : null, title: 'Design DB schema', status: 'completed', priority: 'high', updated_at: new Date(Date.now() - 86400000 * 2) }));
        taskPromises.push(Task.create({ task_uid: 'TASK-ALPHA-03', project_id: createdProjects[0].id, assigned_to: emp ? emp.id : null, title: 'Implement auth', status: 'in_progress', priority: 'high' }));
        taskPromises.push(Task.create({ task_uid: 'TASK-ALPHA-04', project_id: createdProjects[0].id, assigned_to: emp ? emp.id : null, title: 'Build Dashboard UI', status: 'todo', priority: 'medium' }));

        // For Beta Mobile App
        taskPromises.push(Task.create({ task_uid: 'TASK-BETA-01', project_id: createdProjects[1].id, assigned_to: emp ? emp.id : null, title: 'React Native Setup', status: 'in_progress', priority: 'high' }));
        taskPromises.push(Task.create({ task_uid: 'TASK-BETA-02', project_id: createdProjects[1].id, assigned_to: emp ? emp.id : null, title: 'Navigation Flow', status: 'todo', priority: 'medium' }));

        // For Gamma API Migration
        taskPromises.push(Task.create({ task_uid: 'TASK-GAMMA-01', project_id: createdProjects[2].id, assigned_to: emp ? emp.id : null, title: 'Analyze old API', status: 'completed', priority: 'medium', updated_at: new Date(Date.now() - 86400000 * 4) }));
        taskPromises.push(Task.create({ task_uid: 'TASK-GAMMA-02', project_id: createdProjects[2].id, assigned_to: emp ? emp.id : null, title: 'Write new endpoints', status: 'in_progress', priority: 'high' }));
        taskPromises.push(Task.create({ task_uid: 'TASK-GAMMA-03', project_id: createdProjects[2].id, assigned_to: emp ? emp.id : null, title: 'Test migration', status: 'todo', priority: 'urgent' }));

        try {
            await Promise.all(taskPromises);
        } catch (e) {
            console.log('Some tasks failed to create, proceeding anyway...');
        }

        if (client) {
            console.log('Creating invoices...');
            try {
                await Invoice.create({ invoice_uid: 'INV-ALPHA-01', client_id: client.id, project_id: createdProjects[0]?.id, amount: 50000, total_amount: 50000, status: 'paid', issue_date: new Date(), due_date: new Date(Date.now() + 86400000 * 30) });
                await Invoice.create({ invoice_uid: 'INV-BETA-01', client_id: client.id, project_id: createdProjects[1]?.id, amount: 25000, total_amount: 25000, status: 'sent', issue_date: new Date(), due_date: new Date(Date.now() + 86400000 * 15) });
                await Invoice.create({ invoice_uid: 'INV-GAMMA-01', client_id: client.id, project_id: createdProjects[2]?.id, amount: 85000, total_amount: 85000, status: 'partially_paid', issue_date: new Date(), due_date: new Date(Date.now() + 86400000 * 5) });
            } catch (e) {
                console.log('Some invoices failed to create, skipping...');
            }
        }

        // 5. Create Attendance for Employee
        if (emp) {
            console.log('Creating attendance...');
            for (let i = 0; i < 7; i++) {
                const date = new Date(Date.now() - 86400000 * i);
                const dateStr = date.toISOString().split('T')[0];
                try {
                    const existing = await Attendance.findOne({ where: { employee_id: emp.id, date: dateStr } });
                    if (!existing) {
                        await Attendance.create({
                            employee_id: emp.id,
                            date: dateStr,
                            status: i % 5 === 0 ? 'absent' : 'present',
                            check_in: new Date(date.setHours(9, 0, 0, 0)),
                            check_out: new Date(date.setHours(17, 0, 0, 0))
                        });
                    }
                } catch (e) {
                    console.log('Skipping attendance record');
                }
            }
        }

        console.log('Mock data seeded successfully!');
        process.exit(0);
    } catch (e) {
        console.error('Error seeding data:', e);
        process.exit(1);
    }
}

seedData();
