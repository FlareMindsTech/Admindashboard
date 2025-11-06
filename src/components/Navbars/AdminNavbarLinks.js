// Chakra Imports
import {
  Box,
  Button,
  Flex,
  Text,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";
import {
  ProfileIcon,
} from "components/Icons/Icons";

export default function HeaderLinks(props) {
  const { fixed, scrolled, secondary, ...rest } = props;
  const { colorMode } = useColorMode();

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

      {/* ✅ Profile Button */}
      <Button
        as={NavLink}
        to="/admin/profile"
        ms="0px"
        px="0px"
        me={{ sm: "2px", md: "16px" }}
        color={navbarIcon}
        variant="no-effects"
        rightIcon={<ProfileIcon color={navbarIcon} w="22px" h="22px" />}
        _hover={{ bg: "rgba(255,255,255,0.1)" }}
      >
        <Text display={{ sm: "none", md: "flex" }}>Profile</Text>
      </Button>

    </Flex>
  );
}