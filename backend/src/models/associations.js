const User = require('./User');
const Employee = require('./Employee');
const Leave = require('./Leave');
const Client = require('./Client');
const Attendance = require('./Attendance');
const Project = require('./Project');
const Task = require('./Task');
const EmployeeProject = require('./EmployeeProject');
const Invoice = require('./Invoice');
const Transaction = require('./Transaction');
const ScrumCall = require('./ScrumCall');
const ScrumCallParticipant = require('./ScrumCallParticipant');
const ForwardCall = require('./ForwardCall');
const Notification = require('./Notification');
const ProjectPhase = require('./ProjectPhase');
const PhasePayment = require('./PhasePayment');
const ProfitSharingSetting = require('./ProfitSharingSetting');
const AdminProfitShare = require('./AdminProfitShare');

// User <-> Employee
User.hasOne(Employee, { foreignKey: 'user_id' });
Employee.belongsTo(User, { foreignKey: 'user_id' });

// Employee <-> Leave
Employee.hasMany(Leave, { foreignKey: 'employee_id' });
Leave.belongsTo(Employee, { foreignKey: 'employee_id' });

// Employee <-> Attendance
Employee.hasMany(Attendance, { foreignKey: 'employee_id' });
Attendance.belongsTo(Employee, { foreignKey: 'employee_id' });

// Client <-> User (portal account)
Client.hasOne(User, { foreignKey: 'client_id' });
User.belongsTo(Client, { foreignKey: 'client_id' });

// Client <-> Project
Client.hasMany(Project, { foreignKey: 'client_id' });
Project.belongsTo(Client, { foreignKey: 'client_id' });

// Project <-> Task
Project.hasMany(Task, { foreignKey: 'project_id' });
Task.belongsTo(Project, { foreignKey: 'project_id' });

// Employee <-> Task
Employee.hasMany(Task, { foreignKey: 'assigned_to' });
Task.belongsTo(Employee, { foreignKey: 'assigned_to' });

// Project <-> Employee (via EmployeeProject)
Project.belongsToMany(Employee, { through: EmployeeProject, foreignKey: 'project_id' });
Employee.belongsToMany(Project, { through: EmployeeProject, foreignKey: 'employee_id' });

// Project <-> Invoice
Project.hasMany(Invoice, { foreignKey: 'project_id' });
Invoice.belongsTo(Project, { foreignKey: 'project_id' });

// Client <-> Invoice
Client.hasMany(Invoice, { foreignKey: 'client_id' });
Invoice.belongsTo(Client, { foreignKey: 'client_id' });

// Project <-> Transaction
Project.hasMany(Transaction, { foreignKey: 'project_id' });
Transaction.belongsTo(Project, { foreignKey: 'project_id' });

// ScrumCall <-> ScrumCallParticipant
ScrumCall.hasMany(ScrumCallParticipant, { foreignKey: 'scrum_call_id', as: 'participants' });
ScrumCallParticipant.belongsTo(ScrumCall, { foreignKey: 'scrum_call_id' });

// Employee <-> ScrumCallParticipant
Employee.hasMany(ScrumCallParticipant, { foreignKey: 'employee_id' });
ScrumCallParticipant.belongsTo(Employee, { foreignKey: 'employee_id' });

// User <-> ScrumCall (created_by)
User.hasMany(ScrumCall, { foreignKey: 'created_by', as: 'scrumCalls' });
ScrumCall.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Client <-> ForwardCall
Client.hasMany(ForwardCall, { foreignKey: 'client_id' });
ForwardCall.belongsTo(Client, { foreignKey: 'client_id' });

// User <-> ForwardCall (created_by)
User.hasMany(ForwardCall, { foreignKey: 'created_by', as: 'forwardCalls' });
ForwardCall.belongsTo(User, { foreignKey: 'created_by', as: 'forwardCreator' });

// User <-> Notification (recipient)
User.hasMany(Notification, { foreignKey: 'recipient_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' });

// User <-> Notification (sender)
User.hasMany(Notification, { foreignKey: 'sender_id', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Project <-> ProjectPhase
Project.hasMany(ProjectPhase, { foreignKey: 'project_id', as: 'phases' });
ProjectPhase.belongsTo(Project, { foreignKey: 'project_id' });

// ProjectPhase <-> PhasePayment
ProjectPhase.hasMany(PhasePayment, { foreignKey: 'phase_id', as: 'payments' });
PhasePayment.belongsTo(ProjectPhase, { foreignKey: 'phase_id' });

// PhasePayment <-> Transaction
PhasePayment.belongsTo(Transaction, { foreignKey: 'finance_transaction_id', as: 'transaction' });

// User <-> AdminProfitShare
User.hasMany(AdminProfitShare, { foreignKey: 'user_id', as: 'profitShares' });
AdminProfitShare.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { User, Employee, Leave, Client, Attendance, Project, Task, EmployeeProject, Invoice, Transaction, ScrumCall, ScrumCallParticipant, ForwardCall, Notification, ProjectPhase, PhasePayment, ProfitSharingSetting, AdminProfitShare };
