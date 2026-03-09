const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const sequelize = require('./src/config/db');

// Import models to ensure they are registered
require('./src/models/User');
require('./src/models/Employee');
require('./src/models/Client');
require('./src/models/Project');
require('./src/models/Task');
require('./src/models/Invoice');
require('./src/models/Transaction');
require('./src/models/Attendance');
require('./src/models/Leave');
require('./src/models/EmployeeProject');
require('./src/models/ScrumCall');
require('./src/models/ScrumCallParticipant');
require('./src/models/ForwardCall');
require('./src/models/Notification');
require('./src/models/ProjectPhase');
require('./src/models/PhasePayment');
require('./src/models/ProfitSharingSetting');
require('./src/models/AdminProfitShare');
require('./src/models/associations');

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// --- Socket.io Setup ---
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Map<userId (string), Set<socketId>>
const userSocketMap = new Map();

// JWT auth middleware for socket connections
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Authentication error: No token'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket) => {
    const userId = String(socket.user.id);

    // Add socket to user's set
    if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId).add(socket.id);
    console.log(`Socket connected: user ${userId}, socket ${socket.id} (${userSocketMap.get(userId).size} tabs)`);

    socket.on('disconnect', () => {
        const sockets = userSocketMap.get(userId);
        if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                userSocketMap.delete(userId);
            }
        }
        console.log(`Socket disconnected: user ${userId}, socket ${socket.id}`);
    });
});

// Make io and userSocketMap accessible to other modules
app.set('io', io);
app.set('userSocketMap', userSocketMap);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/v1/auth', require('./src/routes/authRoutes'));
app.use('/api/v1/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/v1/projects', require('./src/routes/projectRoutes'));
app.use('/api/v1/employees', require('./src/routes/employeeRoutes'));
app.use('/api/v1/clients', require('./src/routes/clientRoutes'));
app.use('/api/v1/invoices', require('./src/routes/invoiceRoutes'));
app.use('/api/v1/users', require('./src/routes/userRoutes'));
app.use('/api/v1/transactions', require('./src/routes/transactionRoutes'));
app.use('/api/v1/tasks', require('./src/routes/taskRoutes'));
app.use('/api/v1/attendance', require('./src/routes/attendanceRoutes'));
app.use('/api/v1/leaves', require('./src/routes/leaveRoutes'));
app.use('/api/v1/upload', require('./src/routes/uploadRoutes'));
app.use('/api/v1/scrum-calls', require('./src/routes/scrumCallRoutes'));
app.use('/api/v1/forward-calls', require('./src/routes/forwardCallRoutes'));
app.use('/api/v1/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/v1/project-phases', require('./src/routes/projectPhaseRoutes'));
app.use('/api/v1/profit-sharing', require('./src/routes/profitSharingRoutes'));

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('API is running...');
});

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        // Sync new models (creates tables if they don't exist)
        await sequelize.sync();
        console.log('Database synced...');

        // Add total_budget column to projects if missing
        try {
            await sequelize.getQueryInterface().addColumn('projects', 'total_budget', {
                type: require('sequelize').DataTypes.DECIMAL(14, 2),
                defaultValue: 0,
            });
            console.log('Added total_budget column to projects');
        } catch (e) {
            // Column already exists — ignore
        }

        // Add receipt_path column to phase_payments if missing
        try {
            await sequelize.getQueryInterface().addColumn('phase_payments', 'receipt_path', {
                type: require('sequelize').DataTypes.STRING(1000),
                allowNull: true,
            });
            console.log('Added receipt_path column to phase_payments');
        } catch (e) {
            // Column already exists — ignore
        }

        // Add notes column to scrum_calls if missing
        try {
            await sequelize.getQueryInterface().addColumn('scrum_calls', 'notes', {
                type: require('sequelize').DataTypes.TEXT,
                allowNull: true,
            });
            console.log('Added notes column to scrum_calls');
        } catch (e) {
            // Column already exists — ignore
        }

        // Check and create default admin if none exists
        try {
            const User = require('./src/models/User');
            const bcrypt = require('bcryptjs');
            const adminCount = await User.count({ where: { role: 'admin' } });

            if (adminCount === 0) {
                console.log('No admin user found. Creating default admin...');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await User.create({
                    email: 'Admin@gmail.com',
                    password: hashedPassword,
                    role: 'admin',
                    first_name: 'Admin',
                    last_name: 'User',
                    is_active: true
                });
                console.log('Default admin created successfully: Admin@gmail.com / admin123');
            }
        } catch (seedError) {
            console.error('Error checking/creating default admin:', seedError);
        }

        // Start temp file cleanup scheduler
        const { startTempCleanupScheduler } = require('./src/utils/tempCleanup');
        startTempCleanupScheduler();

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
