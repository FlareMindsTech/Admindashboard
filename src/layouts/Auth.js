// chakra imports
import { Box, Portal } from "@chakra-ui/react";
import Footer from "components/Footer/Footer.js";
// core components
import AuthNavbar from "components/Navbars/AuthNavbar.js";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import routes from "routes.js";

export default function Pages(props) {
  const { ...rest } = props;
  // ref for the wrapper div
  const wrapper = React.createRef();
  React.useEffect(() => {
    document.body.style.overflow = "unset";
    return function cleanup() {};
  });

  const getActiveRoute = (routes) => {
    let activeRoute = "Default Brand Text";
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveRoute = getActiveRoute(routes[i].views);
        if (collapseActiveRoute !== activeRoute) {
          return collapseActiveRoute;
        }
      } else if (routes[i].category) {
        let categoryActiveRoute = getActiveRoute(routes[i].views);
        if (categoryActiveRoute !== activeRoute) {
          return categoryActiveRoute;
        }
      } else {
        if (
          window.location.href.indexOf(routes[i].layout + routes[i].path) !== -1
        ) {
          return routes[i].name;
        }
      }
    }
    return activeRoute;
  };

  const getActiveNavbar = (routes) => {
    let activeNavbar = false;
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].category) {
        let categoryActiveNavbar = getActiveNavbar(routes[i].views);
        if (categoryActiveNavbar !== activeNavbar) {
          return categoryActiveNavbar;
        }
      } else {
        if (
          window.location.href.indexOf(routes[i].layout + routes[i].path) !== -1
        ) {
          if (routes[i].secondaryNavbar) {
            return routes[i].secondaryNavbar;
          }
        }
      }
    }
    return activeNavbar;
  };

  // ✅ Fixed to use element (instead of component) so SignUp & SignIn work
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.collapse) {
        return getRoutes(prop.views);
      }
      if (prop.category === "account") {
        return getRoutes(prop.views);
      }
      if (prop.layout === "/auth") {
        return (
          <Route
            path={prop.path}
            element={prop.element}
            key={key}
          />
        );
      }
      return null;
    });
  };

  const navRef = React.useRef();
  document.documentElement.dir = "ltr";

  return (
    <Box ref={navRef} w="100%">
      <Portal containerRef={navRef}>
        <AuthNavbar secondary={getActiveNavbar(routes)} logoText="" />
      </Portal>
      <Box w="100%">
        <Box ref={wrapper} w="100%">
          <Routes>
            {getRoutes(routes)}
            {/* ✅ Default /auth redirect */}
            <Route path="/auth" element={<Navigate to="/auth/signin" replace />} />
          </Routes>
        </Box>
      </Box>
      <Box px="24px" mx="auto" width="1044px" maxW="100%" mt="60px">
        <Footer />
      </Box>
    </Box>
  );
}
