import React, { useEffect, useState, useRef } from "react";
import "./TrackOrder.css";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Delivery Truck Icon
// Custom Icons for Map
const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7541/7541900.png',
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -45],
});

const warehouseIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2897/2897868.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const homeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1239/1239525.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

// Helper to center map when coords change
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng]);
  }, [lat, lng]);
  return null;
}

export default function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehiclePos, setVehiclePos] = useState(0); // 0–100% across route
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
          <div>
            <p className="to-delv-title">Delivered successfully!</p>
            <p className="to-delv-sub">Enjoy your premium fragrance experience.</p>
          </div>
        </div>
      )}

      {/* ═══ MAIN GRID ══════════════════════════════════════ */}
      <div className="to-main-grid">
        <div className="to-left-col">
          
          {/* ═══ PREMIUM ROAD VISUAL ═════════════════════════ */}
          {!isCancelled && !isDelivered && (
            <div className="to-map-card no-pad">
               <div className="to-route-visual">
                  <div className="to-section-label-small">🚚 Current Journey</div>
                  
                  <div className="to-road">
                    <div className="to-road-dashes" />
                    <div className="to-road-fill" style={{ width: `${vehiclePos}%` }} />
                    
                    <div className="to-vehicle" style={{ left: `${vehiclePos}%` }}>
                      <div className="to-vehicle-ping" />
                      <div className="to-vehicle-icon">🚛</div>
                      <div className="to-vehicle-shadow" />
                    </div>
                  </div>

                  <div className="to-checkpoints">
                    <div className="to-checkpoint">
                        <div className="to-cp-dot origin-cp" />
                        <p>{originArea || "HUB"}</p>
                        <small>{originCity}</small>
                    </div>
                    <div className="to-checkpoint">
                        <div className="to-cp-dot mid-cp" style={{ opacity: vehiclePos > 40 ? 1 : 0.2 }} />
                        <p>Sorting</p>
                        <small>In Transit</small>
                    </div>
                    <div className="to-checkpoint">
                        <div className="to-cp-dot dest-cp" style={{ opacity: vehiclePos > 95 ? 1 : 0.2 }} />
                        <p>Your Door</p>
                        <small>{destCity}</small>
                    </div>
                  </div>
               </div>
            </div>
          )}

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
                      </div>
                      {done && (
                        <>
                          <p className="to-step-location">{step.location}</p>
                          <p className="to-step-detail">{step.detail}</p>
                          {ts && <p className="to-step-ts">Update: {ts}</p>}
                        </>
                      )}
                      {!done && !isCancelled && (
                        <p className="to-step-pending">Coming up next</p>
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

          {/* 📦 SHIPMENT ITEMS */}
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
        </div>

        <div className="to-right-col">
          {/* Live GSP Map with Multi-Markers */}
          {!isCancelled && (
            <div className="to-map-card">
              <div className="to-section-label">
                <span className="to-live-dot" />
                Precise GPS Tracking
              </div>

              <div className="to-map-container" style={{ height: "420px", borderRadius: "18px", overflow: "hidden", margin: "12px 0", border: "1px solid rgba(212,175,55,0.25)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                <MapContainer 
                  center={[order.liveTracking?.lat || 19.1726, order.liveTracking?.lng || 72.9425]} 
                  zoom={12} 
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  
                  {/* Origin (Dynamic Shop) */}
                  <Marker position={[originLat, originLng]} icon={warehouseIcon}>
                    <Popup><b>{originName}</b> (Shipment Origin)</Popup>
                  </Marker>

                  {/* Delivery Partner */}
                  <Marker 
                    position={[order.liveTracking?.lat || 19.1726, order.liveTracking?.lng || 72.9425]} 
                    icon={deliveryIcon}
                  >
                    <Popup>
                      <b>DEZA Courier</b><br />
                      Status: On the Move
                    </Popup>
                  </Marker>

                  <RecenterMap lat={order.liveTracking?.lat} lng={order.liveTracking?.lng} />
                </MapContainer>
              </div>

              <div className="to-current-loc-box">
                  <div className="to-cur-loc-left">
                    <span className="to-cur-loc-icon">🚚</span>
                    <div>
                      <small>CURRENT LOCATION</small>
                      <p>{order.liveTracking?.isActive ? "Your courier is on the way!" : "Package processed at hub."}</p>
                    </div>
                  </div>
                  <div className="to-refresh-tag">
                    <span className="to-live-dot small" />
                    LIVE
                  </div>
              </div>
            </div>
          )}

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
    </div>
  );
}
