const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPasswordResetOTP } = require('../utils/emailService');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check if user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // 2. Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Password doesn't match"
            });
        }

        // 3. Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account is deactivated. Please contact admin.'
            });
        }

        // 4. Generate JWT Token
        const payload = {
            id: user.id,
            user_uid: user.user_uid,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 1 day
        );

        // 5. Update last login
        user.last_login = new Date();
        await user.save();

        // 6. Send response
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                user_uid: user.user_uid,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// Step 1: Send OTP to email
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email address',
            });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Entered email doesn't exist in our records",
            });
        }

        // Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // Hash the OTP before storing in DB
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        // Save hashed OTP and expiry (10 minutes)
        user.password_reset_token = hashedOTP;
        user.password_reset_expires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        // Send OTP via email
        await sendPasswordResetOTP(user.email, user.first_name, otp);

        res.json({
            success: true,
            message: 'OTP has been sent to your email.',
        });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
        });
    }
};

// Step 2: Verify OTP
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required',
            });
        }

        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        const user = await User.findOne({
            where: {
                email,
                password_reset_token: hashedOTP,
                password_reset_expires: { [Op.gt]: new Date() },
            },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP',
            });
        }

        // Generate a short-lived reset token for the final step
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Replace OTP with reset token, keep same expiry
        user.password_reset_token = hashedResetToken;
        await user.save();

        res.json({
            success: true,
            message: 'OTP verified successfully',
            resetToken,
        });
    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP',
        });
    }
};

// Step 3: Reset password using the reset token from step 2
exports.resetPassword = async (req, res) => {
    const { resetToken, password } = req.body;

    try {
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
            });
        }

        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const user = await User.findOne({
            where: {
                password_reset_token: hashedToken,
                password_reset_expires: { [Op.gt]: new Date() },
            },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset session. Please start over.',
            });
        }

        // Update password
        user.password = await bcrypt.hash(password, 10);
        user.password_reset_token = null;
        user.password_reset_expires = null;
        await user.save();

        res.json({
            success: true,
            message: 'Password has been reset successfully',
        });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get Me Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}
