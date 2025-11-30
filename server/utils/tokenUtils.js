const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, config.jwtSecret, {
        expiresIn: `${config.jwtExpireMinutes}m`,
    });
};

module.exports = { generateToken };