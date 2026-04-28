import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import { sendEmail, getBrandedTemplate } from "../utils/emailHelper.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();
import { sendWhatsApp } from "../utils/whatsappHelper.js";

// ─── Email OTP (Live & Reliable) ──────────────────────────────────────────
router.post("/send-email-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required." });

        const html = getBrandedTemplate("Verification Code", `
            <p>Welcome to DEZA. Use the code below to verify your account:</p>
            <div style="text-align: center; margin: 30px 0; font-size: 32px; font-weight: bold; color: #d4af37; letter-spacing: 5px; border: 1px dashed #d4af37; padding: 20px; border-radius: 8px;">
                ${otp}
            </div>
            <p style="font-size: 14px; color: #666;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        `);

        const success = await sendEmail(email, "🔐 Your DEZA Verification Code", html);
        
        if (success) {
            res.json({ message: "Verification code sent to your email! ✨" });
        } else {
            res.status(500).json({ error: "Failed to send email. Check SMTP settings." });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to send Email OTP." });
    }
});

// ─── Register ─────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, contact, gender, dob } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required." });
        }

        // ✅ Exact Email format — Only allow letters, numbers, dot, and @
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Please enter a valid email address (Only letters, numbers, @ and . are allowed)." });
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongPasswordRegex.test(password)) {
            return res.status(400).json({ error: "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character." });
        }

        // ✅ DOB validation — must be at least 10 years old
        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 10) {
                return res.status(400).json({ error: "You must be at least 10 years old to register." });
            }
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: "Account already exists with this email." });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            contact: contact || "",
            gender: gender || "",
            dob: dob ? new Date(dob) : null,
            role: "user",
            verifiedAt: new Date(),
        });

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Registration successful!",
            token,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                contact: newUser.contact,
                gender: newUser.gender,
                dob: newUser.dob,
            },
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Server error during registration." });
    }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const user = await User.findOne({ email: email.toLowerCase() })
            .populate("wishlist")
            .populate("cart.product");

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful!",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                contact: user.contact,
                gender: user.gender,
                dob: user.dob,
                cart: user.cart,
                wishlist: user.wishlist
            },
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error during login." });
    }
});

// ─── Get Current User Profile (Fetch Details including Addresses) ──────────────
router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password -resetPasswordToken -resetPasswordExpires")
            .populate("wishlist")
            .populate("cart.product");
        if (!user) return res.status(404).json({ error: "User not found." });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Server error." });
    }
});

// ─── Sync Cart/Wishlist ────────────────────────────────────────────────────────
router.post("/sync", auth, async (req, res) => {
    try {
        const { cart, wishlist } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found." });

        if (cart) user.cart = cart;
        if (wishlist) user.wishlist = wishlist;

        await user.save();
        res.json({ message: "Data synced successfully." });
    } catch (err) {
        console.error("Sync error:", err);
        res.status(500).json({ error: "Failed to sync data." });
    }
});

// ─── Admin Login ──────────────────────────────────────────────────────────────
router.post("/admin-login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ error: "Invalid admin credentials." });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid admin credentials." });
        }

        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role, isAdmin: true },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        res.json({
            message: "Admin login successful!",
            token,
            user: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
        });
    } catch (err) {
        res.status(500).json({ error: "Server error during admin login." });
    }
});

// ─── Create Admin (Bootstrap) ─────────────────────────────────────────────────
// Secret is now read from environment variable — NOT hardcoded in source
router.post("/create-admin", async (req, res) => {
    try {
        const { name, email, password, secret } = req.body;

        const adminSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
        if (!adminSecret || secret !== adminSecret) {
            return res.status(403).json({ error: "Invalid secret key." });
        }

        const existing = await Admin.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: "Admin already exists." });
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongPasswordRegex.test(password)) {
            return res.status(400).json({ error: "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character." });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const admin = await Admin.create({
            name: name || "Admin",
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "superadmin",
            permissions: ["all"]
        });

        res.status(201).json({ message: "Admin created successfully!", admin: { email: admin.email } });
    } catch (err) {
        res.status(500).json({ error: "Server error." });
    }
});

// ─── Forgot Password — sends a signed, time-limited reset token ───────────────
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required." });

        const user = await User.findOne({ email: email.toLowerCase() });
        // Always respond with success to prevent email enumeration attacks
        if (!user) {
            return res.json({ message: "If an account exists, a recovery email has been sent." });
        }

        // Generate a secure random token (not just the email!)
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
        await user.save();

        // Build the reset link — prioritize Vercel production URL over localhost fallback
        const clientUrl = process.env.CLIENT_URL || "https://deza-ecommerce.vercel.app";
        const resetLink = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        const html = getBrandedTemplate("Password Recovery", `
            <p>We received a request to access your DEZA account. Click the button below to restore your access:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: #1a1a1a; color: #d4af37; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; border: 1px solid #d4af37;">
                    RESET PASSWORD
                </a>
            </div>
            <p style="font-size: 14px; color: #666;">This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
        `);

        const success = await sendEmail(email, "🔑 Secure Reset Link — DEZA", html);

        if (!success) {
            return res.status(500).json({ error: "Failed to send email. Please try again." });
        }
        res.json({ message: "If an account exists, a recovery email has been sent." });
    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ error: "Failed to send email." });
    }
});

// ─── Reset Password — validates token before allowing reset ───────────────────
router.post("/reset-password", async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!token || !email) {
            return res.status(400).json({ error: "Reset token and email are required." });
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!newPassword || !strongPasswordRegex.test(newPassword)) {
            return res.status(400).json({ error: "New password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character." });
        }

        // Hash the incoming token and compare to stored hash
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            email: email.toLowerCase(),
            resetPasswordToken: tokenHash,
            resetPasswordExpires: { $gt: new Date() }, // Must not be expired
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        const html = getBrandedTemplate("Password Updated", `
            <p>Success! Your DEZA account password has been successfully updated.</p>
            <p>If you did not perform this action, please contact our security team immediately.</p>
        `);
        await sendEmail(email, "✅ Password Updated Successfully", html);

        res.json({ message: "Password reset successful! You can now login." });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ error: "Server error during reset." });
    }
});

// ─── ADMIN: User Management (protected) ──────────────────────────────────────
router.get("/users", auth, adminOnly, async (req, res) => {
    try {
        const users = await User.find().select("-password -resetPasswordToken -resetPasswordExpires").sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users." });
    }
});

router.delete("/users/:id", auth, adminOnly, async (req, res) => {
    try {
        // Prevent deleting yourself
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: "You cannot delete your own admin account." });
        }
        const deleted = await User.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "User not found." });
        res.json({ message: "User account deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete user." });
    }
});

export default router;
