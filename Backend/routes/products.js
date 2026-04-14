import express from "express";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
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
        const { category, brand, featured, page = 1, limit = 20 } = req.query;
        let query = { isArchived: false };
        if (req.query.includeArchived === "true") delete query.isArchived;

        if (category) query.category = category;
        if (brand) query.brand = brand;
        if (featured) query.isFeatured = featured === "true";
        if (req.query.isActive) query.isActive = req.query.isActive === "true";

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find(query)
            .populate("category brand")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(query);

        // 🚀 OPTIMIZED: Remove N+1 query. Use existing rating in model.
        // Ratings are updated when reviews are submitted in reviewRoutes.
        const updatedProducts = products.map((p) => {
            const obj = p.toObject();
            obj.image = obj.mainImage;
            // Fallback for rating if it doesn't exist
            if (obj.rating === undefined) obj.rating = 0;
            if (obj.numReviews === undefined) obj.numReviews = 0;
            return obj;
        });

        res.json({
            products: updatedProducts,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch products." });
    }
});

// ─── GET Single Product ────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let product = null;

        // Smart Lookup: Detect if ID is a valid MongoDB ObjectId or a Slug
        const isValidId = id.match(/^[0-9a-fA-F]{24}$/);

        if (isValidId) {
            product = await Product.findById(id).populate("category brand");
        }

        if (!product) {
            // Try by slug (case-insensitive)
            product = await Product.findOne({
                slug: { $regex: new RegExp(`^${id}$`, "i") }
            }).populate("category brand");
        }

        if (!product) {
            // Final attempt: Search by title if it's an exact match
            product = await Product.findOne({
                title: { $regex: new RegExp(`^${id.replace(/-/g, " ")}$`, "i") }
            }).populate("category brand");
        }

        if (!product) return res.status(404).json({ error: "Product not found." });

        // 🔄 SELF-HEAL: Re-calculate rating on fetch to ensure accuracy
        // Search by both string ID and ObjectId to handle mixed formats
        const allReviews = await Review.find({
            productId: { $in: [product._id, String(product._id)] }
        });

        if (allReviews.length > 0) {
            const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            product.rating = Number(avgRating.toFixed(1));
            product.numReviews = allReviews.length;
            await product.save();
        } else {
            // Reset if no reviews found
            product.rating = 0;
            product.numReviews = 0;
            await product.save();
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

        // ✅ Validate stock is genuinely > 0
        if (stock !== undefined && Number(stock) <= 0) {
            return res.status(400).json({ error: "Stock must be greater than 0." });
        }

        // ✅ Validate size prices — price must be > 0, size must not be 0
        if (Array.isArray(sizePrices)) {
            for (const sp of sizePrices) {
                const parsedSize = parseFloat(sp.size);
                if (!sp.size || sp.size.trim() === "" || (!isNaN(parsedSize) && parsedSize <= 0)) {
                    return res.status(400).json({ error: "Size cannot be empty, zero, or negative." });
                }
                if (Number(sp.price) <= 0) {
                    return res.status(400).json({ error: `Price for size '${sp.size}' must be greater than 0.` });
                }
            }
        }

        const newProduct = await Product.create({
            title: title.trim(),
            description: description || "",
            sku: sku || `DZ-${Date.now()}`,
            fragrance: fragrance || "",
            categories: req.body.categories || [],
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

        if (req.body.stock !== undefined && Number(req.body.stock) <= 0) {
            return res.status(400).json({ error: "Stock must be greater than 0." });
        }

        if (Array.isArray(req.body.sizePrices)) {
            for (const sp of req.body.sizePrices) {
                const parsedSize = parseFloat(sp.size);
                if (!sp.size || sp.size.trim() === "" || (!isNaN(parsedSize) && parsedSize <= 0)) {
                    return res.status(400).json({ error: "Size cannot be empty, zero, or negative." });
                }
                if (Number(sp.price) <= 0) {
                    return res.status(400).json({ error: `Price for size '${sp.size}' must be greater than 0.` });
                }
            }
        }

        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Product not found." });

        await logAdminAction(req.user.id, "Update Product", "Products", `Updated: ${updated.title}`, req.ip);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update product." });
    }
});

// ─── DELETE - Permanent Delete Product ──────────────────────────────────────────
router.delete("/:id/permanent", auth, adminOnly, async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Product not found." });

        await logAdminAction(req.user.id, "DELETE Product", "Products", `Permanently Deleted: ${deleted.title}`, req.ip);
        res.json({ message: "Product permanently deleted." });
    } catch (err) {
        console.error("Delete product error:", err);
        res.status(500).json({ error: "Failed to delete product." });
    }
});

// ─── PATCH - Archive Product ──────────────────────────────────────────────────
router.patch("/:id/archive", auth, adminOnly, async (req, res) => {
    try {
        const archived = await Product.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
        if (!archived) return res.status(404).json({ error: "Product not found." });

        await logAdminAction(req.user.id, "Archive Product", "Products", `Archived: ${archived.title}`, req.ip);
        res.json({ message: "Product archived successfully.", product: archived });
    } catch (err) {
        console.error("Archive product error:", err);
        res.status(500).json({ error: "Failed to archive product." });
    }
});

// ─── PATCH - Unarchive Product ────────────────────────────────────────────────
router.patch("/:id/unarchive", auth, adminOnly, async (req, res) => {
    try {
        const unarchived = await Product.findByIdAndUpdate(req.params.id, { isArchived: false }, { new: true });
        if (!unarchived) return res.status(404).json({ error: "Product not found." });

        await logAdminAction(req.user.id, "Unarchive Product", "Products", `Unarchived: ${unarchived.title}`, req.ip);
        res.json({ message: "Product unarchived successfully.", product: unarchived });
    } catch (err) {
        console.error("Unarchive product error:", err);
        res.status(500).json({ error: "Failed to unarchive product." });
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
