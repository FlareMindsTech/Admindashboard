// import
import React from "react";
import Dashboard from "views/Dashboard/Dashboard.js";
import Tables from "views/Dashboard/Tables.js";
import Billing from "views/Dashboard/Billing.js";
import Profile from "views/Dashboard/Profile.js";
import SignIn from "views/Pages/SignIn.js";
import SignUp from "views/Pages/SignUp.js";
import AdminManagement from "views/Dashboard/AdminManagement.js"; // Only default import

import {
  HomeIcon,
  StatsIcon,
  CreditIcon,
  PersonIcon,
  DocumentIcon,
  RocketIcon,
} from "components/Icons/Icons";

var dashRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    rtlName: "لوحة القيادة",
    icon: <HomeIcon color="inherit" />,
    element: <Dashboard />,   
    layout: "/admin",
  },
  {
    path: "/admin-management",
    name: "Admin Management",
    rtlName: "إدارة المسؤول",
    icon: <StatsIcon color="inherit" />,
    element: <AdminManagement />,     
    layout: "/admin",
  },
  {
    path: "/tables",
    name: "User Management",
    rtlName: "لوحة القيادة",
    icon: <StatsIcon color="inherit" />,
    element: <Dashboard />,     
    layout: "/user",
  },
  {
    path: "/billing",
    name: "Billing",
    rtlName: "لوحة القيادة",
    icon: <CreditIcon color="inherit" />,
    element: <Billing />,     
    layout: "/admin",
  },
  {
    name: "ACCOUNT PAGES",
    category: "account",
    rtlName: "صفحات",
    state: "pageCollapse",
    views: [
      {
        path: "/profile",
        name: "Profile",
        rtlName: "لوحة القيادة",
        icon: <PersonIcon color="inherit" />,
        secondaryNavbar: true,
        element: <Profile />,   
        layout: "/admin",
      },
      {
        path: "/signin",
        name: "Login",
        rtlName: "لوحة القيادة",
        icon: <DocumentIcon color="inherit" />,
        element: <SignIn />,    
        layout: "/auth",
      },
    ],
  },
];

export default dashRoutes;