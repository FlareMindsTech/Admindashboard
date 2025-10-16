import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "theme/theme.js";

import AuthLayout from "layouts/Auth.js";
import AdminLayout from "layouts/Admin.js";
import ProtectedRoute from "./components/protectedRoutes";

ReactDOM.render(
  <ChakraProvider theme={theme} resetCss={false}>
    <HashRouter>
      <Routes>
        {/* Public auth pages */}
        <Route path="/auth/*" element={<AuthLayout />} />

        {/* Protected admin pages */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/auth/signin" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/auth/signin" replace />} />
      </Routes>
    </HashRouter>
  </ChakraProvider>,
  document.getElementById("root")
);
