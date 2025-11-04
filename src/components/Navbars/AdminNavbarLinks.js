// Chakra Icons
import { BellIcon } from "@chakra-ui/icons";

// Chakra Imports
import {
  Box,
  Button,
  Flex,
  Text,
  useColorMode,
  useColorModeValue
} from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";
import {
  ArgonLogoDark,
  ArgonLogoLight,
  ChakraLogoDark,
  ChakraLogoLight,
  ProfileIcon,
  SettingsIcon
} from "components/Icons/Icons";

export default function HeaderLinks(props) {
  const { fixed, scrolled, secondary, ...rest } = props;
  const { colorMode } = useColorMode();

  // Chakra Color Mode
  let navbarIcon =
    fixed && scrolled
      ? useColorModeValue("gray.700", "gray.200")
      : useColorModeValue("white", "gray.200");
  if (secondary) navbarIcon = "white";

  return (
    <Flex
      pe={{ sm: "0px", md: "16px" }}
      w={{ sm: "100%", md: "auto" }}
      alignItems="center"
      flexDirection="row"
    >
      {/* <SearchBar me="18px" /> */}

      {/* ✅ Updated NavLink usage */}
      <Button
        as={NavLink}
        to="auth/profile.js"
        ms="0px"
        px="0px"
        me={{ sm: "2px", md: "16px" }}
        color={navbarIcon}
        variant="no-effects"
        rightIcon={<ProfileIcon color={navbarIcon} w="22px" h="22px" />}
        _hover={{ bg: "rgba(255,255,255,0.1)" }}
      >
        <Text display={{ sm: "none", md: "flex" }}>profile</Text>
      </Button>
<SidebarResponsive 
hamburgerColor={"white"}
//  logo={ <Stack direction="row" spacing="12px" align="center" justify="center"> 
//  {/* {colorMode === "dark" ? ( <ArgonLogoLight w="74px" h="27px" /> ) : ( <ArgonLogoDark w="74px" h="27px" /> )}  */}
//  <Box w="1px" h="20px" bg={colorMode === "dark" ? "white" : "gray.700"} />
//   {/* {colorMode === "dark" ? ( <ChakraLogoLight w="82px" h="21px" /> ) : ( <ChakraLogoDark w="82px" h="21px" /> )} */}
//    </Stack> } 
   colorMode={colorMode} secondary={props.secondary} routes={routes} {...rest} />

    </Flex>
  );
} 