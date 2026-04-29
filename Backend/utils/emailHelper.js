import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

const createTransporter = () => {
    const user = (process.env.SMTP_USER || "").trim();
    const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

    console.log(`📡 [SMTP DEBUG] REVERTING TO ORIGINAL: Service Gmail for ${user}`);

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: user,
            pass: pass,
        },
        tls: {
            rejectUnauthorized: false
        },
        logger: true,
        debug: true
    });
};

let transporter = createTransporter();

export const sendEmail = async (to, subject, html) => {
    console.log(`📩 [ACTION] Attempting to send email to: ${to}`);
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
        console.log(`✅ [SUCCESS] Email sent: ${info.messageId}`);
        return true;
    } catch (err) {
        console.error("❌ [FAILED] Email failed for:", to);
        console.error("❌ [ERROR REASON]:", err.message);
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
