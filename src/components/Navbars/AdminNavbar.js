// Chakra Imports
import {
  Box,
  Flex,
  useColorModeValue,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import AdminNavbarLinks from "./AdminNavbarLinks";

export default function AdminNavbar(props) {
  const [scrolled, setScrolled] = useState(false);
  const { fixed, secondary, onOpen } = props; 

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
    <>
      {/* Background Layer - Same color as navbar */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        h={{ base: "0px", md: "130px", lg: "100px", xl: "120px" }}
        bg="#7b2cbf" // Same purple color as navbar
        zIndex="-1"
      />

      {/* Main Navbar Container */}
      <Flex
        as="nav"
        position={navbarPosition}
        align="center"
        justify="space-between"
        w={{ base: "100%", md: "100%", lg: "100%" }}
        minH={{ base: "80px", md: "60px", lg: "70px" }}
        px={{ base: "20px", md: "25px", lg: paddingX }}
        top="0"
        right="0"
        bg={navbarBg}
        borderColor={navbarBorder}
        borderWidth="1.5px"
        borderStyle="solid"
        boxShadow={navbarShadow}
        transition="all 0.25s ease-in-out"
        zIndex="1000"
      >
        {/* Mobile: Hamburger left */}
        <Box 
          display={{ base: "block", lg: "none" }}
          flex={{ base: "0", lg: "1" }}
        >
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            color="white"
            bg="transparent"
            _hover={{ bg: "rgba(255,255,255,0.2)" }}
            size="lg"
            fontSize="20px"
            onClick={onOpen}
          />
        </Box>

        {/* Mobile: Brand center - Always show "Dashboard" */}
        <Box 
          display={{ base: "block", lg: "none" }}
          flex="1"
          textAlign="center"
          mx={2}
        >
          <Box
            as={RouterLink}
            to="/admin/dashboard"
            color="white"
            fontWeight="bold"
            fontSize="xl"
            _hover={{
              color: "gray.100",
              textDecoration: "none",
            }}
          >
            Dashboard
          </Box>
        </Box>

        {/* Desktop: Empty spacer to push icons to right */}
        <Box 
          flex="1" 
          display={{ base: "none", lg: "block" }} 
        />

        {/* Right side - Only profile/user menu items */}
        <HStack 
          spacing={{ base: 3, md: 4, lg: 6 }}
          align="center"
          justify="flex-end"
          flexShrink={0}
        >
          <AdminNavbarLinks
            size={{ base: "lg", md: "xl", lg: "xl" }}
            logoText={props.logoText}
            secondary={secondary}
            fixed={fixed}
            scrolled={scrolled}
            iconSpacing={{ base: 3, md: 4, lg: 6 }}
            buttonSize={{ base: "lg", md: "xl", lg: "xl" }}
            visibility="visible"
            opacity="1"
            showHamburger={false}
          />
        </HStack>
      </Flex>

      {/* Separate Container for Brand Text - Desktop only - Always show "Dashboard" */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        minH={{ base: "70px", md: "80px", lg: "90px" }}
        px={{ base: "20px", md: "25px", lg: paddingX }}
        display={{ base: "none", lg: "flex" }}
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
        zIndex="1500"
      >
        <Box
          as={RouterLink}
          to="/admin/dashboard"
          color="white"
          fontWeight="bold"
          fontSize={{ lg: "2xl", xl: "3xl" }}
          textShadow="0 2px 4px rgba(0,0,0,0.3)"
          _hover={{
            color: "gray.100",
            textDecoration: "none",
            transform: "scale(1.05)",
            transition: "all 0.2s ease"
          }}
          pointerEvents="auto"
          textAlign="center"
        >
          Dashboard
        </Box>
      </Box>

      {/* Spacer to push content down */}
      <Box 
        h={{ 
          base: "70px",
          md: "130px", 
          lg: "140px",
          xl: "160px"
        }} 
      />
    </>
  );
}