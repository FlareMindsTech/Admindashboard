// Chakra Imports
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuItem,
  MenuList,
  Text,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { BellIcon } from "@chakra-ui/icons";
import React from "react";
import { NavLink } from "react-router-dom";
import avatar1 from "assets/img/avatars/avatar1.png";
import avatar2 from "assets/img/avatars/avatar2.png";
import avatar3 from "assets/img/avatars/avatar3.png";
import {
  ProfileIcon,
} from "components/Icons/Icons";
import { ItemContent } from "components/Menu/ItemContent";
import { SidebarResponsive } from "components/Sidebar/Sidebar";
import routes from "routes.js";

export default function HeaderLinks(props) {
  const { fixed, scrolled, secondary, onOpen, ...rest } = props;
  const { colorMode } = useColorMode();

  let navbarIcon =
    fixed && scrolled
      ? useColorModeValue("gray.700", "gray.200")
      : useColorModeValue("white", "gray.200");
  let menuBg = useColorModeValue("white", "navy.800");
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
      >
        <Text display={{ sm: "none", md: "flex" }}>Profile</Text>
      </Button>

      {/* ✅ Sidebar trigger visible on mobile */}
      <SidebarResponsive
        hamburgerColor="white"
        routes={routes}
        colorMode={colorMode}
        secondary={secondary}
        onOpen={onOpen} // ✅ linked to AdminNavbar hamburger
        {...rest}
      />

      {/* ✅ Notification Menu */}
      <Menu>
        <MenuList p="16px 8px" bg={menuBg}>
          <Flex flexDirection="column">
            <MenuItem borderRadius="8px" mb="10px">
              <ItemContent
                time="13 minutes ago"
                info="from Alicia"
                boldInfo="New Message"
                aName="Alicia"
                aSrc={avatar1}
              />
            </MenuItem>
            <MenuItem borderRadius="8px" mb="10px">
              <ItemContent
                time="2 days ago"
                info="by Josh Henry"
                boldInfo="New Album"
                aName="Josh Henry"
                aSrc={avatar2}
              />
            </MenuItem>
            <MenuItem borderRadius="8px">
              <ItemContent
                time="3 days ago"
                info="Payment successfully completed!"
                aName="Kara"
                aSrc={avatar3}
              />
            </MenuItem>
          </Flex>
        </MenuList>
      </Menu>
    </Flex>
  );
}
