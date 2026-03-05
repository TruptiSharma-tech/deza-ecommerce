import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || `"DEZA Support" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            replyTo: "support@deza.com", // Your professional alias
        };
        await transporter.sendMail(mailOptions);
        console.log(`📩 Email sent successfully to ${to}`);
        return true;
    } catch (err) {
        console.error("❌ Email failed:", err.message);
        return false;
    }
};

// Branded Templates
export const getBrandedTemplate = (title, body) => `
<div style="background-color: #f9f7f2; padding: 40px; font-family: 'Times New Roman', serif;">
    <div style="max-width: 600px; margin: auto; background: #fff; border: 2px solid #d4af37; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <h1 style="color: #d4af37; text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; text-transform: uppercase; letter-spacing: 5px;">DEZA</h1>
        <h2 style="color: #1a1a1a; text-align: center; margin-top: 20px;">${title}</h2>
        <div style="font-size: 16px; color: #444; line-height: 1.8; margin-top: 30px;">
            ${body}
        </div>
        <p style="font-size: 13px; color: #999; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            This is an automated message from DEZA Luxury Support. Please do not reply to this email.
        </p>
    </div>
</div>
`;
