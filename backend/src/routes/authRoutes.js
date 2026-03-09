const express = require('express');
const router = express.Router();
const { login, getMe, forgotPassword, verifyOTP, resetPassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
