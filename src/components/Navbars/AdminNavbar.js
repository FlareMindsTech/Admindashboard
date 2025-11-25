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

  // Colors
  let mainText = useColorModeValue("gray.700", "gray.200");
  let navbarBg = "#7b2cbf"; 
  let navbarShadow = "none";
  let navbarBorder = "transparent";

  if (fixed) {
    if (scrolled) {
      navbarBg = useColorModeValue("white", "gray.800");
      navbarShadow = useColorModeValue(
        "0px 7px 23px rgba(0, 0, 0, 0.1)",
        "none"
      );
      navbarBorder = useColorModeValue("#E2E8F0", "rgba(255,255,255,0.1)");
    } else {
      navbarBg = useColorModeValue("#7b2cbf", "gray.800");
      navbarShadow = "0px 4px 20px rgba(0, 0, 0, 0.05)";
    }
  }

  if (secondary) {
    mainText = "white";
    navbarBg = "transparent";
  }

  return (
    <>
      {/* Background layer – FIXED RESPONSIVE HEIGHT */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        height={{ base: "0px", md: "100px", lg: "110px", xl: "120px" }}
        bg="#7b2cbf"
        zIndex="-1"
      />

      {/* MAIN NAVBAR */}
      <Flex
        as="nav"
        position="fixed"
        top="0"
        w="100%"
        align="center"
        justify="space-between"
        px={{ base: 4, md: 6, lg: 10 }}
        minH={{ base: "70px", md: "80px", lg: "85px" }}
        bg={navbarBg}
        borderColor={navbarBorder}
        borderWidth={fixed ? "1.5px" : "0px"}
        boxShadow={navbarShadow}
        transition="all 0.25s ease"
        zIndex="1000"
      >
        {/* MOBILE: HAMBURGER */}
        <IconButton
          aria-label="Open Menu"
          icon={<HamburgerIcon />}
          display={{ base: "flex", lg: "none" }}
          color="white"
          bg="transparent"
          _hover={{ bg: "rgba(255,255,255,0.2)" }}
          onClick={onOpen}
        />

        {/* MOBILE: EMPTY CENTER HOLDER */}
        <Box
          flex="1"
          textAlign="center"
          display={{ base: "block", lg: "none" }}
        />

        {/* DESKTOP SPACER */}
        <Box flex="1" display={{ base: "none", lg: "block" }} />

        {/* RIGHT-SIDE LINKS */}
        <HStack spacing={{ base: 3, md: 4, lg: 6 }} flexShrink={0}>
          <AdminNavbarLinks
            size={{ base: "lg", md: "xl", lg: "xl" }}
            logoText={props.logoText}
            secondary={secondary}
            fixed={fixed}
            scrolled={scrolled}
            iconSpacing={{ base: 3, md: 4, lg: 6 }}
          />
        </HStack>
      </Flex>

      {/* RESPONSIVE SPACER (prevents content hiding under navbar) */}
      <Box height={{ base: "70px", md: "100px", lg: "110px", xl: "125px" }} />
    </>
  );
}
