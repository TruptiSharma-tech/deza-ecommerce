import React, { useState, useEffect } from "react";
import { apiSubmitQuery, apiGetMyQueries } from "../utils/api";
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

  useEffect(() => {
    if (currentUser?.email) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      loadMyQueries(currentUser.email);
    }
  }, [currentUser]);

  const loadMyQueries = async (email) => {
    try {
      const data = await apiGetMyQueries(email);
      setMyQueries(data);
    } catch (err) {
      console.error("Failed to load queries:", err);
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
      alert("⚠ Please fill all fields!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert("⚠ Please enter a valid email address!");
      return;
    }

    setLoading(true);
    try {
      const newQuery = await apiSubmitQuery({ name, email, message, image });
      alert("✅ Query submitted successfully! Track status below 💛");

      setName(currentUser?.name || "");
      setEmail(currentUser?.email || "");
      setMessage("");
      setImage(null);

      setMyQueries((prev) => [newQuery, ...prev]);
    } catch (err) {
      alert("❌ Failed to submit query: " + err.message);
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
            Your Message
            <textarea
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
                  <strong>ID:</strong> {q._id}
                </p>

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
