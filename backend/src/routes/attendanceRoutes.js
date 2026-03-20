const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getToday,
    getMyAttendance,
    getAll,
    getByDate,
    getByEmployee,
    getMonthlyOverview,
} = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

router.get('/by-date', auth, getByDate);
router.get('/by-employee/:employeeId', auth, getByEmployee);
router.get('/monthly-overview', auth, getMonthlyOverview);
router.post('/check-in', auth, checkIn);
router.post('/check-out', auth, checkOut);
router.get('/me/today', auth, getToday);
router.get('/me', auth, getMyAttendance);
router.get('/', auth, getAll);

module.exports = router;
