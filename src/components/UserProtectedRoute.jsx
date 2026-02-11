import React from "react";
import { Navigate } from "react-router-dom";

export default function UserProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
