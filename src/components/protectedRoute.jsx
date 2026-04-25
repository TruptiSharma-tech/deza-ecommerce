import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("currentUser"));
  } catch(e) {}

  if (!user) {
    return <Navigate to="/admin-login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/admin-login" />;
  }

  return children;
}
