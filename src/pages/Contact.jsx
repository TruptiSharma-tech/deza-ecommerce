import React, { useState } from "react";
import "./Contact.css";

export default function Support() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submitQuery = (e) => {
    e.preventDefault();

    if (!name || !email || !message) {
      alert("⚠ Please fill all fields!");
      return;
    }

    const oldQueries = JSON.parse(localStorage.getItem("dezaQueries")) || [];

    const newQuery = {
      id: Date.now(),
      name,
      email,
      message,
      resolved: false,
      date: new Date().toLocaleString(),
    };

    localStorage.setItem(
      "dezaQueries",
      JSON.stringify([newQuery, ...oldQueries]),
    );

    alert(
      "✅ Your query has been submitted successfully! Our team will contact you soon 💛",
    );

    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="support-page">
      <div className="support-card">
        <h1 className="support-title">📩 Customer Support</h1>
        <p className="support-subtitle">
          Need help? Send your query and our team will respond ASAP 💛
        </p>

        <form onSubmit={submitQuery} className="support-form">
          <label>
            Full Name
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Your Message
            <textarea
              placeholder="Write your query here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          <button type="submit" className="support-btn">
            Send Query 🚀
          </button>
        </form>
      </div>
    </div>
  );
}
