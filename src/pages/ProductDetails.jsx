import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./ProductDetails.css";
import { FaHeart, FaRegHeart, FaShoppingCart, FaStar } from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa";
import { apiGetProduct, apiGetProductReviews, apiSubmitReview, apiCreateOrder, apiGetProfile } from "../utils/api";
import { useShop } from "../context/ShopContext";
import { getCart } from "../utils/userStorage";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateCart, wishlist: contextWishlist, updateWishlist, currentUser } = useShop();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);

  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("Estimated Delivery: 7 - 10 Business Days");
  const [isChecking, setIsChecking] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // WhatsApp Order Details State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [waName, setWaName] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [waAddress, setWaAddress] = useState("");


  useEffect(() => {
    // Update local 'wish' state when contextWishlist changes
    if (product) {
       const exists = contextWishlist.find((x) => String(x._id) === String(product._id));
       setWish(!!exists);
    }
  }, [contextWishlist, product]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const [data, revs] = await Promise.all([
        apiGetProduct(id).catch(() => null),
        apiGetProductReviews(id).catch(() => [])
      ]);

      if (data) {
        if (!data.images || data.images.length === 0) {
          data.images = [data.image];
        }
        setProduct(data);
        if (data?.sizePrices?.length > 0) {
          setSelectedSize(data.sizePrices[0].size);
        }
      } else {
        setProduct(null);
      }
      setReviews(revs || []);
      setCurrentImageIndex(0);
    } catch (err) {
      console.error("Error loading product:", err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductData();
  }, [id]);

  const getPriceBySize = () => {
    if (!product) return 0;
    if (product.sizePrices && selectedSize) {
      const sizeObj = product.sizePrices.find((sp) => sp.size === selectedSize);
      if (sizeObj) return Number(sizeObj.price);
    }
    return Number(product.price) || 0;
  };

  const finalPrice = product ? getPriceBySize() : 0;

  const checkLogin = () => {
    if (!currentUser) {
      toast.error("Please Login First to Continue!");
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    const email = currentUser?.email || null;
    const cart = getCart(email);
      
    const existingIndex = cart.findIndex((x) => String(x._id) === String(product._id) && x.selectedSize === selectedSize);
    if (existingIndex !== -1) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        _id: product._id,
        name: product.title,
        price: finalPrice,
        image: product.images?.[0] || product.image,
        selectedSize,
        qty,
      });
    }
    updateCart(cart);
    toast.success("Added to Cart! 🛒");
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  const handleWishlist = () => {
    const exists = contextWishlist.find((x) => String(x._id) === String(product._id));
    if (exists) {
      const updated = contextWishlist.filter((x) => String(x._id) !== String(product._id));
      updateWishlist(updated);
      toast.success("Removed from Wishlist! 💔");
      return;
    }
    const updated = [...contextWishlist, product];
    updateWishlist(updated);
    toast.success("Added to Wishlist! ❤️");
  };

  const handleWhatsAppOrder = async () => {
    if (!checkLogin()) return;
    const prevCheckout = JSON.parse(localStorage.getItem("checkoutInfo")) || {};
    const localAddrObj = prevCheckout.address;
    const localAddressStr = localAddrObj ? `${localAddrObj.street}, ${localAddrObj.area || ""}, ${localAddrObj.city}, ${localAddrObj.pincode}` : "";

    const cachedName = currentUser?.name || prevCheckout.name || "";
    const cachedContact = currentUser?.contact || currentUser?.phoneNumber || prevCheckout.phone || "";
    const cachedAddress = localAddressStr;

    if (cachedName && cachedContact && cachedAddress) {
      processInstantWhatsAppOrder(cachedName, cachedContact, cachedAddress);
      return;
    }

    try {
      const freshUser = await apiGetProfile();
      const dbAddr = freshUser?.addresses?.find(a => a.isDefault) || freshUser?.addresses?.[0];
      const dbAddressStr = dbAddr ? `${dbAddr.street}, ${dbAddr.area || ""}, ${dbAddr.city}, ${dbAddr.pincode}` : "";

      const name = freshUser?.name || cachedName;
      const contact = freshUser?.contact || freshUser?.phoneNumber || cachedContact;
      const address = dbAddressStr || cachedAddress;

      if (name && contact && address) {
        processInstantWhatsAppOrder(name, contact, address);
      } else {
        setWaName(name);
        setWaPhone(contact);
        setWaAddress(address);
        setShowWhatsAppModal(true);
      }
    } catch (err) {
      setWaName(cachedName);
      setWaPhone(cachedContact);
      setShowWhatsAppModal(true);
    }
  };

  const processInstantWhatsAppOrder = async (name, contact, address) => {
    setLoading(true);
    try {
      const orderPayload = {
        customerId: currentUser?._id,
        customerName: name,
        customerPhone: contact,
        customerEmail: currentUser?.email || "",
        items: [{
          _id: product._id,
          name: product.title,
          image: product.images?.[0] || product.image,
          selectedSize: selectedSize,
          price: finalPrice,
          qty: qty
        }],
        address: { street: address },
        totalPrice: finalPrice * qty,
        paymentMethod: "WhatsApp / COD",
        paymentStatus: "Pending",
        orderSource: "WhatsApp"
      };

      const newOrder = await apiCreateOrder(orderPayload);
      const orderNum = newOrder.orderNumber;

      const orderDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      const orderTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      const message = `*DEZA LUXURY ORDER* 💎\n\n` +
        `📦 *Order Details:*\n` +
        `--------------------------\n` +
        `*Order ID:* ${orderNum}\n` +
        `*Date:* ${orderDate}\n` +
        `*Time:* ${orderTime}\n\n` +
        `👤 *Customer Info:*\n` +
        `--------------------------\n` +
        `*Name:* ${name}\n` +
        `*Phone:* ${contact}\n` +
        `*Address:* ${address}\n\n` +
        `🛍 *Product Details:*\n` +
        `--------------------------\n` +
        `*Item:* ${product.title}\n` +
        `*Size:* ${selectedSize}\n` +
        `*Quantity:* ${qty}\n` +
        `*Total Amount:* ₹${(finalPrice * qty).toLocaleString("en-IN")}\n\n` +
        `🔗 *Product Link:* ${window.location.href}\n\n` +
        `*Note:* Please confirm availability and shipping estimated timeline.`;

      const merchantPhone = "919082710359";
      const waUrl = `https://api.whatsapp.com/send?phone=${merchantPhone}&text=${encodeURIComponent(message)}`;
      window.location.href = waUrl;
      toast.success("Order Tracked! Opening WhatsApp...");
    } catch (err) {
      toast.error("Order creation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmWhatsAppOrder = async (e) => {
    e.preventDefault();
    if (!waName || !waPhone || !waAddress) return toast.error("Please fill all details!");
    processInstantWhatsAppOrder(waName, waPhone, waAddress);
    setShowWhatsAppModal(false);
  };

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
      await apiSubmitReview({
        productId: product._id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        rating: stars,
        comment,
      });
      loadProductData();
      setStars(0);
      setComment("");
      setPreviewImage(null);
      toast.success("Review Submitted! ⭐");
    } catch (err) {
      toast.error("Failed to submit review.");
    }
  };

  const checkDelivery = async () => {
    if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
      setDeliveryMessage("❌ Please enter active 6-digit pincode.");
      return;
    }
    setIsChecking(true);
    setDeliveryMessage("⚡ Checking logistics from Mulund Hub...");
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      if (data[0].Status === "Success") {
        const details = data[0].PostOffice[0];
        const city = details.District;
        const state = details.State;
        let days = "5 - 8 Business Days";
        const pPrefix = pincode.substring(0, 3);
        const firstDigit = pincode[0];
        if (pincode === "400080") {
          days = "Same-day Express Delivery! 🚀";
        } else if (pPrefix === "400") {
          days = "1-2 Business Days";
        } else if (firstDigit === "4") {
          days = "2-3 Business Days";
        } else if (["3", "5", "6"].includes(firstDigit)) {
          days = "4-6 Business Days";
        }
        setDeliveryMessage(`📍 ${city}, ${state}: Expected in ${days}`);
      } else {
        setDeliveryMessage("❌ Service not available for this pincode.");
      }
    } catch (err) {
      setDeliveryMessage("❌ Error checking pincode.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="pd-page">
      <div className="pd-breadcrumb" onClick={() => navigate("/shop")}>
        ← Back to Boutique
      </div>

      {!product ? (
        <div className="pd-silent-status" style={{ textAlign: 'center', marginTop: '100px', width: '100%', display: 'flex', justifyContent: 'center' }}>
          {!loading && <p style={{ opacity: 0.6, fontSize: '18px', fontStyle: 'italic' }}>Exquisite fragrance not found.</p>}
        </div>
      ) : (
        <>
          <div className="pd-card">
            <div className="pd-img-container">
              <div className="pd-img">
                <img src={product.images?.[currentImageIndex]} alt={product.title} className="main-image" />
              </div>
              {product.images?.length > 1 && (
                <div className="pd-thumbnails">
                  {product.images.map((img, idx) => (
                    <div key={idx} className={`thumb-item ${currentImageIndex === idx ? "active" : ""}`} onClick={() => setCurrentImageIndex(idx)}>
                      <img src={img} alt={`pov-${idx}`} />
                    </div>
                  ))}
                </div>
              )}
              <div className="pd-rating-badge-under-img">
                <div className="pd-stars-row">
                  {Array.from({ length: 5 }, (_, i) => (
                    <FaStar key={i} size={22} color={i < Math.round(product.rating || 0) ? "#ffd369" : "rgba(255,255,255,0.15)"} />
                  ))}
                </div>
                <span className="pd-review-count">{product.rating || 0} ({product.numReviews || 0} Reviews)</span>
              </div>

              <div className="pd-delivery-checker-compact">
                <h5><span className="truck-icon">🚚</span> Check Availability</h5>
                <div className="pincode-wrapper-compact">
                  <input type="text" placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                  <button onClick={checkDelivery} disabled={isChecking}>
                    {isChecking ? "..." : "Check"}
                  </button>
                </div>
                {deliveryMessage && (
                  <div className={`delivery-response-compact ${deliveryMessage.includes("❌") ? "err" : ""} ${isChecking ? "calculating" : ""}`}>
                    {deliveryMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="pd-info">
              <div className="pd-header-top-row">
                <div className="pd-header-main-info">
                  <p className="pd-brand">{product.brand?.name || product.brand || "DEZA Luxury"}</p>
                  <h1 className="pd-main-name">{product.title}</h1>
                </div>
                <div className="pd-price-badge-combined">
                  <span className="pd-price-label">Exquisite Value</span>
                  <p className="pd-price">₹{finalPrice.toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="pd-content-wrapper-top">
                <div className="pd-section-group">
                  <h3>Description</h3>
                  <p className="deza-raw-text">{product.description || "A masterfully balanced luxury composition."}</p>
                </div>
                <div className="pd-section-group">
                  <h3>Fragrance Notes</h3>
                  <p className="deza-raw-text">{product.fragrance || "No notes provided."}</p>
                </div>
              </div>

              <div className="pd-size-qty-row">
                <div className="pd-sizes">
                  <h4>Select Size</h4>
                  <div className="size-buttons">
                    {product.sizePrices?.map((sp) => (
                      <button key={sp.size} className={selectedSize === sp.size ? "active" : ""} onClick={() => setSelectedSize(sp.size)}>
                        {sp.size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pd-qty">
                  <h4>Quantity</h4>
                  <div className="qty-box">
                    <button onClick={() => setQty(qty > 1 ? qty - 1 : 1)}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty(qty + 1)}>+</button>
                  </div>
                </div>
              </div>

              <div className="pd-actions">
                <button className="cart-btn" onClick={handleAddToCart}><FaShoppingCart /> Add to Cart</button>
                <button className="buy-btn" onClick={handleBuyNow}>Buy Now</button>
                <div className="wish-whatsapp">
                  <button className="wish-btn" onClick={handleWishlist}>{wish ? <FaHeart /> : <FaRegHeart />} Wishlist</button>
                  <button className="whatsapp-btn" onClick={handleWhatsAppOrder}><FaWhatsapp className="wa-icon" /> WhatsApp</button>
                </div>
              </div>

              <div className="pd-review-section">
                <h3>Rate this Product</h3>
                <div style={{ marginBottom: "10px" }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <FaStar key={i} size={22} style={{ cursor: "pointer", marginRight: "5px" }} color={i < (hoverStars || stars) ? "#ffd369" : "#555"} onMouseEnter={() => setHoverStars(i + 1)} onMouseLeave={() => setHoverStars(0)} onClick={() => setStars(i + 1)} />
                  ))}
                </div>
                <textarea placeholder="Write your review..." value={comment} onChange={(e) => setComment(e.target.value)} />
                <button className="submit-review-btn" onClick={handleReviewSubmit}>Submit Review</button>

                <div className="reviews-list-container">
                  {reviews.map((r, index) => (
                    <div key={index} className="single-review-card">
                      <strong>{r.userName}</strong>
                      <div className="review-stars-display">
                        {Array.from({ length: 5 }, (_, i) => <FaStar key={i} size={20} color={i < r.rating ? "#ffd369" : "#555"} />)}
                      </div>
                      <p>{r.comment}</p>
                      <small>{new Date(r.createdAt).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {showWhatsAppModal && (
            <div className="wa-modal-overlay">
              <div className="wa-modal-card">
                <h2>Complete WhatsApp Order</h2>
                <form onSubmit={confirmWhatsAppOrder}>
                  <div className="wa-form-group">
                    <label>Receiver Name</label>
                    <input type="text" value={waName} onChange={(e) => setWaName(e.target.value)} required />
                  </div>
                  <div className="wa-form-group">
                    <label>Contact Number</label>
                    <input type="tel" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} required />
                  </div>
                  <div className="wa-form-group">
                    <label>Full Delivery Address</label>
                    <textarea value={waAddress} onChange={(e) => setWaAddress(e.target.value)} required />
                  </div>
                  <div className="wa-modal-actions">
                    <button type="button" className="wa-cancel-btn" onClick={() => setShowWhatsAppModal(false)}>Cancel</button>
                    <button type="submit" className="wa-confirm-btn">Confirm & Send Order 🛍</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
