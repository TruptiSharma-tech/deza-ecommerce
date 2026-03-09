import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children }) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const adminRoles = ["superadmin", "manager", "support", "admin"];

  const isAuthorized = currentUser && (adminRoles.includes(currentUser.role) || currentUser.isAdmin === true);

  console.log("DEBUG: AdminProtectedRoute check", {
    hasUser: !!currentUser,
    role: currentUser?.role,
    isAdmin: currentUser?.isAdmin,
    isAuthorized
  });

  if (!isAuthorized) {
    return <Navigate to="/admin-login" />;
  }

  return children;
}
