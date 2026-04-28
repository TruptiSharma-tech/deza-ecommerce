import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

// Note: You need to install twilio: npm install twilio
let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

/**
 * Sends an SMS OTP to a phone number.
 * @param {string} to - The recipient's phone number (with country code, e.g., +91).
 * @param {string} otp - The 6-digit OTP code.
 */
export const sendSMS = async (to, otp) => {
    try {
        if (!client) {
            console.warn("⚠️ Twilio not configured. OTP:", otp, "for", to);
            return { success: true, message: "Simulation mode: SMS logged in console." };
        }

        const message = await client.messages.create({
            body: `Your DEZA Luxury verification code is: ${otp}. Do not share this with anyone. ✨`,
            from: fromPhone,
            to: to.startsWith("+") ? to : `+91${to}`, // Default to India if no country code
        });

        console.log("✅ SMS Sent Successfully! SID:", message.sid);
        return { success: true, sid: message.sid };
    } catch (error) {
        console.error("❌ SMS Sending Failed:", error.message);
        return { success: false, error: error.message };
    }
};
