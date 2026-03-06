import express from "express";
import Product from "../models/Product.js";
import AuditLog from "../models/AuditLog.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// ─── GET All Products ──────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch products." });
    }
});

// ─── GET Single Product ────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found." });
        res.json(product);
    } catch (err) {
        // try with numeric id as fallback
        try {
            const allProducts = await Product.find();
            const product = allProducts.find(p => String(p._id) === req.params.id);
            if (!product) return res.status(404).json({ error: "Product not found." });
            res.json(product);
        } catch {
            res.status(500).json({ error: "Failed to fetch product." });
        }
    }
});

// ─── POST - Add Product ────────────────────────────────────────────────────────
router.post("/", auth, adminOnly, async (req, res) => {
    try {
        const { title, description, fragrance, categories, types, sizePrices, stock, images, image } =
            req.body;

        if (!title || !categories || !types || !sizePrices) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const newProduct = await Product.create({
            title: title.trim(),
            description: description || "",
            fragrance: fragrance || "",
            categories: categories || [],
            types: types || [],
            sizePrices: sizePrices || [],
            stock: Number(stock) || 0,
            sold: 0,
            images: images || [],
            image: image || (images && images[0]) || "",
        });

        // ✅ RECORD AUDIT LOG
        await AuditLog.create({
            adminId: req.user.id,
            action: "Add Product",
            module: "Products",
            details: `Added new product: ${title}`,
            ipAddress: req.ip || "0.0.0.0"
        });

        res.status(201).json(newProduct);
    } catch (err) {
        console.error("Add product error:", err);
        res.status(500).json({ error: "Failed to add product." });
    }
});

// ─── PUT - Update Product ──────────────────────────────────────────────────────
router.put("/:id", auth, adminOnly, async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Product not found." });

        // ✅ RECORD AUDIT LOG
        console.log("DEBUG: ATTEMPTING AUDIT LOG FOR UPDATE...", { admin: req.user?.id, email: req.user?.email });
        try {
            const logEntry = await AuditLog.create({
                adminId: req.user.id,
                action: "Update Product",
                module: "Products",
                details: `Updated product: ${updated.title}`,
                ipAddress: req.ip || "0.0.0.0"
            });
            console.log("✅ AUDIT LOG CREATED:", logEntry._id);
        } catch (logErr) {
            console.error("❌ AUDIT LOG CREATION FAILED:", logErr);
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update product." });
    }
});

// ─── DELETE - Delete Product ───────────────────────────────────────────────────
router.delete("/:id", auth, adminOnly, async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Product not found." });

        // ✅ RECORD AUDIT LOG
        await AuditLog.create({
            adminId: req.user.id,
            action: "Delete Product",
            module: "Products",
            details: `Deleted product: ${deleted.title}`,
            ipAddress: req.ip || "0.0.0.0"
        });

        res.json({ message: "Product deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete product." });
    }
});

// ─── PATCH - Update stock/sold after order ────────────────────────────────────
router.patch("/:id/sold", async (req, res) => {
    try {
        const { quantity } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found." });

        product.sold = (product.sold || 0) + Number(quantity);
        product.stock = Math.max(0, product.stock - Number(quantity));
        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: "Failed to update product stock." });
    }
});

export default router;
