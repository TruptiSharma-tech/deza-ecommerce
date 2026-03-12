import express from "express";
import Review from "../models/Review.js";
import Product from "../models/Product.js";

const router = express.Router();

// ─── GET Reviews by Product ID ─────────────────────────────────────────────────
router.get("/product/:productId", async (req, res) => {
    try {
        const reviews = await Review.find({
            productId: { $in: [req.params.productId, String(req.params.productId)] }
        }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch reviews." });
    }
});

// ─── GET All Reviews (Admin) ───────────────────────────────────────────────────
router.get("/", async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch reviews." });
    }
});

// ─── POST - Submit Review ──────────────────────────────────────────────────────
router.post("/", async (req, res) => {
    try {
        const { productId, userId, userName, userEmail, rating, comment } = req.body;

        if (!productId || !rating) {
            return res.status(400).json({ error: "ProductId and rating are required." });
        }

        const newReview = await Review.create({
            productId,
            userId: userId || null,
            userName: userName || "Anonymous",
            userEmail: userEmail || "",
            rating: Number(rating),
            comment: comment || "",
            date: new Date().toLocaleString(),
        });

        // ✅ RE-CALCULATE AVG RATING FOR PRODUCT (Using Universal ID Matching)
        const allReviews = await Review.find({
            productId: { $in: [productId, String(productId)] }
        });

        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = totalRating / allReviews.length;

        await Product.findByIdAndUpdate(productId, {
            rating: Number(avgRating.toFixed(1)),
            numReviews: allReviews.length
        });

        res.status(201).json(newReview);
    } catch (err) {
        res.status(500).json({ error: "Failed to submit review." });
    }
});

// ─── DELETE Review (Admin) ─────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Review.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Review not found." });
        res.json({ message: "Review deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete review." });
    }
});

export default router;
