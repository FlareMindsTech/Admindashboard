/* eslint-disable */
import { HamburgerIcon } from "@chakra-ui/icons";
// chakra imports
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Stack,
  Text,
  useColorMode,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import IconBox from "components/Icons/IconBox";
import {
  renderThumbDark,
  renderThumbLight,
  renderTrack,
  renderTrackRTL,
  renderView,
  renderViewRTL,
} from "components/Scrollbar/Scrollbar";
import { HSeparator } from "components/Separator/Separator";
import { SidebarHelp } from "components/Sidebar/SidebarHelp";
import React from "react";
import { Scrollbars } from "react-custom-scrollbars";
import { NavLink } from "react-router-dom";

// FUNCTIONS
function Sidebar(props) {
  const { sidebarVariant, logo, routes } = props;
  const mainPanel = React.useRef();
  let variantChange = "0.2s linear";

  // Chakra color mode values
  let activeBg = useColorModeValue("white", "navy.700");
  let inactiveBg = useColorModeValue("white", "navy.700");
  let activeColor = useColorModeValue("gray.700", "white");
  let inactiveColor = useColorModeValue("gray.400", "gray.400");
  let sidebarActiveShadow = "0px 7px 11px rgba(0, 0, 0, 0.04)";
  let sidebarBg = useColorModeValue("white", "navy.800");
  let sidebarRadius = "20px";
  let sidebarMargins = "0px";

  // Generate sidebar links
  const createLinks = (routes) => {
    return routes.map((prop, key) => {
      if (prop.redirect) return null;

      if (prop.category) {
        return (
          <React.Fragment key={key}>
            <Text
              color={activeColor}
              fontWeight="bold"
              mb={{ xl: "6px" }}
              mx="auto"
              ps={{ sm: "10px", xl: "16px" }}
              py="12px"
            >
              {document.documentElement.dir === "rtl"
                ? prop.rtlName
                : prop.name}
            </Text>
            {createLinks(prop.views)}
          </React.Fragment>
        );
      }

      return (
        <NavLink to={prop.layout + prop.path} key={key}>
          {({ isActive }) => (
            <Button
              boxSize="initial"
              justifyContent="flex-start"
              alignItems="center"
              mb={{ xl: "6px" }}
              mx={{ xl: "auto" }}
              ps={{ sm: "10px", xl: "16px" }}
              py="12px"
              borderRadius="15px"
              w="100%"
              transition={variantChange}
              bg={isActive ? activeBg : "transparent"}
              color={isActive ? activeColor : inactiveColor}
              boxShadow={isActive ? sidebarActiveShadow : "none"}
              _hover="none"
              _active={{
                bg: "inherit",
                transform: "none",
                borderColor: "transparent",
              }}
              _focus={{
                boxShadow: isActive ? sidebarActiveShadow : "none",
              }}
            >
              <Flex>
                {typeof prop.icon === "string" ? (
                  <Icon>{prop.icon}</Icon>
                ) : (
                  <IconBox
                    bg={isActive ? "blue.500" : inactiveBg}
                    color={isActive ? "white" : "blue.500"}
                    h="30px"
                    w="30px"
                    me="12px"
                    transition={variantChange}
                  >
                    {prop.icon}
                  </IconBox>
                )}
                <Text my="auto" fontSize="sm">
                  {document.documentElement.dir === "rtl"
                    ? prop.rtlName
                    : prop.name}
                </Text>
              </Flex>
            </Button>
          )}
        </NavLink>
      );
    });
  };

  var links = <>{createLinks(routes)}</>;
  var brand = (
    <Box pt={"25px"} mb="12px">
      {logo}
      <HSeparator my="26px" />
    </Box>
  );

  // SIDEBAR
  return (
    <Box ref={mainPanel}>
      <Box display={{ sm: "none", xl: "block" }} position="fixed">
        <Box
          bg={sidebarBg}
          transition={variantChange}
          w="260px"
          maxW="260px"
          ms={{ sm: "16px" }}
          my={{ sm: "16px" }}
          h="calc(100vh - 32px)"
          ps="20px"
          pe="20px"
          m={sidebarMargins}
          filter="drop-shadow(0px 5px 14px rgba(0, 0, 0, 0.05))"
          borderRadius={sidebarRadius}
        >
          <Scrollbars
            autoHide
            renderTrackVertical={
              document.documentElement.dir === "rtl"
                ? renderTrackRTL
                : renderTrack
            }
            renderThumbVertical={useColorModeValue(
              renderThumbLight,
              renderThumbDark
            )}
            renderView={
              document.documentElement.dir === "rtl"
                ? renderViewRTL
                : renderView
            }
          >
            <Box>{brand}</Box>
            <Stack direction="column" mb="40px">
              <Box>{links}</Box>
            </Stack>
            {/* <SidebarHelp sidebarVariant={sidebarVariant} /> */}
          </Scrollbars>
        </Box>
      </Box>
    </Box>
  );
}

// Responsive Sidebar
export function SidebarResponsive(props) {
  const { logo, routes, hamburgerColor } = props;
  const mainPanel = React.useRef();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Chakra Color Mode
  let activeBg = useColorModeValue("white", "navy.700");
  let inactiveBg = useColorModeValue("white", "navy.700");
  let activeColor = useColorModeValue("gray.700", "white");
  let inactiveColor = useColorModeValue("gray.400", "white");
  let sidebarActiveShadow = useColorModeValue(
    "0px 7px 11px rgba(0, 0, 0, 0.04)",
    "none"
  );
  let sidebarBackgroundColor = useColorModeValue("white", "navy.800");

  // Generate links
  const createLinks = (routes) => {
    return routes.map((prop, key) => {
      if (prop.redirect) return null;

      if (prop.category) {
        return (
          <React.Fragment key={key}>
            <Text
              color={activeColor}
              fontWeight="bold"
              mb={{ xl: "6px" }}
              mx="auto"
              ps={{ sm: "10px", xl: "16px" }}
              py="12px"
            >
              {document.documentElement.dir === "rtl"
                ? prop.rtlName
                : prop.name}
            </Text>
            {createLinks(prop.views)}
          </React.Fragment>
        );
      }

      return (
        <NavLink to={prop.layout + prop.path} key={key}>
          {({ isActive }) => (
            <Button
              boxSize="initial"
              justifyContent="flex-start"
              alignItems="center"
              mb={{ xl: "6px" }}
              mx={{ xl: "auto" }}
              ps={{ sm: "10px", xl: "16px" }}
              py="12px"
              borderRadius="15px"
              w="100%"
              bg={isActive ? activeBg : "transparent"}
              color={isActive ? activeColor : inactiveColor}
              boxShadow={isActive ? sidebarActiveShadow : "none"}
              _hover="none"
              _active={{
                bg: "inherit",
                transform: "none",
                borderColor: "transparent",
              }}
              _focus={{
                boxShadow: "none",
              }}
            >
              <Flex>
                {typeof prop.icon === "string" ? (
                  <Icon>{prop.icon}</Icon>
                ) : (
                  <IconBox
                    bg={isActive ? "blue.500" : inactiveBg}
                    color={isActive ? "white" : "blue.500"}
                    h="30px"
                    w="30px"
                    me="12px"
                  >
                    {prop.icon}
                  </IconBox>
                )}
                <Text my="auto" fontSize="sm">
                  {document.documentElement.dir === "rtl"
                    ? prop.rtlName
                    : prop.name}
                </Text>
              </Flex>
            </Button>
          )}
        </NavLink>
      );
    });
  };

  var links = <>{createLinks(routes)}</>;
  var brand = (
    <Box pt={"35px"} mb="8px">
      {logo}
      <HSeparator my="26px" />
    </Box>
  );

  return (
    <Flex
      display={{ sm: "flex", xl: "none" }}
      ref={mainPanel}
      alignItems="center"
    >
      <HamburgerIcon
        color={hamburgerColor}
        w="18px"
        h="18px"
        onClick={onOpen}
      />
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        placement={document.documentElement.dir === "rtl" ? "right" : "left"}
      >
        <DrawerOverlay />
        <DrawerContent
          w="250px"
          maxW="250px"
          ms={{ sm: "16px" }}
          my={{ sm: "16px" }}
          borderRadius="16px"
          bg={sidebarBackgroundColor}
        >
          <DrawerCloseButton
            _focus={{ boxShadow: "none" }}
            _hover={{ boxShadow: "none" }}
          />
          <DrawerBody maxW="250px" px="1rem">
            <Box maxW="100%" h="100vh">
              <Box>{brand}</Box>
              <Stack direction="column" mb="40px">
                <Box>{links}</Box>
              </Stack>
              <SidebarHelp />
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}

export default Sidebar;
