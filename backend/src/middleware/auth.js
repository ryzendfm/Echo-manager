const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Check if not token
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token, authorization denied'
        });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};
