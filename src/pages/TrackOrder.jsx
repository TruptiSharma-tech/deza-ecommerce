import React, { useEffect, useState, useRef } from "react";
import "./TrackOrder.css";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ORIGIN = {
  name: "DEZA Warehouse",
  area: "Mulund West",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400080",
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

export default function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehiclePos, setVehiclePos] = useState(0); // 0–100% across route
  const animRef = useRef(null);

  useEffect(() => { fetchOrder(); }, [orderId]);

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
          <span className="to-header-sub">Order Tracking</span>
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
                toast.success("Order ID Copied!");
              }}
              title="Copy Order ID"
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
          <small>TOTAL AMOUNT</small>
          <b>₹{order.totalPrice?.toLocaleString("en-IN") || "—"}</b>
        </div>
        <div className="to-meta-divider" />
        <div className="to-meta-item">
          <small>PAYMENT</small>
          <b>{order.paymentMethod || "—"}</b>
        </div>
      </div>

      {/* ═══ ETA BANNER ════════════════════════════════════ */}
      {!isCancelled && !isDelivered && eta && (
        <div className="to-eta-banner">
          <div className="to-eta-left">
            <span className="to-eta-icon">🚀</span>
            <div>
              <p className="to-eta-label">Expected Delivery</p>
              <p className="to-eta-date">{eta}</p>
            </div>
          </div>
          <div className="to-eta-right">
            <span className="to-live-pulse" />
            <span className="to-live-text">LIVE TRACKING ON</span>
          </div>
        </div>
      )}

      {isDelivered && (
        <div className="to-delivered-banner">
          <span>🎉</span>
          <div>
            <p className="to-delv-title">Your order has been delivered!</p>
            <p className="to-delv-sub">Thank you for shopping with DEZA Luxury Perfumes</p>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="to-cancelled-banner">
          <span>🚫</span>
          <div>
            <p className="to-delv-title">Order Cancelled</p>
            <p className="to-delv-sub">Refund (if applicable) will be processed in 5–7 business days</p>
          </div>
        </div>
      )}

      {/* ═══ MAIN GRID ══════════════════════════════════════ */}
      <div className="to-main-grid">

        {/* ── LEFT: Timeline & Items ────────────────────── */}
        <div className="to-left-col">
          <div className="to-timeline-card">
            <div className="to-section-label">📍 Shipment Status</div>

            <div className="to-timeline">
              {TIMELINE.map((step, i) => {
                const done    = i <= currentIdx && !isCancelled;
                const current = i === currentIdx && !isCancelled;
                const ts      = timestamps[i];

                return (
                  <div key={step.key} className={`to-step ${done ? "done" : ""} ${current ? "current" : ""}`}>
                    {/* Connector line */}
                    {i < TIMELINE.length - 1 && (
                      <div className={`to-step-line ${i < currentIdx && !isCancelled ? "filled" : ""}`} />
                    )}

                    {/* Circle icon */}
                    <div className="to-step-circle" style={{ "--step-color": done ? step.color : "rgba(255,255,255,0.1)" }}>
                      {done ? (
                        <span className="to-step-icon">{step.icon}</span>
                      ) : (
                        <span className="to-step-num">{i + 1}</span>
                      )}
                      {current && <span className="to-step-ping" />}
                    </div>

                    {/* Text */}
                    <div className="to-step-body">
                      <div className="to-step-header-row">
                        <p className={`to-step-title ${done ? "title-done" : ""}`}>{step.label}</p>
                        {current && <span className="to-current-badge">CURRENT</span>}
                      </div>
                      {done && (
                        <>
                          <p className="to-step-location">📌 {step.location}</p>
                          <p className="to-step-detail">{step.detail}</p>
                          {ts && <p className="to-step-ts">🕐 {ts}</p>}
                        </>
                      )}
                      {!done && !isCancelled && (
                        <p className="to-step-pending">Pending</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Cancelled step */}
              {isCancelled && (
                <div className="to-step done current">
                  <div className="to-step-circle" style={{ "--step-color": "#ff4b4b" }}>
                    <span className="to-step-icon">🚫</span>
                  </div>
                  <div className="to-step-body">
                    <p className="to-step-title title-done" style={{ color: "#ff6b6b" }}>Order Cancelled</p>
                    <p className="to-step-detail">Your order was cancelled</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ ITEMS SECTION (FULL WIDTH BELOW TIMELINE) ══════ */}
          {order.items && order.items.length > 0 && (
            <div className="to-items-horizontal-card">
              <div className="to-section-label-small">🛒 Order Items</div>
              <div className="to-items-horizontal-list">
                {order.items.map((item, i) => (
                  <div key={i} className="to-item-mini-card">
                    {item.image && <img src={item.image} alt={item.name} className="to-item-img-mini" />}
                    <div className="to-item-mini-info">
                      <p className="to-item-mini-name">{item.name}</p>
                      <p className="to-item-mini-meta">Qty: {item.qty} · {item.selectedSize}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Live Location etc ───────────────────────── */}
        <div className="to-right-col">
          {/* Live Route Map */}
          {!isCancelled && (
            <div className="to-map-card">
              <div className="to-section-label">
                <span className="to-live-dot" />
                Live Route · Mulund West → {destCity}
              </div>

              {/* Animated Route Visual */}
              <div className="to-route-visual">
                {/* Road */}
                <div className="to-road">
                  <div className="to-road-dashes" />
                  {/* Progress fill */}
                  <div className="to-road-fill" style={{ width: `${vehiclePos}%` }} />
                  {/* Moving vehicle */}
                  <div className="to-vehicle" style={{ left: `${vehiclePos}%` }}>
                    <div className="to-vehicle-icon">
                      {currentIdx >= 3 ? "🏎️" : currentIdx >= 2 ? "🚚" : "📦"}
                    </div>
                    <div className="to-vehicle-shadow" />
                    <div className="to-vehicle-ping" />
                  </div>
                </div>

                {/* Checkpoints */}
                <div className="to-checkpoints">
                  <div className="to-checkpoint origin">
                    <div className="to-cp-dot origin-cp" />
                    <span>🏪</span>
                    <p>Mulund West</p>
                    <small>Mumbai</small>
                  </div>
                  <div className="to-checkpoint mid">
                    <div className="to-cp-dot mid-cp" style={{ opacity: currentIdx >= 2 ? 1 : 0.3 }} />
                    <span>🏢</span>
                    <p>Sorting Hub</p>
                    <small>Thane</small>
                  </div>
                  <div className="to-checkpoint dest">
                    <div className="to-cp-dot dest-cp" style={{ opacity: isDelivered ? 1 : 0.35 }} />
                    <span>🏠</span>
                    <p>{destCity}</p>
                    <small>You</small>
                  </div>
                </div>
              </div>

              {/* Current Location Info */}
              <div className="to-current-loc-box">
                <div className="to-cur-loc-left">
                  <span className="to-cur-loc-icon">📍</span>
                  <div>
                    <small>CURRENT LOCATION</small>
                    <p>{LOCATION_TRAIL[Math.min(currentIdx, LOCATION_TRAIL.length - 1)]}</p>
                  </div>
                </div>
                <div className="to-refresh-tag">
                  <span className="to-live-dot small" />
                  Updated just now
                </div>
              </div>
            </div>
          )}

          {/* Delivery Address Card */}
          <div className="to-addr-card">
            <div className="to-section-label">🏠 Delivery Address</div>
            <div className="to-addr-body">
              {order.customerName && <p className="to-addr-name">{order.customerName}</p>}
              <p className="to-addr-text">{destFull || "Address not available"}</p>
              {order.customerPhone && <p className="to-addr-phone">📞 {formatPhone(order.customerPhone)}</p>}
            </div>

            <div className="to-origin-row">
              <div className="to-origin-label">Dispatched from</div>
              <div className="to-origin-val">
                📍 {ORIGIN.name}, {ORIGIN.area}, {ORIGIN.city} — {ORIGIN.pincode}
              </div>
            </div>
          </div>

          {/* Help Card (Moved below Address) */}
          <div className="to-help-card">
            <span>🎧</span>
            <div>
              <p className="to-help-title">Issues with this order?</p>
              <p className="to-help-sub">Chat with our team directly on WhatsApp</p>
            </div>
            <button 
              className="to-help-btn" 
              onClick={() => {
                const msg = `Hi DEZA Support, I need help with my Order ID: ${order.orderId || order._id}`;
                window.open(`https://wa.me/919082710359?text=${encodeURIComponent(msg)}`, '_blank');
              }}
            >
              Chat on WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div className="to-footer-note">
        ✨ DEZA Luxury Perfumes · Mulund West, Mumbai · All deliveries shipped with care
      </div>
    </div>
  );
}
