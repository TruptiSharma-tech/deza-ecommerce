import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

const createTransporter = () => {
    const user = (process.env.SMTP_USER || "").trim();
    const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

    console.log(`📡 [SMTP DEBUG] PORT 587 + IPv4 MODE for ${user}`);

    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Port 587 must use STARTTLS (secure: false)
        // 🔒 ATOMIC FIX: Force DNS to only return IPv4 addresses
        lookup: (hostname, options, callback) => {
            dns.lookup(hostname, { family: 4 }, callback);
        },
        auth: {
            user: user,
            pass: pass,
        },
        tls: {
            rejectUnauthorized: false
        },
        logger: true, 
        debug: true,
        connectionTimeout: 10000
    });
};

let transporter = createTransporter();

// Verify connection on startup
const verifyTransporter = async () => {
    try {
        await transporter.verify();
        console.log("✅ SMTP Server is ready (verified)");
    } catch (error) {
        console.error("❌ SMTP Verification Failed:", error.message);
        console.log("💡 Tip: Check if App Password is correct and 2-Step Verification is ON.");
    }
};

verifyTransporter();

export const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"DEZA Luxury" <${process.env.SMTP_USER}>`,
            to,
            subject: subject || "Notification from DEZA",
            html,
        };

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error("❌ SMTP Credentials missing in .env");
            return false;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`📩 Email sent: ${info.messageId} to ${to}`);
        return true;
    } catch (err) {
        console.error("❌ Email failed for:", to);
        console.error("❌ Reason:", err.message);
        return false;
    }
};

// Branded Templates (Luxury Gold Theme)
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
