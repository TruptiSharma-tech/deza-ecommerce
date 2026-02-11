import React, { useState } from "react";
import "./AdminChangePassword.css";

export default function AdminChangePassword() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleChangePassword = (e) => {
    e.preventDefault();

    const adminData = JSON.parse(localStorage.getItem("adminAccount"));

    if (oldPass !== adminData.password) {
      alert("❌ Old password is incorrect!");
      return;
    }

    if (newPass.length < 6) {
      alert("⚠ Password must be at least 6 characters!");
      return;
    }

    if (newPass !== confirmPass) {
      alert("❌ New passwords do not match!");
      return;
    }

    adminData.password = newPass;
    localStorage.setItem("adminAccount", JSON.stringify(adminData));

    alert("✅ Password Changed Successfully!");

    setOldPass("");
    setNewPass("");
    setConfirmPass("");
  };

  return (
    <div className="admin-pass-card">
      <h3>Change Admin Password 🔐</h3>

      <form onSubmit={handleChangePassword}>
        <input
          type="password"
          placeholder="Enter old password"
          value={oldPass}
          onChange={(e) => setOldPass(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Enter new password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          required
        />

        <button type="submit">Update Password</button>
      </form>
    </div>
  );
}
