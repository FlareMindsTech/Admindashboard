// Admin.js
import {
  Portal,
  useDisclosure,
  Stack,
  Box,
  useColorMode,
} from "@chakra-ui/react";
import { Image } from "@chakra-ui/react";
import FlareLogo from "assets/img/Aadvi-logo.png";

// Layout components
import Sidebar, { SidebarResponsive } from "components/Sidebar/Sidebar.js";
import AdminNavbar from "components/Navbars/AdminNavbar.js";
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import routes from "routes.js";
// Custom Chakra theme
import FixedPlugin from "components/FixedPlugin/FixedPlugin";
// Custom components
import MainPanel from "components/Layout/MainPanel";
import PanelContainer from "components/Layout/PanelContainer";
import PanelContent from "components/Layout/PanelContent";

export default function Dashboard(props) {
  const { ...rest } = props;
  const [fixed, setFixed] = useState(false);
  const { colorMode } = useColorMode();
  
  // Separate drawer states to prevent conflicts
  const { isOpen: isSidebarOpen, onOpen: onSidebarOpen, onClose: onSidebarClose } = useDisclosure();
  const { isOpen: isPluginOpen, onOpen: onPluginOpen, onClose: onPluginClose } = useDisclosure();

  document.documentElement.dir = "ltr";

  // ✅ Only include routes with layout "/admin" — skip auth routes
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.collapse) return getRoutes(prop.views);
      if (prop.category === "account") return getRoutes(prop.views);
      if (prop.layout === "/auth") return null;
      if (prop.layout === "/admin") {
        return <Route path={prop.path} element={prop.element} key={key} />;
      }
      return null;
    });
  };

  const getRoute = () => {
    return window.location.pathname !== "/admin/full-screen-maps";
  };

  const getActiveRoute = (routes) => {
    let activeRoute = "Default Brand Text";
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveRoute = getActiveRoute(routes[i].views);
        if (collapseActiveRoute !== activeRoute) return collapseActiveRoute;
      } else if (routes[i].category) {
        let categoryActiveRoute = getActiveRoute(routes[i].views);
        if (categoryActiveRoute !== activeRoute) return categoryActiveRoute;
      } else if (
        window.location.href.indexOf(routes[i].layout + routes[i].path) !== -1
      ) {
        return routes[i].name;
      }
    }
    return activeRoute;
  };

  const getActiveNavbar = (routes) => {
    let activeNavbar = false;
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].category) {
        let categoryActiveNavbar = getActiveNavbar(routes[i].views);
        if (categoryActiveNavbar !== activeNavbar) return categoryActiveNavbar;
      } else if (
        window.location.href.indexOf(routes[i].layout + routes[i].path) !== -1
      ) {
        if (routes[i].secondaryNavbar) return routes[i].secondaryNavbar;
      }
    }
    return activeNavbar;
  };

  return (
    <Box>
      <Box
        minH={{
          base: "12vh",     // 320px - 480px
          sm: "13vh",       // 481px - 767px  
          md: "14vh",       // 768px - 1024px
          lg: "15vh",       // 1025px - 1280px
          xl: "15vh",       // 1281px +
          "2xl": "15vh"     // Extra large
        }}
        
        w="100%"
        position="fixed"
        bgSize="cover"
        top="0"
      />
      
      {/* Mobile Sidebar - Show on smaller screens */}
      <SidebarResponsive
        logo={
          <Stack direction="row" spacing="12px" align="center" justify="center">
            <Image 
              src={FlareLogo} 
              alt="Flare Logo" 
              w={{
                base: "80px",   // 320px - 480px
                sm: "90px",     // 481px - 767px
                md: "100px",    // 768px - 1024px
              }} 
              h="auto" 
            />
            <Box w="1px" h="20px" />
          </Stack>
        }
        routes={routes.filter(
          (r) => !(r.layout === "/auth" && r.path === "/signin")
        )}
        hamburgerColor="white"
        isOpen={isSidebarOpen}
        onOpen={onSidebarOpen}
        onClose={onSidebarClose}
      />
      
      {/* Desktop Sidebar - Show on larger screens */}
      <Sidebar
        routes={routes.filter(
          (r) => !(r.layout === "/auth" && r.path === "/signin")
        )}
        logo={
          <Stack direction="row" spacing="12px" align="center" justify="center">
            <Image 
              src={FlareLogo} 
              alt="Flare Logo" 
              w={{
                base: "80px",   // 320px - 480px
                sm: "90px",     // 481px - 767px  
                md: "100px",    // 768px - 1024px
                lg: "100px",    // 1025px - 1280px
                xl: "100px",    // 1281px +
              }} 
              h="auto" 
            />
            <Box w="1px" h="20px" />
          </Stack>
        }
        {...rest}
      />
      
      <MainPanel
        w={{
          base: "100%",     // 320px - 480px
          sm: "100%",       // 481px - 767px
          md: "100%",       // 768px - 1024px
          lg: "calc(100% - 240px)",       // 1025px - 1280px
          xl: "calc(100% - 275px)", // 1281px +
          "2xl": "calc(100% - 275px)" // Extra large
        }}
        
        transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)"
      >
        <Portal>
          <AdminNavbar
            onOpen={onSidebarOpen} // This now opens the mobile sidebar
            brandText={getActiveRoute(routes)}
            secondary={getActiveNavbar(routes)}
            fixed={fixed}
            {...rest}
          />
        </Portal>
        {getRoute() ? (
          <PanelContent>
            <PanelContainer
              px={{
                base: "15px", // 320px - 480px
                sm: "20px",   // 481px - 767px
                md: "25px",   // 768px - 1024px
                lg: "30px",   // 1025px - 1280px
                xl: "35px",   // 1281px +
              }}
              py={{
                base: "15px", // 320px - 480px
                sm: "20px",   // 481px - 767px
                md: "25px",   // 768px - 1024px
                lg: "30px",   // 1025px - 1280px
                xl: "35px",   // 1281px +
              }}
            >
              <Routes>
                {getRoutes(routes)}
                <Route
                  path="/admin"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
              </Routes>
            </PanelContainer>
          </PanelContent>
        ) : null}
        <Portal>
          <FixedPlugin
            secondary={getActiveNavbar(routes)}
            fixed={fixed}
            onOpen={onPluginOpen} // This opens the plugin drawer separately
          />
        </Portal>
      </MainPanel>
    </Box>
  );
}