const express = require('express');
const router = express.Router();
const { getAdminStats, getEmployeeStats, getClientStats, getRevenueChart, getRecentActivity, getEmployeeCharts, getClientCharts } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.get('/admin', auth, getAdminStats);
router.get('/employee', auth, getEmployeeStats);
router.get('/client', auth, getClientStats);
router.get('/revenue-chart', auth, getRevenueChart);
router.get('/recent-activity', auth, getRecentActivity);
router.get('/employee/charts', auth, getEmployeeCharts);
router.get('/client/charts', auth, getClientCharts);

module.exports = router;
