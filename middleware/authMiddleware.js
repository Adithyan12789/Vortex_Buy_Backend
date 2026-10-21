const jwt = require('jsonwebtoken');

const authMiddleware = function (req, res, next) {
    let token = req.header('x-auth-token');
    const authHeader = req.header('authorization') || req.header('Authorization');
    if (!token && authHeader) {
        token = authHeader.replace(/^Bearer\s+/i, '').trim();
    }

    if (!token) {
        req.user = null;
        return next();
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;
        next();
    } catch (err) {
        req.user = null;
        next();
    }
};

const requireAuth = function (req, res, next) {
    authMiddleware(req, res, () => {
        if (!req.user) {
            return res.status(401).json({ msg: 'Authorization denied. Please log in.' });
        }
        next();
    });
};

module.exports = authMiddleware;
module.exports.requireAuth = requireAuth;