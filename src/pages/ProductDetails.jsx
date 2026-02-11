// ... keep all your imports same
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductDetails.css";
import { getProducts } from "../utils/productDB";
import {
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaStar,
  FaTrash,
} from "react-icons/fa";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Review states
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [userName, setUserName] = useState("");
  const [comment, setComment] = useState("");

  // ✅ LOAD PRODUCT
  useEffect(() => {
    const products = getProducts();
    const found = products.find((p) => String(p.id) === String(id));
    setProduct(found);

    if (found) {
      setMainImage(found.images?.[0] || found.image);
      setSelectedSize(found.sizes?.[0] || "");
      const wishlist = JSON.parse(localStorage.getItem("dezaWishlist")) || [];
      setIsWishlisted(
        !!wishlist.find((item) => String(item.id) === String(found.id)),
      );
    }
  }, [id]);

  // ✅ ADD TO CART
  const handleAddToCart = () => {
    if (!selectedSize) return alert("Please select a size first 😭");

    const cart = JSON.parse(localStorage.getItem("deza_cart")) || [];
    const existing = cart.find(
      (item) =>
        String(item.id) === String(product.id) &&
        item.selectedSize === selectedSize,
    );

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        image: mainImage,
        price: product.price,
        selectedSize: selectedSize,
        qty: 1,
      });
    }

    localStorage.setItem("deza_cart", JSON.stringify(cart));
    navigate("/cart");
  };

  // ✅ ORDER NOW
  const handleOrderNow = () => {
    handleAddToCart();
  };

  // ✅ TOGGLE WISHLIST
  const handleWishlistToggle = () => {
    const wishlist = JSON.parse(localStorage.getItem("dezaWishlist")) || [];
    const exists = wishlist.find(
      (item) => String(item.id) === String(product.id),
    );

    if (exists) {
      const updated = wishlist.filter(
        (item) => String(item.id) !== String(product.id),
      );
      localStorage.setItem("dezaWishlist", JSON.stringify(updated));
      setIsWishlisted(false);
      alert("Removed from Wishlist 💔");
    } else {
      wishlist.push({ ...product, image: mainImage });
      localStorage.setItem("dezaWishlist", JSON.stringify(wishlist));
      setIsWishlisted(true);
      alert("Added to Wishlist ❤️");
    }
  };

  // ✅ ADD REVIEW
  const handleAddReview = () => {
    if (!userName || !comment || stars === 0) {
      return alert("Please fill all fields and select a star rating!");
    }

    const newReview = {
      id: Date.now(),
      name: userName,
      comment,
      stars,
      date: new Date().toLocaleString(),
    };

    const stored = JSON.parse(localStorage.getItem("dezaProducts")) || [];
    const updatedProducts = stored.map((p) => {
      if (p.id === product.id) {
        const updatedReviews = [...(p.reviews || []), newReview];
        const avgRating =
          updatedReviews.reduce((acc, r) => acc + r.stars, 0) /
          updatedReviews.length;
        return {
          ...p,
          reviews: updatedReviews,
          rating: avgRating,
          ratingCount: updatedReviews.length,
        };
      }
      return p;
    });

    localStorage.setItem("dezaProducts", JSON.stringify(updatedProducts));
    const updatedProduct = updatedProducts.find((p) => p.id === product.id);
    setProduct(updatedProduct);

    setUserName("");
    setComment("");
    setStars(0);
    setHoverStars(0);
    alert("✅ Review added!");
  };

  // ✅ DELETE REVIEW
  const handleDeleteReview = (reviewId) => {
    const stored = JSON.parse(localStorage.getItem("dezaProducts")) || [];
    const updatedProducts = stored.map((p) => {
      if (p.id === product.id) {
        const updatedReviews = (p.reviews || []).filter(
          (r) => r.id !== reviewId,
        );
        const avgRating =
          updatedReviews.length > 0
            ? updatedReviews.reduce((acc, r) => acc + r.stars, 0) /
              updatedReviews.length
            : 0;
        return {
          ...p,
          reviews: updatedReviews,
          rating: avgRating,
          ratingCount: updatedReviews.length,
        };
      }
      return p;
    });

    localStorage.setItem("dezaProducts", JSON.stringify(updatedProducts));
    const updatedProduct = updatedProducts.find((p) => p.id === product.id);
    setProduct(updatedProduct);
    alert("❌ Review deleted!");
  };

  if (!product)
    return (
      <div style={{ color: "white", padding: "100px", textAlign: "center" }}>
        <h2>Product not found 😭</h2>
        <button
          style={{
            marginTop: "20px",
            padding: "12px 22px",
            borderRadius: "10px",
            border: "none",
            background: "#D4AF37",
            color: "#1A1A1A",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          onClick={() => navigate("/shop")}
        >
          Back to Shop
        </button>
      </div>
    );

  return (
    <div className="details-page">
      <div className="details-container">
        {/* LEFT IMAGE */}
        <div className="details-left">
          <img
            src={mainImage}
            alt={product.name}
            className="details-main-img"
          />
          <div className="details-thumbnails">
            {(product.images?.length ? product.images : [product.image]).map(
              (img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt="thumb"
                  className={
                    mainImage === img ? "thumb-img active-thumb" : "thumb-img"
                  }
                  onClick={() => setMainImage(img)}
                />
              ),
            )}
          </div>
        </div>

        {/* RIGHT DETAILS */}
        <div className="details-right">
          <div className="title-row">
            <h1 className="details-title">{product.name}</h1>
            <button
              className="wishlist-icon-btn"
              onClick={handleWishlistToggle}
            >
              {isWishlisted ? (
                <FaHeart className="heart-icon filled" />
              ) : (
                <FaRegHeart className="heart-icon" />
              )}
            </button>
          </div>

          <p className="details-price">₹{product.price}</p>
          <p className="details-desc">{product.description}</p>
          <p className="details-cat">
            Category:{" "}
            <span>
              {product.category === "deza-original"
                ? "DEZA Original"
                : "Recreational Perfume"}
            </span>
          </p>

          {/* SIZE SELECT */}
          {product.sizes?.length > 0 && (
            <div className="size-box">
              <label>Select Size:</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                {product.sizes.map((size, idx) => (
                  <option key={idx} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* BUTTONS */}
          <div className="details-btn-group">
            <button className="cart-btn" onClick={handleAddToCart}>
              <FaShoppingCart className="btn-icon" /> Add to Cart
            </button>
            <button className="order-btn" onClick={handleOrderNow}>
              Order Now
            </button>
          </div>

          <button className="back-btn" onClick={() => navigate("/shop")}>
            Back to Shop
          </button>

          {/* ⭐ RATING SECTION */}
          <div className="review-section" style={{ marginTop: "30px" }}>
            <h3 style={{ color: "#d4af37" }}>Rate this Product</h3>
            <div
              style={{
                display: "flex",
                gap: "5px",
                fontSize: "24px",
                marginTop: "5px",
              }}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <FaStar
                  key={i}
                  color={i < (hoverStars || stars) ? "#ffd369" : "#555"}
                  style={{ cursor: "pointer", transition: "0.2s" }}
                  onMouseEnter={() => setHoverStars(i + 1)}
                  onMouseLeave={() => setHoverStars(0)}
                  onClick={() => setStars(i + 1)}
                />
              ))}
            </div>
            <input
              type="text"
              placeholder="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{
                marginTop: "10px",
                padding: "10px",
                borderRadius: "10px",
                width: "100%",
              }}
            />
            <textarea
              placeholder="Write a review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                marginTop: "10px",
                padding: "10px",
                borderRadius: "10px",
                width: "100%",
              }}
            />
            <button
              onClick={handleAddReview}
              style={{
                marginTop: "10px",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background: "#d4af37",
                color: "#1a1a1a",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Submit Review
            </button>
          </div>

          {/* SHOW REVIEWS */}
          {product.reviews?.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ color: "#d4af37" }}>Customer Reviews</h3>
              {product.reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    borderBottom: "1px solid #444",
                    padding: "10px 0",
                    position: "relative",
                  }}
                >
                  <p style={{ color: "#f9f7f2", fontWeight: "600" }}>
                    {r.name}
                  </p>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <FaStar
                        key={i}
                        color={i < r.stars ? "#ffd369" : "#555"}
                      />
                    ))}
                  </div>
                  <p style={{ color: "#ddd", marginTop: "5px" }}>{r.comment}</p>
                  <p style={{ fontSize: "12px", color: "#aaa" }}>{r.date}</p>
                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    style={{
                      position: "absolute",
                      right: "0",
                      top: "10px",
                      background: "red",
                      border: "none",
                      color: "white",
                      padding: "5px 10px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
