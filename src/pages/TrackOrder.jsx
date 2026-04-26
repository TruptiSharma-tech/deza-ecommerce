import React, { useEffect, useState, useRef } from "react";
import "./TrackOrder.css";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiReturnOrder } from "../utils/api";

let API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
if (API_URL.endsWith("/")) API_URL = API_URL.slice(0, -1);
if (!API_URL.endsWith("/api")) API_URL += "/api";

// Fallback Origin (in case shopId is missing)
const DEFAULT_ORIGIN = {
  name: "DEZA Luxury - Hub",
  area: "Mulund West",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400080",
  lat: 19.1726,
  lng: 72.9425
};

// Each step: label, icon (emoji), location description, what to show as sub-info
const TIMELINE = [
  {
    key: "Placed",
    label: "Order Placed",
    icon: "✅",
    location: "DEZA · Mulund West, Mumbai",
    detail: "Your order has been confirmed",
    color: "#50c878",
  },
  {
    key: "Packed",
    label: "Order Packed",
    icon: "📦",
    location: "Fulfillment Centre · Mulund West, Mumbai",
    detail: "Item packed & quality checked",
    color: "#d4af37",
  },
  {
    key: "Shipped",
    label: "Shipped",
    icon: "🚚",
    location: "En Route · Mumbai → Your City",
    detail: "Handover to courier partner",
    color: "#d4af37",
  },
  {
    key: "Out for Delivery",
    label: "Out for Delivery",
    icon: "🏎️",
    location: "Local Hub · Near Your Area",
    detail: "Delivery agent on the way",
    color: "#ff9f43",
  },
  {
    key: "Delivered",
    label: "Delivered",
    icon: "🎉",
    location: "Your Doorstep",
    detail: "Package handed over successfully",
    color: "#50c878",
  },
];

const STATUS_INDEX = {
  Placed: 0, Processing: 0,
  Packed: 1,
  Shipped: 2,
  "Out for Delivery": 3,
  Delivered: 4,
};

// Utility to check and return real status dates from history
function getStepTimestamps(order) {
  if (!order) return [];
  const history = order.statusHistory || [];
  // Statuses match the TIMELINE steps
  const stepKeys = ["Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"];

  return stepKeys.map(key => {
    const entry = history.find(h => h.status === key);
    if (entry && entry.timestamp) {
      return new Date(entry.timestamp).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    }
    // Fallback for first step if history is missing it
    if (key === "Processing" && order.createdAt) {
      return new Date(order.createdAt).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    }
    return null;
  });
}

function getETA(order) {
  if (!order) return null;
  const { status, createdAt, estimatedDeliveryDate } = order;
  if (status === "Delivered" || status === "Cancelled") return null;

  // Use real ETA from backend if admin set it
  if (estimatedDeliveryDate) {
    return new Date(estimatedDeliveryDate).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long"
    });
  }

  // Fallback calculation (logical estimate)
  const base = createdAt ? new Date(createdAt) : new Date();
  const days = { Placed: 5, Processing: 5, Packed: 4, Shipped: 2, "Out for Delivery": 0 };
  const d = new Date(base.getTime() + (days[status] ?? 4) * 24 * 3600 * 1000);
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

// Simulated location trail per step
const LOCATION_TRAIL = [
  "DEZA Warehouse, Mulund West — Mumbai 400080",
  "DEZA Fulfillment Centre, Mulund West — Mumbai",
  "BlueDart Sorting Hub, Thane · In Transit",
  "Local Delivery Hub · Your Area",
  "Delivered to your address ✓",
];

// Utility to clean and format phone numbers (+91 XXXXXXXXXX)
function formatPhone(num) {
  if (!num) return "";
  let digits = String(num).replace(/\D/g, ""); // Keep only digits
  if (digits.length > 10) digits = digits.slice(-10); // Take last 10 if extra exist
  return `+91 ${digits}`;
}

// Removed map recenter helper

export default function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehiclePos, setVehiclePos] = useState(0); // 0–100% across route
  
  // Return & Refund States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnType, setReturnType] = useState("Refund");
  const [returnReason, setReturnReason] = useState("Wrong Product Received");
  const [returnMessage, setReturnMessage] = useState("");
  
  const animRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => { 
    fetchOrder(); 
    // ⏱️ REAL-TIME POLLING (Every 5 seconds)
    pollRef.current = setInterval(fetchOrderSilent, 5000);
    return () => clearInterval(pollRef.current);
  }, [orderId]);

  // Silent update for polling (doesn't trigger big loader)
  const fetchOrderSilent = async () => {
    try {
      const token = localStorage.getItem("deza_token");
      const res = await fetch(
        `${API_URL}/orders/track/${encodeURIComponent(orderId)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (err) {
       console.error("Tracking poll failed");
    }
  };

  // Animate vehicle position
  useEffect(() => {
    if (!order || order.status === "Delivered" || order.status === "Cancelled") return;
    const idx = STATUS_INDEX[order.status] ?? 0;
    const basePositions = [5, 22, 52, 80, 98];
    let pos = basePositions[idx];
    setVehiclePos(pos);

    // Slowly drift the vehicle
    animRef.current = setInterval(() => {
      pos = Math.min(pos + 0.3, basePositions[idx] + 8);
      setVehiclePos(pos);
    }, 2000);
    return () => clearInterval(animRef.current);
  }, [order]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("deza_token");
      const res = await fetch(
        `${API_URL}/orders/track/${encodeURIComponent(orderId)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) { toast.error("Order not found!"); navigate("/orders"); return; }
      setOrder(await res.json());
    } catch (err) {
      toast.error("Could not load order.");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const isReturnAllowed = (o) => {
    if (!o || o.status !== "Delivered") return false;
    if (!o.deliveredAt) return true; // Support older orders initially
    const deliveredTime = new Date(o.deliveredAt).getTime();
    const now = new Date().getTime();
    const diffInHours = (now - deliveredTime) / (1000 * 60 * 60);
    return diffInHours <= 48;
  };

  const submitReturnRequest = async () => {
    if (!order) return;
    try {
      const updated = await apiReturnOrder(order._id || orderId, {
        returnType,
        reason: returnReason,
        message: returnMessage,
      });
      setOrder(updated);
      toast.success("Return Request Sent Successfully! ✨");
      setShowReturnModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to submit return request");
    }
  };

  const activeShop = order?.shopId || DEFAULT_ORIGIN;
  const originName = activeShop.name;
  const originArea = activeShop.area || "";
  const originCity = activeShop.city || "Mumbai";
  const originLat  = activeShop.location?.lat || activeShop.lat || DEFAULT_ORIGIN.lat;
  const originLng  = activeShop.location?.lng || activeShop.lng || DEFAULT_ORIGIN.lng;

  if (loading) {
    return (
      <div className="to-page">
        <div className="to-spinner-wrap">
          <div className="to-spinner" />
          <p className="to-spinner-text">Fetching your order...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentIdx  = STATUS_INDEX[order.status] ?? 0;
  const isCancelled = order.status === "Cancelled";
  const isDelivered = order.status === "Delivered";
  const timestamps  = getStepTimestamps(order);
  const eta         = getETA(order);
  
  // Robust address extraction
  const addr = order.shippingAddress || order.address || {};
  const destCity = addr.city || (typeof addr === 'string' ? addr.split(',').pop() : "Your City");
  
  let destFull = "Address not available";
  if (typeof addr === 'string') {
    destFull = addr;
  } else if (addr && typeof addr === 'object') {
    destFull = [
      addr.street || addr.houseNo || addr.line1,
      addr.area || addr.line2,
      addr.city,
      addr.state,
      addr.pincode
    ].filter(Boolean).join(", ");
  }


  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="to-page">

      {/* ═══ TOP HEADER BAR ════════════════════════════════ */}
      <div className="to-header-bar">
        <button className="to-back-btn" onClick={() => navigate("/orders")}>
          ← My Orders
        </button>
        <div className="to-header-center">
          <span className="to-brand">DEZA</span>
          <span className="to-header-sep">·</span>
          <span className="to-header-sub">Tracking Shipment</span>
        </div>
        <span className={`to-status-chip ${isCancelled ? "chip-red" : isDelivered ? "chip-green" : "chip-gold"}`}>
          {order.status}
        </span>
      </div>

      {/* ═══ ORDER META ROW ════════════════════════════════ */}
      <div className="to-meta-row">
        <div className="to-meta-item">
          <small>ORDER ID</small>
          <div className="to-id-copy-row">
            <b>{order.orderId || ("DZ-" + String(order._id).slice(-8).toUpperCase())}</b>
            <button 
              className="to-copy-id-btn"
              onClick={() => {
                const id = order.orderId || order._id;
                navigator.clipboard.writeText(id);
                toast.success("ID Copied!");
              }}
            >
              📋
            </button>
          </div>
        </div>
        <div className="to-meta-divider" />
        <div className="to-meta-item">
          <small>PLACED ON</small>
          <b>{formattedDate}</b>
        </div>
        <div className="to-meta-divider" />
        <div className="to-meta-item">
          <small>DESTINATION</small>
          <b>{destCity}</b>
        </div>
      </div>

      {/* ═══ ETA BANNER ════════════════════════════════════ */}
      {!isCancelled && !isDelivered && eta && (
        <div className="to-eta-banner">
          <div className="to-eta-left">
            <span className="to-eta-icon">🚀</span>
            <div>
              <p className="to-eta-label">Expected Arrival</p>
              <p className="to-eta-date">{eta}</p>
            </div>
          </div>
          <div className="to-eta-right">
            <span className="to-live-pulse" />
            <span className="to-live-text">LIVE TRACKING ACTIVE</span>
          </div>
        </div>
      )}

      {isDelivered && (
        <div className="to-delivered-banner">
          <span className="to-bounce">🎉</span>
          <div style={{ flex: 1 }}>
            <p className="to-delv-title">Delivered successfully!</p>
            <p className="to-delv-sub">Enjoy your premium fragrance experience.</p>
          </div>
          {isReturnAllowed(order) && !order.returnStatus?.includes("Requested") && (
            <button 
              className="to-back-btn" 
              style={{ borderColor: "#ff6b6b", color: "#ff6b6b", marginLeft: "auto" }}
              onClick={() => setShowReturnModal(true)}
            >
              ↩ Return / Refund
            </button>
          )}
          {order.returnStatus?.includes("Requested") && (
            <span style={{ fontSize: '12px', color: '#ff9f43', fontWeight: 'bold', marginLeft: 'auto' }}>
              Return Requested
            </span>
          )}
        </div>
      )}

      {/* ═══ MAIN GRID ══════════════════════════════════════ */}
      <div className="to-main-grid">
        <div className="to-left-col">
          
          {/* ═══ PREMIUM ROAD VISUAL ═════════════════════════ */}

          <div className="to-timeline-card">
            <div className="to-section-label">📍 Shipment Updates</div>

            <div className="to-timeline">
              {TIMELINE.map((step, i) => {
                const done    = i <= currentIdx && !isCancelled;
                const current = i === currentIdx && !isCancelled;
                const ts      = timestamps[i];

                return (
                  <div key={step.key} className={`to-step ${done ? "done" : ""} ${current ? "current" : ""}`}>
                    {i < TIMELINE.length - 1 && (
                      <div className={`to-step-line ${i < currentIdx && !isCancelled ? "filled" : ""}`} />
                    )}

                    <div className="to-step-circle" style={{ "--step-color": done ? step.color : "rgba(255,255,255,0.06)" }}>
                      {done ? (
                        <span className="to-step-icon">{step.icon}</span>
                      ) : (
                        <span className="to-step-num">{i + 1}</span>
                      )}
                      {current && <span className="to-step-ping" />}
                    </div>

                    <div className="to-step-body">
                      <div className="to-step-header-row">
                        <p className={`to-step-title ${done ? "title-done" : ""}`}>{step.label}</p>
                        {current && <span className="to-current-badge">ACTIVE</span>}
                        {/* Show Estimated Date on Delivered Step if not delivered yet */}
                        {step.key === "Delivered" && !isDelivered && !isCancelled && eta && (
                          <span className="to-est-tag">Est. {eta}</span>
                        )}
                      </div>
                      {done && (
                        <>
                          <p className="to-step-location">{step.location}</p>
                          <p className="to-step-detail">{step.detail}</p>
                          {ts && <p className="to-step-ts">Update: {ts}</p>}
                        </>
                      )}
                      {!done && !isCancelled && (
                        <p className="to-step-pending">
                          {step.key === "Delivered" ? `Estimated arrival by ${eta}` : "Coming up next"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {isCancelled && (
                <div className="to-step done current">
                  <div className="to-step-circle" style={{ "--step-color": "#ff4b4b" }}>
                    <span className="to-step-icon">🚫</span>
                  </div>
                  <div className="to-step-body">
                    <p className="to-step-title title-done" style={{ color: "#ff6b6b" }}>Order Revoked</p>
                    <p className="to-step-detail">Your order has been cancelled.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="to-right-col">
          <div className="to-addr-card">
            <div className="to-section-label">🏠 Delivery To</div>
            <div className="to-addr-body">
              <p className="to-addr-name">{order.customerName}</p>
              <p className="to-addr-text">{destFull}</p>
              <p className="to-addr-phone">📞 {formatPhone(order.customerPhone)}</p>
            </div>
            <div className="to-origin-row">
              <div className="to-origin-label">SHIPPED FROM</div>
              <div className="to-origin-val">{originName} · {originCity}</div>
            </div>
          </div>

          {/* 📦 SHIPMENT ITEMS moved to right side */}
          {order.items && order.items.length > 0 && (
            <div className="to-items-box-compact">
              <div className="to-section-label">🛒 Shipment Contents ({order.items.length})</div>
              <div className="to-items-scroll-area">
                {order.items.map((item, i) => (
                  <div key={i} className="to-compact-item-card">
                    {item.image && <img src={item.image} alt={item.name} className="to-compact-item-img" />}
                    <div className="to-compact-item-info">
                      <p className="to-compact-item-name">{item.name}</p>
                      <p className="to-compact-item-meta">{item.selectedSize} · Qty: {item.qty}</p>
                      <p className="to-compact-item-price">₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="to-help-card">
            <span>📞</span>
            <div>
              <p className="to-help-title">Need help?</p>
              <p className="to-help-sub">Direct WhatsApp Support</p>
            </div>
            <button 
              className="to-help-btn" 
              onClick={() => {
                const msg = `Help with Order: ${order.orderId || order._id}`;
                window.open(`https://wa.me/919082710359?text=${encodeURIComponent(msg)}`, '_blank');
              }}
            >
              CHAT
            </button>
          </div>
        </div>
      </div>

      <div className="to-footer-note">
        ✨ DEZA Luxury Fragrances · Professional Logistics Partner · Mumbai
      </div>

      {/* RETURN MODAL */}
      {showReturnModal && (
        <div className="to-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="to-modal-content" style={{
            background: '#161616', padding: '30px', borderRadius: '20px',
            width: '90%', maxWidth: '400px', border: '1px solid rgba(212,175,55,0.3)',
            display: 'flex', flexDirection: 'column', gap: '15px'
          }}>
            <h2 style={{ color: '#d4af37', margin: '0 0 10px', fontSize: '20px' }}>Return Request</h2>

            <label style={{ fontSize: '12px', color: '#f0ece4' }}>Return Type</label>
            <select
              value={returnType}
              onChange={(e) => setReturnType(e.target.value)}
              style={{ background: '#0e0e0e', color: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}
            >
              <option value="Refund">Refund</option>
              <option value="Exchange">Exchange</option>
            </select>

            <label style={{ fontSize: '12px', color: '#f0ece4' }}>Reason</label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              style={{ background: '#0e0e0e', color: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}
            >
              <option>Wrong Product Received</option>
              <option>Damaged Product</option>
              <option>Leakage / Broken Bottle</option>
              <option>Not Satisfied With Smell</option>
              <option>Allergic Reaction</option>
              <option>Delivery Late</option>
              <option>Other</option>
            </select>

            <label style={{ fontSize: '12px', color: '#f0ece4' }}>Message (Optional)</label>
            <textarea
              placeholder="Explain your issue..."
              value={returnMessage}
              onChange={(e) => setReturnMessage(e.target.value)}
              style={{ background: '#0e0e0e', color: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #333', minHeight: '80px' }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                style={{ flex: 1, padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => setShowReturnModal(false)}
              >
                Close
              </button>
              <button
                style={{ flex: 1, padding: '10px', background: '#d4af37', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={submitReturnRequest}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
