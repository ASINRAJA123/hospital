const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT,
    mongoURI: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpireMinutes: process.env.ACCESS_TOKEN_EXPIRE_MINUTES,
    frontendURL: process.env.FRONTEND_URL,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioFromPhone: process.env.TWILIO_FROM_PHONE
};