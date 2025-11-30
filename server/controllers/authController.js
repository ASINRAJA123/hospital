const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const { generateToken } = require('../utils/tokenUtils');

// @desc    Authenticate user & get token
// @route   POST /api/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    // --- THIS IS THE FIX ---
    // Expect `email` from the JSON body, not `username`.
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide an email and password');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    if (!(await user.matchPassword(password))) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
        res.status(403);
        throw new Error('This user account has been deactivated');
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    // The response structure matches the original Python backend's Token schema
    res.json({
        access_token: generateToken(user._id, user.role),
        token_type: 'bearer',
    });
});

module.exports = {
    loginUser,
};