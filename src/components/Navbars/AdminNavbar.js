// Chakra Imports
import {
  Box,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import AdminNavbarLinks from "./AdminNavbarLinks";

export default function AdminNavbar(props) {
  const [scrolled, setScrolled] = useState(false);
  // 💡 FIX: Added 'onOpen' to props destructuring
  const { fixed, secondary, brandText, onOpen } = props; 

  useEffect(() => {
    const changeNavbar = () => setScrolled(window.scrollY > 1);
    window.addEventListener("scroll", changeNavbar);
    return () => window.removeEventListener("scroll", changeNavbar);
  }, []);

  // 🎨 Colors and styles
  let mainText = useColorModeValue("gray.700", "gray.200");
  let navbarPosition = "fixed";
  let navbarShadow = "none";
  let navbarBg = "#7b2cbf"; // purple
  let navbarBorder = "transparent";
  let paddingX = "35px";

  // 🧭 Scroll + Fixed Navbar
  if (fixed === true) {
    if (scrolled === true) {
      navbarBg = useColorModeValue("white", "gray.800");
      navbarShadow = useColorModeValue("0px 7px 23px rgba(0, 0, 0, 0.1)", "none");
      navbarBorder = useColorModeValue("#E2E8F0", "rgba(255,255,255,0.1)");
    } else {
      navbarBg = useColorModeValue("#7b2cbf", "gray.800"); // keep purple at top
      navbarShadow = useColorModeValue("0px 4px 20px rgba(0, 0, 0, 0.05)", "none");
    }
  }

  // 💡 Transparent mode for overlay
  if (secondary) {
    navbarPosition = "absolute";
    mainText = "white";
    navbarBg = "transparent";
    paddingX = "30px";
  }

  return (
    <Flex
      as="nav"
      position={navbarPosition}
      align="center"
      justify="space-between"
      w="100%"
      minH={{base:"100px", md:"100px", lg:"130px"}}
      px={paddingX}
      top="0"
      bg={navbarBg}
      borderColor={navbarBorder}
      borderWidth="1.5px"
      borderStyle="solid"
      boxShadow={navbarShadow}
      transition="all 0.25s ease-in-out"
      // zIndex="1"
      zIndex={{ base: "1", md: "-1"}}
    >
      {/* ✅ Left side: Page Title only */}
      <Box
        as={RouterLink}
        to="/admin/dashboard"
        color="white"
        fontWeight="bold"
        fontSize={{ base: "md", md: "lg" }}
        _hover={{
          color: useColorModeValue("gray.100", "gray.300"),
          textDecoration: "none",
        }}
        transform={{ base: "translateX(0)", md: "translateX(300%)" }}
      >
        {brandText}
      </Box>

      {/* ✅ Right side: Profile & links */}
      <Flex align="center">
        <AdminNavbarLinks
          // 💡 FIX: Passed the 'onOpen' function to the links component
          onOpen={onOpen}
          size="xl"  
          drawerProps={{ width: "400px" }}
          logoText={props.logoText}
          secondary={secondary}
          fixed={fixed}
          scrolled={scrolled}
        />
      </Flex>
    </Flex>
  );
}