import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./ProductDetails.css";
import { FaHeart, FaRegHeart, FaShoppingCart, FaStar } from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa";
import { apiGetProduct, apiGetProductReviews, apiSubmitReview } from "../utils/api";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);

  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 🚚 Delivery
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState(
    "Estimated Delivery: 7 - 10 Business Days",
  );

  const [reviews, setReviews] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    loadProductData();
  }, [id]);

  const loadProductData = async () => {
    try {
      // 1. Fetch Product
      const data = await apiGetProduct(id);
      if (data) {
        if (!data.images || data.images.length === 0) {
          data.images = [data.image];
        }
        setProduct(data);
        if (data?.sizePrices?.length > 0) {
          setSelectedSize(data.sizePrices[0].size);
        }
      }

      // 2. Fetch Reviews (Optional - don't crash if it fails)
      try {
        const revs = await apiGetProductReviews(id);
        setReviews(revs || []);
      } catch (revErr) {
        console.error("Failed to load reviews:", revErr);
        setReviews([]);
      }

      // 3. Wishlist check (Optional)
      try {
        const wishlist = JSON.parse(localStorage.getItem("deza_wishlist")) || [];
        const exists = wishlist.find((x) => String(x?._id) === String(id));
        setWish(!!exists);
      } catch (wishErr) {
        console.error("Wishlist check failed:", wishErr);
      }

      setCurrentImageIndex(0);
    } catch (err) {
      console.error("Error loading product data:", err);
      setProduct(null);
    }
  };

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>❌ Product Not Found</h2>
        <button onClick={() => navigate("/shop")}>Back to Shop</button>
      </div>
    );
  }

  // ✅ FIXED PRICE LOGIC
  const getPriceBySize = () => {
    if (product.sizePrices && selectedSize) {
      const sizeObj = product.sizePrices.find((sp) => sp.size === selectedSize);
      if (sizeObj) return Number(sizeObj.price);
    }
    return Number(product.price) || 0;
  };

  const finalPrice = getPriceBySize();

  const checkLogin = () => {
    if (!currentUser) {
      toast.error("Please Login First to Continue!");
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!checkLogin()) return;

    const cart = JSON.parse(localStorage.getItem("deza_cart")) || [];

    const existingIndex = cart.findIndex(
      (x) =>
        String(x._id) === String(product._id) && x.selectedSize === selectedSize,
    );

    if (existingIndex !== -1) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        _id: product._id,
        name: product.title,
        price: finalPrice,
        image: product.images?.[0],
        selectedSize,
        qty,
      });
    }

    localStorage.setItem("deza_cart", JSON.stringify(cart));
    // ✅ Trigger navbar update
    window.dispatchEvent(new Event("cartUpdate"));
    toast.success("Added to Cart! 🛒");
  };

  const handleBuyNow = () => {
    if (!checkLogin()) return;
    handleAddToCart();
    navigate("/cart");
  };

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

  const handleWishlist = () => {
    if (!checkLogin()) return;

    const wishlist = JSON.parse(localStorage.getItem("deza_wishlist")) || [];
    const exists = wishlist.find((x) => String(x._id) === String(product._id));

    if (exists) {
      const updated = wishlist.filter(
        (x) => String(x._id) !== String(product._id),
      );
      localStorage.setItem("deza_wishlist", JSON.stringify(updated));
      setWish(false);
      toast.success("Removed from Wishlist! 💔");
      return;
    }

    wishlist.push(product);
    localStorage.setItem("deza_wishlist", JSON.stringify(wishlist));
    setWish(true);
    toast.success("Added to Wishlist! ❤️");
  };

  // ⭐ Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ⭐ Submit Review
  const handleReviewSubmit = async () => {
    if (!currentUser) {
      toast.error("Please login to submit review");
      navigate("/login");
      return;
    }

    if (stars === 0) {
      toast.error("Please select rating");
      return;
    }

    try {
      const payload = {
        productId: product._id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        rating: stars,
        comment,
      };

      await apiSubmitReview(payload);

      // Reload reviews and product data
      loadProductData();

      setStars(0);
      setComment("");
      setPreviewImage(null);

      toast.success("Review Submitted! ⭐");
    } catch (err) {
      console.error("Review failed:", err);
      toast.error("Failed to submit review. Please try again.");
    }
  };

  const checkDelivery = () => {
    if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
      setDeliveryMessage("❌ Please enter a valid 6-digit pincode.");
      return;
    }

    // Dynamic Delivery Estimation Logic
    const firstDigit = pincode[0];

    if (["4", "5"].includes(firstDigit)) {
      setDeliveryMessage("🚚 Fast Delivery: 4 - 6 Business Days");
    } else if (["1", "2", "3", "6"].includes(firstDigit)) {
      setDeliveryMessage("📦 Standard Delivery: 6 - 8 Business Days");
    } else {
      setDeliveryMessage("🌍 Regional Delivery: 8 - 10 Business Days");
    }
  };

  return (
    <div className="pd-page">
      <h1 className="pd-top-title">{product.title}</h1>

      <div className="pd-card">
        <div className="pd-img-container">
          <div className="pd-img">
            <img
              src={product.images?.[currentImageIndex]}
              alt={product.title}
              className="main-image"
            />
          </div>

          {/* Thumbnails / POV Gallery */}
          {product.images?.length > 1 && (
            <div className="pd-thumbnails">
              {product.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`thumb-item ${currentImageIndex === idx ? "active" : ""}`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img src={img} alt={`pov-${idx}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          <p className="pd-brand">{product.brand || "DEZA Luxury"}</p>

          <h2>
            {Array.from({ length: 5 }, (_, i) => (
              <FaStar
                key={i}
                color={i < Math.round(product.rating || 0) ? "#ffd369" : "#555"}
              />
            ))}{" "}
            ({product.ratingCount || 0} Reviews)
          </h2>

          <p className="pd-price">₹{finalPrice}</p>

          {/* Description & Fragrance Notes */}
          <div className="pd-content-wrapper">
            <div className="pd-section-group">
              <h3>Description</h3>
              <p className="deza-raw-text">
                {product.description || "A masterfully balanced luxury composition."}
              </p>
            </div>

            <div className="pd-section-group">
              <h3>Fragrance Notes</h3>
              <p className="deza-raw-text">
                {product.fragrance || "No notes provided."}
              </p>
            </div>
          </div>

          {/* Delivery Checker */}
          <div className="pd-delivery-checker">
            <h4><span className="truck-icon">🚚</span> Delivery Details</h4>
            <p className="est-standard">Estimated Delivery: 7 - 10 Days (Standard)</p>
            <div className="pincode-wrapper">
              <input
                type="text"
                placeholder="Enter Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <button onClick={checkDelivery}>Check</button>
            </div>
            {deliveryMessage && <div className={`delivery-response ${deliveryMessage.includes("❌") ? "err" : ""}`}>{deliveryMessage}</div>}
          </div>

          {/* Size */}
          <div className="pd-sizes">
            <h4>Select Size</h4>
            <div className="size-buttons">
              {product.sizePrices?.map((sp) => (
                <button
                  key={sp.size}
                  className={selectedSize === sp.size ? "active" : ""}
                  onClick={() => setSelectedSize(sp.size)}
                >
                  {sp.size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="pd-qty">
            <h4>Quantity</h4>
            <div className="qty-box">
              <button onClick={() => setQty(qty > 1 ? qty - 1 : 1)}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)}>+</button>
            </div>
          </div>

          <div className="pd-actions">
            <button className="cart-btn" onClick={handleAddToCart}>
              <FaShoppingCart /> Add to Cart
            </button>

            <button className="buy-btn" onClick={handleBuyNow}>
              Buy Now
            </button>

            <div className="wish-whatsapp">
              <button className="wish-btn" onClick={handleWishlist}>
                {wish ? <FaHeart /> : <FaRegHeart />} Wishlist
              </button>

              <button className="whatsapp-btn" onClick={handleWhatsAppOrder}>
                <FaWhatsapp className="wa-icon" />
                WhatsApp
              </button>
            </div>
          </div>

          {/* ⭐ REVIEW SECTION */}
          <div className="pd-review-section">
            <h3>Rate this Product</h3>

            {/* STAR SELECT */}
            <div style={{ marginBottom: "10px" }}>
              {Array.from({ length: 5 }, (_, i) => (
                <FaStar
                  key={i}
                  size={22}
                  style={{ cursor: "pointer", marginRight: "5px" }}
                  color={i < (hoverStars || stars) ? "#ffd369" : "#555"}
                  onMouseEnter={() => setHoverStars(i + 1)}
                  onMouseLeave={() => setHoverStars(0)}
                  onClick={() => setStars(i + 1)}
                />
              ))}
            </div>

            {/* COMMENT */}
            <textarea
              placeholder="Write your review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            />

            {/* IMAGE UPLOAD */}
            <input type="file" accept="image/*" onChange={handleImageUpload} />

            {previewImage && (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={previewImage}
                  alt="preview"
                  style={{ width: "100px", borderRadius: "8px" }}
                />
              </div>
            )}

            <button
              onClick={handleReviewSubmit}
              style={{
                marginTop: "10px",
                padding: "10px 15px",
                background: "#d4af37",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Submit Review
            </button>

            {/* SHOW REVIEWS */}
            <div style={{ marginTop: "25px" }}>
              {reviews.map((r, index) => (
                <div
                  key={index}
                  style={{
                    borderBottom: "1px solid #333",
                    paddingBottom: "15px",
                    marginBottom: "15px",
                  }}
                >
                  <strong>{r.userName}</strong>

                  <div>
                    {Array.from({ length: 5 }, (_, i) => (
                      <FaStar
                        key={i}
                        size={14}
                        color={i < r.rating ? "#ffd369" : "#555"}
                      />
                    ))}
                  </div>

                  <p>{r.comment}</p>

                  <small style={{ opacity: 0.6 }}>{new Date(r.createdAt).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
