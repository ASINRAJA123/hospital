const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const config = require('../config');

// Middleware to protect routes
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, config.jwtSecret);

            // Get user from the token, populating the hospital relationship
            req.user = await User.findById(decoded.id).select('-hashedPassword').populate('hospital');

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// Middleware for role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`User role '${req.user.role}' is not authorized to access this route`);
        }
        next();
    };
};

module.exports = { protect, authorize };