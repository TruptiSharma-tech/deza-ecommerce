import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductDetails.css";
import { FaHeart, FaRegHeart, FaShoppingCart, FaStar } from "react-icons/fa";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);

  // ⭐ Review states
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState("");

  // ⭐ Image slider state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ✅ Logged in user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // ✅ Fetch product from Admin Panel (localStorage)
  useEffect(() => {
    const storedProducts =
      JSON.parse(localStorage.getItem("dezaProducts")) || [];

    const found = storedProducts.find((p) => String(p.id) === String(id));

    if (found) {
      // Ensure images always exists
      if (!found.images || found.images.length === 0) {
        found.images = [found.image];
      }

      setProduct(found);

      // default size
      if (found?.sizes?.length > 0) {
        setSelectedSize(found.sizes[0]);
      }
    }

    // Wishlist check
    const wishlist = JSON.parse(localStorage.getItem("deza_wishlist")) || [];
    const exists = wishlist.find((x) => String(x.id) === String(id));
    setWish(!!exists);

    setCurrentImageIndex(0);
  }, [id]);

  // ❌ If product not found
  if (!product) {
    return (
      <div className="product-not-found">
        <h2>❌ Product Not Found</h2>
        <button onClick={() => navigate("/shop")}>Back to Shop</button>
      </div>
    );
  }

  // ✅ Price by Size Logic
  const getPriceBySize = () => {
    // If you store size-wise prices like { "25ml": 999, "50ml": 1700 }
    if (product.sizePrices && selectedSize) {
      return Number(product.sizePrices[selectedSize] || product.price);
    }

    // default
    return Number(product.price);
  };

  const finalPrice = getPriceBySize();

  // ✅ Check login before actions
  const checkLogin = () => {
    if (!currentUser) {
      alert("⚠️ Please Login First to Continue!");
      navigate("/login");
      return false;
    }
    return true;
  };

  // ⭐ Add to cart
  const handleAddToCart = () => {
    if (!checkLogin()) return;

    const cart = JSON.parse(localStorage.getItem("deza_cart")) || [];

    const existingIndex = cart.findIndex(
      (x) =>
        String(x.id) === String(product.id) && x.selectedSize === selectedSize,
    );

    if (existingIndex !== -1) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.title, // ✅ FIXED
        price: finalPrice, // ✅ FIXED
        image: product.images?.[0],
        selectedSize,
        qty,
      });
    }

    localStorage.setItem("deza_cart", JSON.stringify(cart));
    alert("✅ Added to Cart!");
  };

  // ⭐ Buy Now
  const handleBuyNow = () => {
    if (!checkLogin()) return;

    handleAddToCart();
    navigate("/cart");
  };

  // ⭐ WhatsApp Order Button
  const handleWhatsAppOrder = () => {
    if (!checkLogin()) return;

    const phoneNumber = "919082710359";

    const productImage = product.images?.[0] || "";

    const message = `Hello DEZA 💛 I want to place an order.

🛍 Product: ${product.title}
📦 Size: ${selectedSize}
🔢 Quantity: ${qty}
💰 Price: ₹${finalPrice}

🖼 Product Image: ${productImage}

Please confirm my order.`;

    const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(
      message,
    )}`;

    window.open(url, "_blank");
  };

  // ⭐ Wishlist toggle
  const handleWishlist = () => {
    if (!checkLogin()) return;

    const wishlist = JSON.parse(localStorage.getItem("deza_wishlist")) || [];
    const exists = wishlist.find((x) => String(x.id) === String(product.id));

    if (exists) {
      const updated = wishlist.filter(
        (x) => String(x.id) !== String(product.id),
      );
      localStorage.setItem("deza_wishlist", JSON.stringify(updated));
      setWish(false);
      alert("💔 Removed from Wishlist!");
      return;
    }

    wishlist.push(product);
    localStorage.setItem("deza_wishlist", JSON.stringify(wishlist));
    setWish(true);
    alert("❤️ Added to Wishlist!");
  };

  // ⭐ Add Review
  const handleAddReview = () => {
    if (!checkLogin()) return;

    if (!comment || stars === 0) {
      alert("⚠️ Please fill all review fields");
      return;
    }

    const stored = JSON.parse(localStorage.getItem("dezaProducts")) || [];

    const updatedProducts = stored.map((p) => {
      if (String(p.id) === String(product.id)) {
        const newReview = {
          id: Date.now(),
          userName: currentUser?.name || "User",
          comment,
          stars,
        };

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

    const updatedProduct = updatedProducts.find(
      (p) => String(p.id) === String(product.id),
    );
    setProduct(updatedProduct);

    setComment("");
    setStars(0);
    setHoverStars(0);

    alert("✅ Review added!");
  };

  // ⭐ Delete Review
  const handleDeleteReview = (reviewId) => {
    const stored = JSON.parse(localStorage.getItem("dezaProducts")) || [];

    const updatedProducts = stored.map((p) => {
      if (String(p.id) === String(product.id)) {
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

    const updatedProduct = updatedProducts.find(
      (p) => String(p.id) === String(product.id),
    );
    setProduct(updatedProduct);

    alert("🗑 Review deleted!");
  };

  return (
    <div className="pd-page">
      {/* ✅ PRODUCT NAME ON TOP */}
      <h1 className="pd-top-title">{product.title}</h1>

      <div className="pd-card">
        {/* ⭐ Product Image Slider */}
        <div className="pd-img">
          <img
            src={product.images?.[currentImageIndex]}
            alt={product.title}
            className="main-image"
          />

          <div className="thumbnail-images" style={{ marginTop: "10px" }}>
            {(product.images || []).map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${product.title}-${index}`}
                onClick={() => setCurrentImageIndex(index)}
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "cover",
                  marginRight: "5px",
                  border:
                    index === currentImageIndex
                      ? "2px solid #d4af37"
                      : "1px solid #ccc",
                  cursor: "pointer",
                  borderRadius: "5px",
                }}
              />
            ))}
          </div>
        </div>

        {/* ⭐ Product Info */}
        <div className="pd-info">
          <p className="pd-brand">{product.brand || "DEZA Luxury"}</p>

          {/* ⭐ Average Rating */}
          <h2 style={{ margin: "5px 0" }}>
            {Array.from({ length: 5 }, (_, i) => (
              <FaStar
                key={i}
                color={i < Math.round(product.rating || 0) ? "#ffd369" : "#555"}
              />
            ))}{" "}
            <span style={{ color: "#d4af37", fontWeight: "bold" }}>
              ({product.ratingCount || 0} Reviews)
            </span>
          </h2>

          {/* ✅ Dynamic Price */}
          <p className="pd-price">₹{finalPrice}</p>

          <p className="pd-desc">
            {product.description ||
              "A premium luxury fragrance crafted to leave an unforgettable impression."}
          </p>

          {/* ⭐ Size Selection */}
          <div className="pd-sizes">
            <h4>Select Size</h4>
            <div className="size-buttons">
              {product.sizes?.map((s) => (
                <button
                  key={s}
                  className={selectedSize === s ? "active" : ""}
                  onClick={() => setSelectedSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ⭐ Quantity */}
          <div className="pd-qty">
            <h4>Quantity</h4>
            <div className="qty-box">
              <button onClick={() => setQty(qty > 1 ? qty - 1 : 1)}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)}>+</button>
            </div>
          </div>

          {/* ⭐ Actions */}
          <div className="pd-actions">
            <button className="cart-btn" onClick={handleAddToCart}>
              <FaShoppingCart /> Add to Cart
            </button>

            <button className="buy-btn" onClick={handleBuyNow}>
              Buy Now
            </button>

            <button className="wish-btn" onClick={handleWishlist}>
              {wish ? <FaHeart /> : <FaRegHeart />} Wishlist
            </button>
          </div>

          {/* ✅ WHATSAPP ORDER BUTTON */}
          <button className="whatsapp-btn" onClick={handleWhatsAppOrder}>
            Order on WhatsApp 💬
          </button>

          <div className="pd-extra">
            <p>💛 100% Authentic DEZA Perfumes</p>
          </div>

          {/* ⭐ Review Section */}
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

            <textarea
              placeholder="Your Review"
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
                padding: "10px 20px",
                backgroundColor: "#d4af37",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Submit Review
            </button>

            {/* ⭐ Display Reviews */}
            <div className="reviews-list" style={{ marginTop: "20px" }}>
              {(product.reviews || []).map((r) => (
                <div
                  key={r.id}
                  style={{
                    marginBottom: "10px",
                    borderBottom: "1px solid #ccc",
                    paddingBottom: "5px",
                  }}
                >
                  <strong>{r.userName}</strong> -{" "}
                  {Array.from({ length: 5 }, (_, i) => (
                    <FaStar key={i} color={i < r.stars ? "#ffd369" : "#555"} />
                  ))}
                  <p>{r.comment}</p>
                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    style={{
                      color: "red",
                      cursor: "pointer",
                      fontSize: "12px",
                      background: "none",
                      border: "none",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          {!currentUser && (
            <p style={{ marginTop: "15px", color: "red" }}>
              ⚠️ Please Login to Add to Cart / Buy / WhatsApp Order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
