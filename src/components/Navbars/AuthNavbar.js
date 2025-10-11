// Chakra imports
import {
  Box,
  Button,
  Flex,
  HStack,
  Link,
  Stack,
  Text,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";

import {
  ArgonLogoDark,
  ArgonLogoLight,
  ChakraLogoBlue,
  ChakraLogoDark,
  ChakraLogoLight,
  DocumentIcon,
  HomeIcon,
  PersonIcon,
  RocketIcon,
} from "components/Icons/Icons";

import { SidebarResponsive } from "components/Sidebar/Sidebar";
import React from "react";
import { NavLink } from "react-router-dom";
import routes from "routes.js";

export default function AuthNavbar(props) {
  const { logo, logoText, secondary, ...rest } = props;
  const { colorMode } = useColorMode();

  // Chakra color mode
  let mainText = "white";
  let navbarIcon = "white";
  let navbarBg = "none";
  let navbarBorder = "none";
  let navbarShadow = "initial";
  let navbarFilter = "initial";
  let navbarBackdrop = "none";
  let bgButton = useColorModeValue("white", "navy.900");
  let colorButton = useColorModeValue("gray.700", "white");
  let navbarPosition = "absolute";
  let hamburgerColor = {
    base: useColorModeValue("gray.700", "white"),
    md: "white",
  };

  // Brand
  let brand = (
    <Link
      href={`${process.env.PUBLIC_URL}/#/`}
      target="_blank"
      display="flex"
      lineHeight="100%"
      fontWeight="bold"
      justifyContent="center"
      alignItems="center"
      color={mainText}
    >
      <Stack direction="row" spacing="12px" align="center" justify="center">
        {/* <ArgonLogoLight w="74px" h="27px" /> */}
        {/* <Box w="1px" h="20px" bg={"white"} /> */}
        {/* <ChakraLogoBlue w="82px" h="21px" /> */}
      </Stack>
      <Text fontSize="sm" mt="3px">
        {logoText}
      </Text>
    </Link>
  );

  hamburgerColor = { base: "white" };

  // ✅ Updated NavLink for v6
  // var linksAuth = (
  //   <HStack display={{ sm: "none", lg: "flex" }}>
  //     <NavLink
  //       to="/admin/dashboard"
  //       className={({ isActive }) => (isActive ? "active-link" : "")}
  //     >
  //       <Button
  //         fontSize="sm"
  //         color={navbarIcon}
  //         variant="no-effects"
  //         leftIcon={<HomeIcon color={navbarIcon} w="12px" h="12px" />}
  //       >
  //         <Text>Dashboard</Text>
  //       </Button>
  //     </NavLink>

  //     <NavLink
  //       to="/admin/profile"
  //       className={({ isActive }) => (isActive ? "active-link" : "")}
  //     >
  //       <Button
  //         fontSize="sm"
  //         color={navbarIcon}
  //         variant="no-effects"
  //         leftIcon={<PersonIcon color={navbarIcon} w="12px" h="12px" />}
  //       >
  //         <Text>Profile</Text>
  //       </Button>
  //     </NavLink>

  //     <NavLink
  //       to="/auth/signin"
  //       className={({ isActive }) => (isActive ? "active-link" : "")}
  //     >
  //       <Button
  //         fontSize="sm"
  //         color={navbarIcon}
  //         variant="no-effects"
  //         leftIcon={<DocumentIcon color={navbarIcon} w="12px" h="12px" />}
  //       >
  //         <Text>Sign In </Text>
  //       </Button>
  //     </NavLink>
  //   </HStack>
  // );

  return (
    <Flex
      position={navbarPosition}
      top="16px"
      left="50%"
      transform="translate(-50%, 0px)"
      background={navbarBg}
      border={navbarBorder}
      boxShadow={navbarShadow}
      filter={navbarFilter}
      backdropFilter={navbarBackdrop}
      borderRadius="15px"
      px="16px"
      py="22px"
      mx="auto"
      width="1044px"
      maxW="90%"
      alignItems="center"
      zIndex="3"
    >
      <Flex w="100%" justifyContent={{ sm: "start", lg: "space-between" }}>
        {brand}
        <Box
          ms={{ base: "auto", lg: "0px" }}
          display={{ base: "flex", lg: "none" }}
        >
          <SidebarResponsive
            hamburgerColor={hamburgerColor}
            logoText={props.logoText}
            secondary={props.secondary}
            routes={routes}
            logo={
              <Stack direction="row" spacing="12px" align="center" justify="center">
                {colorMode === "dark" ? (
                  <ArgonLogoLight w="74px" h="27px" />
                ) : (
                  <ArgonLogoDark w="74px" h="27px" />
                )}
                <Box
                  w="1px"
                  h="20px"
                  bg={colorMode === "dark" ? "white" : "gray.700"}
                />
                {colorMode === "dark" ? (
                  <ChakraLogoLight w="82px" h="21px" />
                ) : (
                  <ChakraLogoDark w="82px" h="21px" />
                )}
              </Stack>
            }
            {...rest}
          />
        </Box>
        {/* {linksAuth} */}
       
      </Flex>
    </Flex>
  );
}
