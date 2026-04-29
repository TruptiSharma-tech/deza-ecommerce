import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * 🔒 ATOMIC PRO-GRADE FIX: Using Brevo REST API via Port 443 (HTTPS)
 * This bypasses all SMTP port blocks (25, 465, 587, 2525) on Render.
 */
export const sendEmail = async (to, subject, htmlContent) => {
    const apiKey = (process.env.SMTP_PASS || "").trim();
    const senderEmail = (process.env.SMTP_USER || "").trim();

    console.log(`📩 [API ACTION] Attempting to send email via Brevo API to: ${to}`);

    if (!apiKey || !senderEmail) {
        console.error("❌ [API ERROR] Brevo API Key or Sender Email missing in .env");
        return false;
    }

    try {
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: { name: "DEZA Luxury", email: senderEmail },
                to: [{ email: to }],
                subject: subject || "Notification from DEZA",
                htmlContent: htmlContent,
            },
            {
                headers: {
                    "api-key": apiKey,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            }
        );

        console.log(`✅ [API SUCCESS] Email sent successfully! Message ID: ${response.data.messageId}`);
        return true;
    } catch (err) {
        console.error("❌ [API FAILED] Brevo API Error:");
        if (err.response) {
            console.error("❌ [REASON]:", err.response.data.message || JSON.stringify(err.response.data));
        } else {
            console.error("❌ [REASON]:", err.message);
        }
        return false;
    }
};

// Placeholder for templates compatibility
export const getBrandedTemplate = (title, body) => `
<div style="background-color: #0a0a0a; padding: 50px 20px; font-family: 'Garamond', 'Times New Roman', serif; color: #fff;">
    <div style="max-width: 600px; margin: auto; background: #fff; border: 1px solid #d4af37; border-radius: 0; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <div style="text-align: center; border-bottom: 1px solid #d4af37; padding-bottom: 30px; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin: 0; text-transform: uppercase; letter-spacing: 12px; font-size: 32px; font-weight: 300;">DEZA</h1>
            <p style="color: #d4af37; margin: 10px 0 0; text-transform: uppercase; letter-spacing: 4px; font-size: 10px;">Luxury Fragrance House</p>
        </div>
        
        <h2 style="color: #1a1a1a; text-align: center; font-weight: 400; font-size: 22px; margin-bottom: 30px; letter-spacing: 1px;">${title}</h2>
        
        <div style="font-size: 16px; color: #333; line-height: 1.8; text-align: left;">
            ${body}
        </div>
        
        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee; text-align: center;">
            <p style="font-size: 12px; color: #999; margin-bottom: 10px;">This is an exclusive communication from DEZA Luxury Support.</p>
            <div style="font-size: 14px; color: #1a1a1a; letter-spacing: 2px;">WWW.DEZA.COM</div>
        </div>
    </div>
</div>
`;
