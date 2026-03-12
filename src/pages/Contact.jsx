import React, { useState, useEffect } from "react";
import { apiSubmitQuery, apiGetMyQueries } from "../utils/api";
import toast from "react-hot-toast";
import "./Contact.css";
import { useAuth } from "../context/AuthContext";

export default function Support() {
  const { user: currentUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [myQueries, setMyQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [queryType, setQueryType] = useState("General Support");
  const [orderIdInput, setOrderIdInput] = useState("");

  const queryTypes = [
    "General Support",
    "Delayed Delivery",
    "Wrong Product Received",
    "Damaged Product Received",
    "Refund Related",
    "Exchange Request"
  ];

  useEffect(() => {
    if (currentUser?.email) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      loadMyQueries(currentUser.email);
    }
  }, [currentUser]);

  const loadMyQueries = async (email) => {
    try {
      const token = localStorage.getItem("deza_token");
      if (!token) {
        setMyQueries([]);
        return;
      }
      const data = await apiGetMyQueries(email);
      setMyQueries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load queries:", err);
      setMyQueries([]);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const submitQuery = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill all fields!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address!");
      return;
    }

    setLoading(true);
    try {
      // Map frontend queryType to backend model fields
      let ticketType = "General Query";
      if (queryType === "Exchange Request") ticketType = "Exchange Request";
      if (queryType === "Refund Related") ticketType = "Refund Request";

      const newQuery = await apiSubmitQuery({
        name,
        email,
        message,
        image,
        ticketType,
        issueType: queryType,
        orderId: orderIdInput,
      });

      toast.success("Ticket submitted! Our luxury concierge will assist you shortly. ✨");

      setName(currentUser?.name || "");
      setEmail(currentUser?.email || "");
      setMessage("");
      setImage(null);
      setOrderIdInput("");

      setMyQueries((prev) => [newQuery, ...prev]);
    } catch (err) {
      toast.error("Failed to submit query: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-page">
      <div className="support-card">
        <h1 className="support-title">📩 Customer Support</h1>

        <form onSubmit={submitQuery} className="support-form">
          <label>
            Full Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Query Category
            <select
              value={queryType}
              onChange={(e) => {
                setQueryType(e.target.value);
                // Pre-fill message based on type if needed
              }}
              className="support-select"
              style={{ width: "100%", padding: "12px", background: "#111", color: "white", border: "1px solid #333", borderRadius: "8px", marginTop: "8px", marginBottom: "15px" }}
            >
              {queryTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <label>
            Order ID (Optional)
            <input
              type="text"
              placeholder="e.g. DZ-12345678"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
            />
          </label>

          <label>
            Your Message
            <textarea
              placeholder="Please provide details about your issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          <label>
            Upload Image (Proof)
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>

          <button type="submit" className="support-btn" disabled={loading}>
            {loading ? "Submitting..." : "Send Query 🚀"}
          </button>
        </form>

        {/* USER QUERY TRACKING */}
        {myQueries.length > 0 && (
          <div className="query-tracking">
            <h2>📦 Your Queries</h2>

            {myQueries.map((q) => (
              <div key={q._id} className="query-card">
                <p>
                  <strong>Ticket ID:</strong> DZ-TK-{String(q._id).slice(-6).toUpperCase()}
                </p>
                {q.orderId && (
                  <p>
                    <strong>Order ID:</strong> {q.orderId}
                  </p>
                )}

                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      color: q.status === "Resolved" ? "green" : "orange",
                    }}
                  >
                    {q.status}
                  </span>
                </p>

                {q.adminReply && (
                  <p>
                    <strong>Admin Reply:</strong> {q.adminReply}
                  </p>
                )}

                {q.image && (
                  <img
                    src={q.image}
                    alt="proof"
                    style={{
                      width: "120px",
                      marginTop: "10px",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
