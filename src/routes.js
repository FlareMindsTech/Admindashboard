// dashRoutes.js - Updated with role-based access
import React from "react";
import Dashboard from "views/Dashboard/Dashboard.js";
import Billing from "views/Dashboard/Billing.js";
import Profile from "views/Dashboard/Profile.js";
import SignIn from "views/Pages/SignIn.js";
import AdminManagement from "views/Dashboard/AdminManagement.js"; 
import UserManagement from "views/Dashboard/UserManagement.js"; 
import { MdLogout } from "react-icons/md";

import {
  HomeIcon,
  StatsIcon,
  CreditIcon,

} from "components/Icons/Icons";

import ProductManagement from "views/Dashboard/ProductManagement";

const ICON_COLOR = "#7b2cbf";

// ✅ Added: Logout component
const Logout = () => {
  localStorage.clear();
  sessionStorage.clear();
  const base = window.location.origin + window.location.pathname;
  window.location.replace(`${base}#/auth/signin`);
  return <div>Logging out...</div>;
};

// Get current user role
const getCurrentUserRole = () => {
  const userString = localStorage.getItem("user");
  if (userString) {
    try {
      const userData = JSON.parse(userString);
      return userData.role?.toLowerCase() || 'admin';
    } catch (error) {
      return 'admin';
    }
  }
  return 'admin';
};

const userRole = getCurrentUserRole();
const isSuperAdmin = userRole === 'super admin' || userRole === 'super admin';

var dashRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    rtlName: "لوحة القيادة",
    icon: <HomeIcon color="#7b2cbf" />,
    element: <Dashboard />,
    layout: "/admin",
  },
  // Show Admin Management only for super admin
  ...(isSuperAdmin ? [{
    path: "/admin-management",
    name: "Admin Management",
    rtlName: "إدارة المسؤول",
    icon: <StatsIcon color="#7b2cbf" />,
    element: <AdminManagement />,
    layout: "/admin",
  }] : []),
  {
    path: "/ProductManagement",
    name: "Product Management",
    rtlName: "إدارة المستخدمين",
    icon: <StatsIcon color="#7b2cbf" />,
    element: <ProductManagement />,     
    layout: "/admin",
  },
  {
    path: "/user-management",
    name: "User Management",
    rtlName: "إدارة المستخدمين",
    icon: <StatsIcon color="#7b2cbf" />,
    element: <UserManagement />,
    layout: "/admin",
  },
  {
    path: "/billing",
    name: "Billing",
    rtlName: "الفواتير",
    icon: <CreditIcon color="#7b2cbf" />,
    element: <Billing />,
    layout: "/admin",
  },
  { 
    path: "/profile", 
    name: "Profile", 
    element: <Profile />, 
    layout: "/admin", 
  },
  {
    path: "/signin",
    name: "Logout",
    rtlName: "تسجيل الدخول",
    icon: <MdLogout color={ICON_COLOR} />,
    element: <SignIn />,
    layout: "/auth",
  },
  {
    path: "/logout",
    name: "Logout",
    rtlName: "تسجيل الخروج",
    icon: <MdLogout color={ICON_COLOR} />,
    element: <Logout />,
    layout: "/admin",
  },
];

export default dashRoutes;