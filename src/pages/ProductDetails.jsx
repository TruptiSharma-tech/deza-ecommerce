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

  const handleOrderNow = () => {
    handleAddToCart();
  };

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

  const handleDeleteReview = (reviewId) => {
    const stored = JSON.parse(localStorage.getItem("dezaProducts")) || [];
    const updatedProducts = stored.map((p) => {
      if (p.id === product.id) {
        const updatedReviews = (p.reviews || []).filter(
          (r) => r.id !== reviewId,
        );
        const avgRating = updatedReviews.length
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
            Category: <span>{product.category}</span>
          </p>

          <p className="details-fragrance">
            <b>Fragrance Notes:</b> {product.fragranceNotes || "Not available"}
          </p>
          <p className="details-delivery">
            <b>Estimated Delivery:</b> 7-10 days
          </p>

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

          {/* ⭐ Review section (optional, keep your previous code) */}
        </div>
      </div>
    </div>
  );
}
