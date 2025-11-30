const twilio = require('twilio');
const config = require('../config');

let client;
if (config.twilioAccountSid && config.twilioAuthToken && config.twilioFromPhone) {
    client = twilio(config.twilioAccountSid, config.twilioAuthToken);
} else {
    console.warn("Twilio credentials are not fully configured. SMS sending is disabled.");
}

const sendSms = async (to_number, body) => {
    if (!client) {
        console.log(`SMS not sent to ${to_number} (Twilio not configured): ${body}`);
        return false;
    }

    // Prepend country code if not present (e.g., +91 for India)
    if (!to_number.startsWith('+')) {
        to_number = `+91${to_number}`;
    }

    try {
        const message = await client.messages.create({
            body: body,
            from: config.twilioFromPhone,
            to: to_number
        });
        console.log(`SMS sent successfully to ${to_number}, SID: ${message.sid}`);
        return true;
    } catch (error) {
        console.error(`Failed to send SMS to ${to_number}. Error: ${error.message}`);
        return false;
    }
};

module.exports = { sendSms };