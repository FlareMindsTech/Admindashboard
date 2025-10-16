import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check sessionStorage token
  const token = sessionStorage.getItem("token");

  if (!token) {
    // Not logged in → redirect to login
    return <Navigate to="/auth/signin" replace />;
  }

  // Logged in → render children
  return children;
};

export default ProtectedRoute;
