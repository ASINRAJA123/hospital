const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/authController');

// --- THIS IS THE FIX ---
// The route is simplified. The global `express.json()` middleware in `app.js`
// will handle parsing the request body, so no specific middleware is needed here.
// The route path is also simplified for clarity.
router.post('/login', loginUser);

module.exports = router;