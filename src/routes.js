// import
import React from "react";
import Dashboard from "views/Dashboard/Dashboard.js";
import Tables from "views/Dashboard/Tables.js";
import Billing from "views/Dashboard/Billing.js";
import Profile from "views/Dashboard/Profile.js";
import SignIn from "views/Pages/SignIn.js";
import SignUp from "views/Pages/SignUp.js";
import AdminManagement from "views/Dashboard/AdminManagement.js"; 
import UserManagement from "views/Dashboard/UserManagement.js"; 
import { MdLogout } from "react-icons/md";


import {
  HomeIcon,
  StatsIcon,
  CreditIcon,
  PersonIcon,
  DocumentIcon,
  RocketIcon,
} from "components/Icons/Icons";
import { MdCategory } from "react-icons/md"; // ✅ for category icon
import ProductManagement from "views/Dashboard/ProductManagement";

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
    path: "/ProductManagement",
    name: "Product Management",
    rtlName: "إدارة المستخدمين",
    icon: <StatsIcon color="inherit" />,
    element: <ProductManagement />,     
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
    path: "/user-management",
    name: "User Management",
    rtlName: "إدارة المستخدمين",
    icon: <StatsIcon color="inherit" />,
    element: <UserManagement />,     
    layout: "/admin",
  },
  // REMOVED: AddAdminPage route
  // REMOVED: EditAdminPage route
  
  // {  
  //   path: "/billing",
  //   name: "Billing",
  //   rtlName: "الفواتير",
  //   icon: <CreditIcon color="inherit" />,
  //   element: <Billing />,
  //   layout: "/admin",
  // },
  {
    name: "ACCOUNT PAGES",
    category: "account",
    rtlName: "صفحات",
    state: "pageCollapse",
    views: [
      // {
      //   path: "/profile",
      //   name: "profiles",
      //   rtlName: "الملف الشخصي",
      //   icon: <PersonIcon color="inherit" />,
      //   secondaryNavbar: true,
      //   element: <Profile />,
      //   layout: "/admin",
      // },
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
        icon: <MdLogout color="inherit" />,
        element: <SignIn />,
        layout: "/auth",
      },
      
    ],
  },
];


export default dashRoutes;
