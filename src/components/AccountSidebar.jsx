import React, { useState, useEffect } from "react";
import "./AccountSidebar.css";
import { FaUser, FaEdit, FaLock, FaCog, FaSignOutAlt, FaShoppingBag, FaHeart, FaTicketAlt, FaSearchLocation } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function AccountSidebar() {
  const navigate = useNavigate();
  const { logout, user: currentUser, isAccountSidebarOpen: isOpen, setIsAccountSidebarOpen: onClose } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");

  // Edit Profile form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
    }
  }, [currentUser, isOpen]);

  const handleLogout = () => {
    logout();
    onClose(false);
  };

  const handleSaveProfile = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, name, phone };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    toast.success("Profile Updated Successfully! ✨");
  };

  const handleChangePassword = () => {
    toast.success("Password Update functionality is coming soon! (Backend connected)");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* OVERLAY */}
          <motion.div 
            className="account-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose(false)}
          />

          {/* SIDEBAR */}
          <motion.div 
            className="account-sidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn-round" onClick={() => onClose(false)}>✖</button>

            {/* HEADER AREA */}
            <div className="premium-header">
              <div className="user-avatar-premium">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-meta-premium">
                <h2>{currentUser?.name || "Premium Member"}</h2>
                <p>{currentUser?.email || "Exclusive access"}</p>
              </div>
            </div>

            {/* MENU */}
            <div className="premium-menu">
              <MenuBtn
                icon={<FaUser />}
                label="Account Overview"
                active={activeSection === "profile"}
                onClick={() => setActiveSection("profile")}
              />
              <MenuBtn
                icon={<FaEdit />}
                label="Edit Profile"
                active={activeSection === "edit"}
                onClick={() => setActiveSection("edit")}
              />
              <MenuBtn
                icon={<FaLock />}
                label="Change Password"
                active={activeSection === "password"}
                onClick={() => setActiveSection("password")}
              />
              <MenuBtn
                icon={<FaCog />}
                label="Settings"
                active={activeSection === "settings"}
                onClick={() => setActiveSection("settings")}
              />

              <div className="menu-divider" />

              <MenuBtn
                icon={<FaShoppingBag />}
                label="My Orders"
                onClick={() => { navigate("/orders"); onClose(false); }}
              />
              <MenuBtn
                icon={<FaSearchLocation />}
                label="Track Delivery"
                onClick={() => { navigate("/orders"); onClose(false); }}
              />
              <MenuBtn
                icon={<FaTicketAlt />}
                label="Support Tickets"
                onClick={() => { navigate("/my-tickets"); onClose(false); }}
              />

              <div className="menu-divider" />

              <MenuBtn
                icon={<FaSignOutAlt />}
                label="Logout"
                onClick={handleLogout}
                className="logout-premium"
              />
            </div>

            {/* CONTENT AREA */}
            <div className="premium-content">
              {activeSection === "profile" && (
                <div className="premium-panel">
                  <h3>My Profile</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Full Name</label>
                      <p>{name || "Not Set"}</p>
                    </div>
                    <div className="info-item">
                      <label>Email Address</label>
                      <p>{currentUser?.email}</p>
                    </div>
                    <div className="info-item">
                      <label>Contact Number</label>
                      <p>{phone || "Add phone to get updates"}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "edit" && (
                <div className="premium-panel">
                  <h3>Update Profile</h3>
                  <div className="premium-form">
                    <div className="input-group">
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
                    </div>
                    <div className="input-group">
                      <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" />
                    </div>
                    <button className="premium-btn" onClick={handleSaveProfile}>Save Changes</button>
                  </div>
                </div>
              )}

              {activeSection === "password" && (
                <div className="premium-panel">
                  <h3>Change Password</h3>
                  <div className="premium-form">
                    <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <button className="premium-btn gold" onClick={handleChangePassword}>Update Password</button>
                  </div>
                </div>
              )}

              {activeSection === "settings" && (
                <div className="premium-panel">
                  <h3>Settings</h3>
                  <div className="setting-toggle">
                    <span>Email Notifications</span>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className="setting-toggle">
                    <span>Two-Factor Auth</span>
                    <input type="checkbox" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MenuBtn({ icon, label, active, onClick, className = "" }) {
  return (
    <button className={`menu-btn-premium ${active ? "active" : ""} ${className}`} onClick={onClick}>
      <span className="menu-icon">{icon}</span>
      <span className="menu-label">{label}</span>
    </button>
  );
}
