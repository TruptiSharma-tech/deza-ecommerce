import express from "express";
import Product from "../models/Product.js";
import AuditLog from "../models/AuditLog.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Helper for logging
const logAdminAction = async (adminId, action, module, details, ip) => {
    try {
        await AuditLog.create({ adminId, action, module, details, ipAddress: ip || "0.0.0.0" });
    } catch (err) {
        console.error(`FAILED TO LOG ${action}:`, err);
    }
};

// ─── GET All Products ──────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
    try {
        const { category, brand, featured } = req.query;
        let query = { isActive: true };

        if (category) query.category = category;
        if (brand) query.brand = brand;
        if (featured) query.isFeatured = featured === "true";

        const products = await Product.find(query)
            .populate("category brand")
            .sort({ createdAt: -1 });

        // Map field names for frontend compatibility (e.g., mainImage -> image)
        const mapped = products.map(p => {
            const obj = p.toObject();
            obj.image = obj.mainImage;
            return obj;
        });

        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch products." });
    }
});

// ─── GET Single Product ────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("category brand");
        if (!product) {
            // Try by slug
            const bySlug = await Product.findOne({ slug: req.params.id }).populate("category brand");
            if (!bySlug) return res.status(404).json({ error: "Product not found." });
            const obj = bySlug.toObject();
            obj.image = obj.mainImage;
            return res.json(obj);
        }
        const obj = product.toObject();
        obj.image = obj.mainImage;
        res.json(obj);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch product." });
    }
});

// ─── POST - Add Product ────────────────────────────────────────────────────────
router.post("/", auth, adminOnly, async (req, res) => {
    try {
        const {
            title, description, fragrance, category, brand, types,
            sizePrices, stock, images, image, discountPrice, sku, isFeatured
        } = req.body;

        if (!title || !sizePrices) {
            return res.status(400).json({ error: "Title and sizePrices are required." });
        }

        const newProduct = await Product.create({
            title: title.trim(),
            description: description || "",
            sku: sku || `DZ-${Date.now()}`,
            fragrance: fragrance || "",
            category: category || null,
            brand: brand || null,
            types: types || [],
            sizePrices: sizePrices || [],
            discountPrice: Number(discountPrice) || 0,
            stock: Number(stock) || 0,
            images: images || [],
            mainImage: image || (images && images[0]) || "",
            isFeatured: isFeatured || false,
        });

        await logAdminAction(req.user.id, "Add Product", "Products", `Added: ${title}`, req.ip);
        res.status(201).json(newProduct);
    } catch (err) {
        console.error("Add product error:", err);
        res.status(500).json({ error: "Failed to add product.", details: err.message });
    }
});

// ─── PUT - Update Product ──────────────────────────────────────────────────────
router.put("/:id", auth, adminOnly, async (req, res) => {
    try {
        // Map 'image' to 'mainImage' if present
        if (req.body.image) {
            req.body.mainImage = req.body.image;
        }

        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Product not found." });

        await logAdminAction(req.user.id, "Update Product", "Products", `Updated: ${updated.title}`, req.ip);
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

        await logAdminAction(req.user.id, "Delete Product", "Products", `Deleted: ${deleted.title}`, req.ip);
        res.json({ message: "Product deleted successfully." });
    } catch (err) {
        console.error("Delete product error:", err);
        res.status(500).json({ error: "Failed to delete product. It might be linked to other records." });
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
