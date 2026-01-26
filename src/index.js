import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "layouts/Auth.js";
import AdminLayout from "layouts/Admin.js";

import { ChakraProvider } from "@chakra-ui/react";
// Custom Chakra theme
import theme from "theme/theme.js";

ReactDOM.render(
  <ChakraProvider theme={theme} resetCss={false} position="relative">
    <HashRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/auth/*" element={<AuthLayout />} />
        <Route path="/auth/signup" element={<AuthLayout />} /> 

        {/* Admin routes */}
        <Route path="/admin/*" element={<AdminLayout />} />

        {/* Default redirect logic */}
        <Route
          path="/"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/auth/signin" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/auth/signin" replace />} />
      </Routes>
    </HashRouter>
  </ChakraProvider>,
  document.getElementById("root")
);
