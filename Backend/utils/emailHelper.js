import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * 🚀 PRODUCTION-READY EMAIL HELPER (Brevo API Edition)
 * Works everywhere (Render, Hostinger, Vercel) because it uses Port 443 (HTTPS).
 */
export const sendEmail = async (to, subject, htmlContent) => {
    const apiKey = (process.env.SMTP_PASS || "").trim();
    const senderEmail = (process.env.SMTP_USER || "").trim();

    console.log(`📩 [EMAIL ACTION] Sending to: ${to}`);

    if (!apiKey || !senderEmail) {
        console.error("❌ [ERROR] SMTP_USER or SMTP_PASS (API Key) missing in Environment Variables");
        return false;
    }

    try {
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: { name: "DEZA Luxury", email: senderEmail },
                to: [{ email: to }],
                subject: subject || "Notification from DEZA Luxury",
                htmlContent: htmlContent,
            },
            {
                headers: {
                    "api-key": apiKey,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log(`✅ [SUCCESS] Email sent! ID: ${response.data.messageId}`);
        return true;
    } catch (err) {
        console.error("❌ [FAILED] Brevo API Error:");
        const errorMsg = err.response?.data?.message || err.message;
        console.error(`❌ [REASON]: ${errorMsg}`);
        return false;
    }
};

export const getBrandedTemplate = (title, body) => `
<div style="background-color: #000; padding: 40px 20px; font-family: sans-serif;">
    <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border: 2px solid #d4af37;">
        <h1 style="text-align: center; color: #000; letter-spacing: 5px;">DEZA</h1>
        <h2 style="text-align: center; color: #d4af37;">${title}</h2>
        <div style="color: #333; line-height: 1.6;">${body}</div>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="text-align: center; font-size: 12px; color: #888;">&copy; 2024 DEZA Luxury Fragrances</p>
    </div>
</div>
`;
