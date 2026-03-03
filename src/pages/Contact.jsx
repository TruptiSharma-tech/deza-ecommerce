import React, { useState, useEffect } from "react";
import "./Contact.css";

export default function Support() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [myQueries, setMyQueries] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    const allQueries = JSON.parse(localStorage.getItem("dezaQueries")) || [];

    if (currentUser) {
      const userQueries = allQueries.filter(
        (q) => q.email === currentUser.email,
      );
      setMyQueries(userQueries);
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const submitQuery = (e) => {
    e.preventDefault();

    if (!name || !email || !message) {
      alert("⚠ Please fill all fields!");
      return;
    }

    const oldQueries = JSON.parse(localStorage.getItem("dezaQueries")) || [];

    const newQuery = {
      id: "Q" + Date.now(),
      name,
      email,
      message,
      image,
      status: "Pending",
      reply: "",
      date: new Date().toLocaleString(),
    };

    localStorage.setItem(
      "dezaQueries",
      JSON.stringify([newQuery, ...oldQueries]),
    );

    alert("✅ Query submitted successfully! Track status below 💛");

    setName("");
    setEmail("");
    setMessage("");
    setImage(null);

    setMyQueries([newQuery, ...myQueries]);
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

          <button type="submit" className="support-btn">
            Send Query 🚀
          </button>
        </form>

        {/* USER QUERY TRACKING */}
        {myQueries.length > 0 && (
          <div className="query-tracking">
            <h2>📦 Your Queries</h2>

            {myQueries.map((q) => (
              <div key={q.id} className="query-card">
                <p>
                  <strong>ID:</strong> {q.id}
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

                {q.reply && (
                  <p>
                    <strong>Admin Reply:</strong> {q.reply}
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
