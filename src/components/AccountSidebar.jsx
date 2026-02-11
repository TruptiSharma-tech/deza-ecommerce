import React, { useState, useEffect } from "react";
import "./AccountSidebar.css";

export default function AccountSidebar({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState("profile");
  const [user, setUser] = useState(null);

  // Edit Profile form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    setUser(currentUser);

    if (currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    alert("Logged out successfully 👋");
    onClose();
    window.location.reload();
  };

  const handleSaveProfile = () => {
    if (!user) return;

    const updatedUser = { ...user, name, phone };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    // Update in registered users list
    const allUsers = JSON.parse(localStorage.getItem("users")) || [];
    const updatedUsers = allUsers.map((u) =>
      u.email === user.email ? updatedUser : u,
    );
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    alert("✅ Profile Updated Successfully!");
    setUser(updatedUser);
  };

  const handleChangePassword = () => {
    if (!user) return;

    if (currentPassword !== user.password) {
      alert("❌ Current password is incorrect!");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("❌ New passwords do not match!");
      return;
    }

    const updatedUser = { ...user, password: newPassword };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    const allUsers = JSON.parse(localStorage.getItem("users")) || [];
    const updatedUsers = allUsers.map((u) =>
      u.email === user.email ? updatedUser : u,
    );
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    alert("✅ Password updated successfully!");
    setUser(updatedUser);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Wishlist + Orders Data
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  const orders = JSON.parse(localStorage.getItem("dezaOrders")) || [];

  return (
    <div className="account-overlay">
      <div className="account-sidebar">
        {/* HEADER */}
        <div className="account-header">
          <h2>My Account</h2>
          <button className="close-btn" onClick={onClose}>
            ✖
          </button>
        </div>

        {/* USER INFO */}
        <div className="account-user">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-details">
            <h3>{user?.name || "Guest User"}</h3>
            <p>{user?.email || "Not Logged In"}</p>
          </div>
        </div>

        {/* MENU */}
        <div className="account-menu">
          <button
            className={activeSection === "profile" ? "active" : ""}
            onClick={() => setActiveSection("profile")}
          >
            👤 Profile
          </button>

          <button
            className={activeSection === "edit" ? "active" : ""}
            onClick={() => setActiveSection("edit")}
          >
            ✏️ Edit Profile
          </button>

          <button
            className={activeSection === "password" ? "active" : ""}
            onClick={() => setActiveSection("password")}
          >
            🔒 Change Password
          </button>

          <button
            className={activeSection === "settings" ? "active" : ""}
            onClick={() => setActiveSection("settings")}
          >
            ⚙️ Settings
          </button>

          <button className="logout-sidebar-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>

        {/* CONTENT */}
        <div className="account-content">
          {/* PROFILE */}
          {activeSection === "profile" && (
            <div className="section-box">
              <h3>👤 Profile Overview</h3>
              <p>
                <b>Name:</b> {user?.name || "Not Set"}
              </p>
              <p>
                <b>Email:</b> {user?.email || "Not Available"}
              </p>
              <p>
                <b>Phone:</b> {user?.phone || "Not Set"}
              </p>
            </div>
          )}

          {/* EDIT PROFILE */}
          {activeSection === "edit" && (
            <div className="section-box">
              <h3>✏️ Edit Profile</h3>

              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label>Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <button className="save-btn" onClick={handleSaveProfile}>
                Save Changes
              </button>
            </div>
          )}

          {/* CHANGE PASSWORD */}
          {activeSection === "password" && (
            <div className="section-box">
              <h3>🔒 Change Password</h3>

              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />

              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button className="save-btn" onClick={handleChangePassword}>
                Save Password
              </button>
            </div>
          )}

          {/* SETTINGS */}
          {activeSection === "settings" && (
            <div className="section-box">
              <h3>⚙️ Settings</h3>
              <p>Coming soon... premium settings page 💛</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
