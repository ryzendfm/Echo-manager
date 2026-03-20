const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send a password-reset OTP email.
 */
const sendPasswordResetOTP = async (toEmail, userName, otp) => {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: toEmail,
        subject: 'Password Reset OTP - Echo Manager',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0;">
                    <h1 style="color: #333; margin: 0;">Echo Manager</h1>
                </div>
                <div style="padding: 30px 0;">
                    <h2 style="color: #333;">Password Reset OTP</h2>
                    <p style="color: #555; font-size: 16px; line-height: 1.5;">
                        Hi ${userName},
                    </p>
                    <p style="color: #555; font-size: 16px; line-height: 1.5;">
                        We received a request to reset your password. Use the OTP below to proceed:
                    </p>
                    <div style="text-align: center; padding: 24px 0;">
                        <div style="display: inline-block; background-color: #f4f4f5; border: 2px dashed #d4d4d8; border-radius: 8px; padding: 16px 40px;">
                            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #171717;">
                                ${otp}
                            </span>
                        </div>
                    </div>
                    <p style="color: #888; font-size: 14px; line-height: 1.5;">
                        This OTP will expire in <strong>10 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.
                    </p>
                </div>
                <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; text-align: center;">
                    <p style="color: #aaa; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} Echo Digitals. All rights reserved.
                    </p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

/**
 * Send a portal access invitation email with a set-password link.
 */
const sendPortalInvite = async (toEmail, userName, setPasswordUrl) => {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: toEmail,
        subject: 'Your Client Portal Access - Echo Manager',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0;">
                    <h1 style="color: #333; margin: 0;">Echo Manager</h1>
                </div>
                <div style="padding: 30px 0;">
                    <h2 style="color: #333;">Welcome to the Client Portal!</h2>
                    <p style="color: #555; font-size: 16px; line-height: 1.5;">
                        Hi ${userName},
                    </p>
                    <p style="color: #555; font-size: 16px; line-height: 1.5;">
                        Your client portal access has been created. Please set your password to get started.
                    </p>
                    <div style="text-align: center; padding: 24px 0;">
                        <a href="${setPasswordUrl}" style="display: inline-block; background-color: #8033cc; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                            Set Your Password
                        </a>
                    </div>
                    <p style="color: #888; font-size: 14px; line-height: 1.5;">
                        This link will expire in <strong>24 hours</strong>. If you did not expect this email, you can safely ignore it.
                    </p>
                    <p style="color: #888; font-size: 14px; line-height: 1.5;">
                        If the button above doesn't work, copy and paste this URL into your browser:
                    </p>
                    <p style="color: #8033cc; font-size: 13px; word-break: break-all;">
                        ${setPasswordUrl}
                    </p>
                </div>
                <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; text-align: center;">
                    <p style="color: #aaa; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} Echo Digitals. All rights reserved.
                    </p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { transporter, sendPasswordResetOTP, sendPortalInvite };
