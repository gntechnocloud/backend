const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Invalid token format' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (!err) req.user = user;
        next();
    });
}

async function requireRegisteredUser(req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const user = await User.findById(req.user.userId);
    if (!user || !user.isActive) return res.status(403).json({ message: 'User not registered or inactive' });
    next();
}

async function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    next();
}

module.exports = {
    authenticateJWT,
    optionalAuth,
    requireRegisteredUser,
    requireAdmin
};