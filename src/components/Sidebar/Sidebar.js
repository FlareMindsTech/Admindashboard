/* eslint-disable */
import { HamburgerIcon } from "@chakra-ui/icons";
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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Image,
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
import React, { useRef, useState } from "react";
import { Scrollbars } from "react-custom-scrollbars";
import { NavLink } from "react-router-dom";
import FlareMindslogo from "assets/img/fm logo.png"; 

function Sidebar(props) {
  const { sidebarVariant, logo, routes } = props;
  const mainPanel = React.useRef();
  const variantChange = "0.2s linear";

  const activeBg = useColorModeValue("#7b2cbf", "#7b2cbf"); // Purple background when active
  const inactiveBg = useColorModeValue("white", "navy.700");
  const activeColor = useColorModeValue("white", "white"); // White text when active
  const inactiveColor = useColorModeValue("gray.400", "gray.400");
  const sidebarActiveShadow = "0px 7px 11px rgba(0, 0, 0, 0.04)";
  const sidebarBg = useColorModeValue("white", "navy.800");
  const sidebarRadius = "20px";
  const sidebarMargins = "0px";

  // Desktop logout / signin dialog state
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isSigninPromptOpen, setIsSigninPromptOpen] = useState(false);
  const logoutCancelRef = useRef();
  const signinCancelRef = useRef();
  const toast = useToast();

  const openLogout = () => setIsLogoutOpen(true);
  const closeLogout = () => setIsLogoutOpen(false);
  const openSigninPrompt = () => setIsSigninPromptOpen(true);
  const closeSigninPrompt = () => setIsSigninPromptOpen(false);

  const handleConfirmLogout = () => {
    try {
      closeLogout();
      localStorage.clear();
      sessionStorage.clear();
      toast({
        title: "Logged out successfully",
        description: "Redirecting to the sign-in page...",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      const base = window.location.origin + window.location.pathname;
      window.location.replace(`${base}#/auth/signin`);
    } catch (err) {
      toast({
        title: "Logout failed",
        description: err?.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleGoToSignIn = () => {
    closeSigninPrompt();
    const base = window.location.origin + window.location.pathname;
    window.location.replace(`${base}#/auth/signin`);
  };

  const createLinks = (routes) =>
    routes.map((prop, key) => {
      if (prop.redirect) return null;

      if (prop.category) {
        return (
          <React.Fragment key={key}>
            <Text
              color={activeColor}
              fontWeight="bold"
              mb={{ 
                base: "4px",    // 320px - 480px
                sm: "5px",      // 481px - 767px
                md: "6px",      // 768px - 1024px
                lg: "6px",      // 1025px - 1280px
                xl: "6px"       // 1281px +
              }}
              mx="auto"
              ps={{ 
                base: "8px",    // 320px - 480px
                sm: "9px",      // 481px - 767px
                md: "10px",     // 768px - 1024px
                lg: "12px",     // 1025px - 1280px
                xl: "16px"      // 1281px +
              }}
              py={{
                base: "8px",    // 320px - 480px
                sm: "10px",     // 481px - 767px
                md: "12px",     // 768px - 1024px
                lg: "12px",     // 1025px - 1280px
                xl: "12px"      // 1281px +
              }}
              fontSize={{
                base: "xs",     // 320px - 480px
                sm: "sm",       // 481px - 767px
                md: "sm",       // 768px - 1024px
                lg: "sm",       // 1025px - 1280px
                xl: "sm"        // 1281px +
              }}
            >
              {document.documentElement.dir === "rtl" ? prop.rtlName : prop.name}
            </Text>
            {createLinks(prop.views)}
          </React.Fragment>
        );
      }

      if (!prop.icon) return null;

      // If logout route, intercept and show dialogs
      if (prop.path === "/logout") {
        return (
          <Button
            key={key}
            boxSize="initial"
            justifyContent="flex-start"
            alignItems="center"
            mb={{ base: "4px", sm: "5px", md: "6px", lg: "6px", xl: "6px" }}
            mx={{ base: "auto", sm: "auto", md: "auto", lg: "auto", xl: "auto" }}
            ps={{ base: "8px", sm: "9px", md: "10px", lg: "12px", xl: "16px" }}
            py={{ base: "8px", sm: "10px", md: "12px", lg: "12px", xl: "12px" }}
            borderRadius="15px"
            w="100%"
            bg={"transparent"}
            color={inactiveColor}
            boxShadow={"none"}
            _hover={{ bg: "gray.50" }}
            _active={{ bg: activeBg, transform: "none", borderColor: "transparent" }}
            _focus={{ boxShadow: "none" }}
            onClick={() => {
              const user = localStorage.getItem("user") || sessionStorage.getItem("user");
              if (!user) {
                // If not logged in, prompt to go to sign-in
                openSigninPrompt();
                return;
              }
              openLogout();
            }}
          >
            <Flex>
              <IconBox
                bg={inactiveBg}
                color={"blue.500"}
                h={{ base: "24px", sm: "26px", md: "28px", lg: "30px", xl: "30px" }}
                w={{ base: "24px", sm: "26px", md: "28px", lg: "30px", xl: "30px" }}
                me={{ base: "8px", sm: "10px", md: "12px", lg: "12px", xl: "12px" }}
                transition="all 0.2s ease-in-out"
              >
                {prop.icon}
              </IconBox>
              <Text my="auto" fontSize={{ base: "xs", sm: "sm", md: "sm", lg: "sm", xl: "sm" }}>
                {document.documentElement.dir === "rtl" ? prop.rtlName : prop.name}
              </Text>
            </Flex>
          </Button>
        );
      }

      return (
        <NavLink to={prop.layout + prop.path} key={key}>
          {({ isActive }) => (
            <Button
              boxSize="initial"
              justifyContent="flex-start"
              alignItems="center"
              mb={{ 
                base: "4px",    // 320px - 480px
                sm: "5px",      // 481px - 767px
                md: "6px",      // 768px - 1024px
                lg: "6px",      // 1025px - 1280px
                xl: "6px"       // 1281px +
              }}
              mx={{ 
                base: "auto",   // 320px - 480px
                sm: "auto",     // 481px - 767px
                md: "auto",     // 768px - 1024px
                lg: "auto",     // 1025px - 1280px
                xl: "auto"      // 1281px +
              }}
              ps={{ 
                base: "8px",    // 320px - 480px
                sm: "9px",      // 481px - 767px
                md: "10px",     // 768px - 1024px
                lg: "12px",     // 1025px - 1280px
                xl: "16px"      // 1281px +
              }}
              py={{
                base: "8px",    // 320px - 480px
                sm: "10px",     // 481px - 767px
                md: "12px",     // 768px - 1024px
                lg: "12px",     // 1025px - 1280px
                xl: "12px"      // 1281px +
              }}
              borderRadius="15px"
              w="100%"
              bg={isActive ? activeBg : "transparent"}
              color={isActive ? activeColor : inactiveColor}
              boxShadow={isActive ? sidebarActiveShadow : "none"}
              _hover={{
                bg: isActive ? activeBg : "gray.50",
              }}
              _active={{
                bg: activeBg,
                transform: "none",
                borderColor: "transparent",
              }}
              _focus={{ boxShadow: "none" }}
            >
              <Flex>
                <IconBox
                  bg={isActive ? "white" : inactiveBg} // White background when active
                  color={isActive ? "#7b2cbf" : "blue.500"} // Purple icon when active, blue when inactive
                  h={{
                    base: "24px",  // 320px - 480px
                    sm: "26px",    // 481px - 767px
                    md: "28px",    // 768px - 1024px
                    lg: "30px",    // 1025px - 1280px
                    xl: "30px"     // 1281px +
                  }}
                  w={{
                    base: "24px",  // 320px - 480px
                    sm: "26px",    // 481px - 767px
                    md: "28px",    // 768px - 1024px
                    lg: "30px",    // 1025px - 1280px
                    xl: "30px"     // 1281px +
                  }}
                  me={{
                    base: "8px",   // 320px - 480px
                    sm: "10px",    // 481px - 767px
                    md: "12px",    // 768px - 1024px
                    lg: "12px",    // 1025px - 1280px
                    xl: "12px"     // 1281px +
                  }}
                  transition="all 0.2s ease-in-out"
                >
                  {prop.icon}
                </IconBox>
                <Text my="auto" fontSize={{
                  base: "xs",     // 320px - 480px
                  sm: "sm",       // 481px - 767px
                  md: "sm",       // 768px - 1024px
                  lg: "sm",       // 1025px - 1280px
                  xl: "sm"        // 1281px +
                }}>
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

  const links = <>{createLinks(routes)}</>;

  const brand = (
    <Box pt={{
      base: "15px",  // 320px - 480px
      sm: "20px",    // 481px - 767px
      md: "25px",    // 768px - 1024px
      lg: "25px",    // 1025px - 1280px
      xl: "25px"     // 1281px +
    }} mb={{
      base: "8px",   // 320px - 480px
      sm: "10px",    // 481px - 767px
      md: "12px",    // 768px - 1024px
      lg: "12px",    // 1025px - 1280px
      xl: "12px"     // 1281px +
    }}>
      {logo}
      <HSeparator my={{
        base: "20px", // 320px - 480px
        sm: "22px",   // 481px - 767px
        md: "24px",   // 768px - 1024px
        lg: "26px",   // 1025px - 1280px
        xl: "26px"    // 1281px +
      }} />
    </Box>
  );

  return (
    <Box ref={mainPanel}>
      {/* Desktop Sidebar - Show on lg screens and above */}
      <Box
        display={{ 
          base: "none",  // 320px - 480px
          sm: "none",    // 481px - 767px
          md: "none",    // 768px - 1024px
          lg: "block",   // 1025px - 1280px
          xl: "block"    // 1281px +
        }}
        position="fixed"
        top={{
          base: "40px",  // 320px - 480px
          sm: "45px",    // 481px - 767px
          md: "50px",    // 768px - 1024px
          lg: "50px",    // 1025px - 1280px
          xl: "50px"     // 1281px +
        }}
        left={{
          base: "12px",  // 320px - 480px
          sm: "14px",    // 481px - 767px
          md: "16px",    // 768px - 1024px
          lg: "16px",    // 1025px - 1280px
          xl: "16px"     // 1281px +
        }}
        zIndex="9999"
      >
        <Box
          bg={sidebarBg}
          transition={variantChange}
          w={{
            base: "240px",  // 320px - 480px
            sm: "250px",    // 481px - 767px
            md: "260px",    // 768px - 1024px
            lg: "250px",    // 1025px - 1280px
            xl: "260px"     // 1281px +
          }}
          maxW={{
            base: "240px",  // 320px - 480px
            sm: "250px",    // 481px - 767px
            md: "260px",    // 768px - 1024px
            lg: "260px",    // 1025px - 1280px
            xl: "260px"     // 1281px +
          }}
          h={{
            base: "calc(100vh - 60px)",  // 320px - 480px
            sm: "calc(100vh - 65px)",    // 481px - 767px
            md: "calc(100vh - 66px)",    // 768px - 1024px
            lg: "calc(100vh - 66px)",    // 1025px - 1280px
            xl: "calc(100vh - 66px)"     // 1281px +
          }}
          ps={{
            base: "15px",  // 320px - 480px
            sm: "18px",    // 481px - 767px
            md: "20px",    // 768px - 1024px
            lg: "20px",    // 1025px - 1280px
            xl: "20px"     // 1281px +
          }}
          pe={{
            base: "15px",  // 320px - 480px
            sm: "18px",    // 481px - 767px
            md: "20px",    // 768px - 1024px
            lg: "20px",    // 1025px - 1280px
            xl: "20px"     // 1281px +
          }}
          m={sidebarMargins}
          filter="drop-shadow(1px 5px 14px rgba(0, 0, 0, 0.05))"
          borderRadius={sidebarRadius}
          display="flex"
          flexDirection="column"
        >
          <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
            <Box>{brand}</Box>
            <Stack direction="column" mb={{
              base: "30px", // 320px - 480px
              sm: "35px",   // 481px - 767px
              md: "40px",   // 768px - 1024px
              lg: "40px",   // 1025px - 1280px
              xl: "40px"    // 1281px +
            }} flex="1" overflow="hidden">
              <Box overflow="hidden" flex="1">
                {links}
              </Box>
            </Stack>
          </Box>
   <Box
  textAlign="center"
  py={{ base: "10px", md: "12px", lg: "12px" }}
  fontSize={{ base: "11px", sm: "12px", md: "13px", lg: "13px" }}
  color="#888"
  flexShrink={0}
>
  <Flex align="center" justify="center">
    <Text
      fontSize={{ base: "12px", sm: "13px", md: "14px", lg: "14px" }}
      display="flex"
      alignItems="center"
      gap={{ base: "6px", md: "6px", lg: "6px" }}
      whiteSpace="nowrap"
    >
      Developed by
      <Image
        src={FlareMindslogo}
        alt="FlareMinds Logo"
        boxSize={{ base: "20px", sm: "18px", md: "20px", lg: "20px" }}
        objectFit="contain"
      />
      <strong>FlareMinds</strong> ❤️
    </Text>
  </Flex>
</Box>


        </Box>
      </Box>
      {/* Sign-in prompt dialog (when user clicks Logout but not logged in) */}
      <AlertDialog isOpen={isSigninPromptOpen} leastDestructiveRef={signinCancelRef} onClose={closeSigninPrompt} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="#7b2cbf">
              Not signed in
            </AlertDialogHeader>
            <AlertDialogBody>
              You are not signed in yet. Do you want to go to the Sign-in page?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={signinCancelRef} onClick={closeSigninPrompt} variant="ghost">Cancel</Button>
              <Button colorScheme="purple" onClick={handleGoToSignIn} ml={3}>Go to Sign In</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Logout confirmation dialog (desktop) */}
      <AlertDialog isOpen={isLogoutOpen} leastDestructiveRef={logoutCancelRef} onClose={closeLogout} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="#7b2cbf">
              Confirm Logout
            </AlertDialogHeader>
            <AlertDialogBody>Are you sure you want to log out?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={logoutCancelRef} onClick={closeLogout} variant="ghost">Cancel</Button>
              <Button colorScheme="red" onClick={handleConfirmLogout} ml={3}>Sign Out</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

// ✅ Responsive Sidebar - FIXED VERSION
export function SidebarResponsive(props) {
  const { logo, routes, hamburgerColor, isOpen, onOpen, onClose } = props;
  const mainPanel = React.useRef();

  // Logout / signin state for responsive drawer
  const [isLogoutOpenResp, setIsLogoutOpenResp] = useState(false);
  const [isSigninPromptOpenResp, setIsSigninPromptOpenResp] = useState(false);
  const logoutCancelRefResp = useRef();
  const signinCancelRefResp = useRef();
  const toastResp = useToast();

  const openLogoutResp = () => setIsLogoutOpenResp(true);
  const closeLogoutResp = () => setIsLogoutOpenResp(false);
  const openSigninPromptResp = () => setIsSigninPromptOpenResp(true);
  const closeSigninPromptResp = () => setIsSigninPromptOpenResp(false);

  const handleConfirmLogoutResp = () => {
    try {
      closeLogoutResp();
      if (onClose) onClose();
      localStorage.clear();
      sessionStorage.clear();
      toastResp({
        title: "Logged out successfully",
        description: "Redirecting to the sign-in page...",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      const base = window.location.origin + window.location.pathname;
      window.location.replace(`${base}#/auth/signin`);
    } catch (err) {
      toastResp({
        title: "Logout failed",
        description: err?.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleGoToSignInResp = () => {
    closeSigninPromptResp();
    if (onClose) onClose();
    const base = window.location.origin + window.location.pathname;
    window.location.replace(`${base}#/auth/signin`);
  };

  const activeBg = useColorModeValue("#7b2cbf", "#7b2cbf"); // Purple background when active
  const inactiveBg = useColorModeValue("white", "navy.700");
  const activeColor = useColorModeValue("white", "white"); // White text when active
  const inactiveColor = useColorModeValue("gray.400", "white");
  const sidebarActiveShadow = useColorModeValue(
    "0px 7px 11px rgba(0, 0, 0, 0.04)",
    "none"
  );
  const sidebarBackgroundColor = useColorModeValue("white", "navy.800");

  const createLinks = (routes) =>
    routes.map((prop, key) => {
      if (prop.redirect) return null;
      if (prop.category) {
        return (
          <React.Fragment key={key}>
            <Text
              color={activeColor}
              fontWeight="bold"
              mb={{ 
                base: "4px",    // 320px - 480px
                sm: "5px",      // 481px - 767px
                md: "6px"       // 768px - 1024px
              }}
              mx="auto"
              ps={{ 
                base: "8px",    // 320px - 480px
                sm: "9px",      // 481px - 767px
                md: "10px"      // 768px - 1024px
              }}
              py={{
                base: "8px",    // 320px - 480px
                sm: "10px",     // 481px - 767px
                md: "12px"      // 768px - 1024px
              }}
              fontSize={{
                base: "xs",     // 320px - 480px
                sm: "sm",       // 481px - 767px
                md: "sm"        // 768px - 1024px
              }}
            >
              {document.documentElement.dir === "rtl"
                ? prop.rtlName
                : prop.name}
            </Text>
            {createLinks(prop.views)}
          </React.Fragment>
        );
      }

      // Intercept logout route in responsive sidebar
      if (prop.path === "/logout") {
        return (
          <Button
            key={key}
            boxSize="initial"
            justifyContent="flex-start"
            alignItems="center"
            mb={{ base: "4px", sm: "5px", md: "6px" }}
            mx={{ base: "auto", sm: "auto", md: "auto" }}
            ps={{ base: "8px", sm: "9px", md: "10px" }}
            py={{ base: "8px", sm: "10px", md: "12px" }}
            borderRadius="15px"
            w="100%"
            bg={"transparent"}
            color={inactiveColor}
            boxShadow={"none"}
            _hover={{ bg: "gray.50" }}
            _active={{ bg: activeBg, transform: "none", borderColor: "transparent" }}
            _focus={{ boxShadow: "none" }}
            onClick={() => {
              const user = localStorage.getItem("user") || sessionStorage.getItem("user");
              if (!user) {
                openSigninPromptResp();
                return;
              }
              openLogoutResp();
            }}
          >
            <Flex>
              <IconBox
                bg={inactiveBg}
                color={"blue.500"}
                h={{ base: "24px", sm: "26px", md: "28px" }}
                w={{ base: "24px", sm: "26px", md: "28px" }}
                me={{ base: "8px", sm: "10px", md: "12px" }}
                transition="all 0.2s ease-in-out"
              >
                {prop.icon}
              </IconBox>
              <Text my="auto" fontSize={{ base: "xs", sm: "sm", md: "sm" }}>
                {document.documentElement.dir === "rtl" ? prop.rtlName : prop.name}
              </Text>
            </Flex>
          </Button>
        );
      }

      return (
        <NavLink to={prop.layout + prop.path} key={key} onClick={onClose}>
          {({ isActive }) => (
            <Button
              boxSize="initial"
              justifyContent="flex-start"
              alignItems="center"
              mb={{ 
                base: "4px",    // 320px - 480px
                sm: "5px",      // 481px - 767px
                md: "6px"       // 768px - 1024px
              }}
              mx={{ 
                base: "auto",   // 320px - 480px
                sm: "auto",     // 481px - 767px
                md: "auto"      // 768px - 1024px
              }}
              ps={{ 
                base: "8px",    // 320px - 480px
                sm: "9px",      // 481px - 767px
                md: "10px"      // 768px - 1024px
              }}
              py={{
                base: "8px",    // 320px - 480px
                sm: "10px",     // 481px - 767px
                md: "12px"      // 768px - 1024px
              }}
              borderRadius="15px"
              w="100%"
              bg={isActive ? activeBg : "transparent"}
              color={isActive ? activeColor : inactiveColor}
              boxShadow={isActive ? sidebarActiveShadow : "none"}
              _hover={{
                bg: isActive ? activeBg : "gray.50",
              }}
              _active={{
                bg: activeBg,
                transform: "none",
                borderColor: "transparent",
              }}
              _focus={{ boxShadow: "none" }}
            >
              <Flex>
                <IconBox
                  bg={isActive ? "white" : inactiveBg} // White background when active
                  color={isActive ? "#7b2cbf" : "blue.500"} // Purple icon when active, blue when inactive
                  h={{
                    base: "24px",  // 320px - 480px
                    sm: "26px",    // 481px - 767px
                    md: "28px"     // 768px - 1024px
                  }}
                  w={{
                    base: "24px",  // 320px - 480px
                    sm: "26px",    // 481px - 767px
                    md: "28px"     // 768px - 1024px
                  }}
                  me={{
                    base: "8px",   // 320px - 480px
                    sm: "10px",    // 481px - 767px
                    md: "12px"     // 768px - 1024px
                  }}
                  transition="all 0.2s ease-in-out"
                >
                  {prop.icon}
                </IconBox>
                <Text my="auto" fontSize={{
                  base: "xs",     // 320px - 480px
                  sm: "sm",       // 481px - 767px
                  md: "sm"        // 768px - 1024px
                }}>
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

  const links = <>{createLinks(routes)}</>;

  const brand = (
    <Box pt={{
      base: "25px",  // 320px - 480px
      sm: "30px",    // 481px - 767px
      md: "35px"     // 768px - 1024px
    }} mb={{
      base: "6px",   // 320px - 480px
      sm: "7px",     // 481px - 767px
      md: "8px"      // 768px - 1024px
    }}>
      {logo}
      <HSeparator my={{
        base: "20px", // 320px - 480px
        sm: "22px",   // 481px - 767px
        md: "26px"    // 768px - 1024px
      }} />
    </Box>
  );

  return (
    <Flex
      display={{ 
        base: "flex",  // 320px - 480px
        sm: "flex",    // 481px - 767px
        md: "flex",    // 768px - 1024px
        lg: "none",    // 1025px - 1280px
        xl: "none"     // 1281px +
      }}
      ref={mainPanel}
      alignItems="center"
    >
      {/* Hamburger Icon - Only visible on mobile */}
      {/* <HamburgerIcon 
        color={hamburgerColor} 
        w={{
          base: "16px",  // 320px - 480px
          sm: "17px",    // 481px - 767px
          md: "18px"     // 768px - 1024px
        }}
        h={{
          base: "16px",  // 320px - 480px
          sm: "17px",    // 481px - 767px
          md: "18px"     // 768px - 1024px
        }}
        onClick={onOpen}
        cursor="pointer"
      /> */}
      
      {/* Mobile Sidebar Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        placement={document.documentElement.dir === "rtl" ? "right" : "left"}
        size={{
          base: "xs",  // 320px - 480px
          sm: "sm",    // 481px - 767px
          md: "md"     // 768px - 1024px
        }}
      >
        <DrawerOverlay />
        <DrawerContent
          w={{
            base: "250px",  // 320px - 480px
            sm: "260px",    // 481px - 767px
            md: "280px"     // 768px - 1024px
          }}
          maxW={{
            base: "250px",  // 320px - 480px
            sm: "260px",    // 481px - 767px
            md: "280px"     // 768px - 1024px
          }}
          bg={sidebarBackgroundColor}
          borderRadius="16px"
          mt={{
            base: "50px",  // 320px - 480px
            sm: "55px",    // 481px - 767px
            md: "60px"     // 768px - 1024px
          }}
          mb={{
            base: "15px",  // 320px - 480px
            sm: "18px",    // 481px - 767px
            md: "20px"     // 768px - 1024px
          }}
          ml={{
            base: "8px",   // 320px - 480px
            sm: "9px",     // 481px - 767px
            md: "10px"     // 768px - 1024px
          }}
          h={{
            base: "calc(100vh - 65px)",  // 320px - 480px
            sm: "calc(100vh - 73px)",    // 481px - 767px
            md: "calc(100vh - 80px)"     // 768px - 1024px
          }}
        >
          <DrawerCloseButton
            _focus={{ boxShadow: "none" }}
            _hover={{ boxShadow: "none" }}
            mt={{
              base: "8px",   // 320px - 480px
              sm: "9px",     // 481px - 767px
              md: "10px"     // 768px - 1024px
            }}
            mr={{
              base: "8px",   // 320px - 480px
              sm: "9px",     // 481px - 767px
              md: "10px"     // 768px - 1024px
            }}
            size={{
              base: "md",    // 320px - 480px
              sm: "lg",      // 481px - 767px
              md: "lg"       // 768px - 1024px
            }}
          />
          <DrawerBody
            px={{
              base: "0.8rem",  // 320px - 480px
              sm: "0.9rem",    // 481px - 767px
              md: "1rem"       // 768px - 1024px
            }}
            display="flex"
            flexDirection="column"
            overflow="hidden"
          >
            <Box
              w="100%"
              h="100%"
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
            >
                <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
                <Box>{brand}</Box>
                <Stack direction="column" mb={{
                  base: "30px", // 320px - 480px
                  sm: "35px",   // 481px - 767px
                  md: "40px"    // 768px - 1024px
                }} flex="1" overflow="hidden">
                  <Box overflow="auto" flex="1">
                    {links}
                  </Box>
                </Stack>
                <SidebarHelp />
              </Box>

              <Box
  textAlign="center"
  py={{ base: "10px", md: "12px" }}
  fontSize={{ base: "11px", sm: "12px", md: "13px" }}
  color="#888"
  flexShrink={0}
>
  <Flex 
    align="center"
    justify="center"
  >
    <Text
      fontSize={{ base: "12px", sm: "13px", md: "14px" }}
      display="flex"
      alignItems="center"
      gap="6px"
    >
      Developed by
      <Image
        src={FlareMindslogo}
        alt="FlareMinds Logo"
        boxSize={{ base: "20px", sm: "20px", md: "22px" }}
        objectFit="contain"
      />
      <strong>FlareMinds</strong> ❤️
    </Text>
  </Flex>
</Box>

            </Box>
          </DrawerBody>
          {/* Responsive signin prompt dialog */}
          <AlertDialog isOpen={isSigninPromptOpenResp} leastDestructiveRef={signinCancelRefResp} onClose={closeSigninPromptResp} isCentered>
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold" color="#7b2cbf">Not signed in</AlertDialogHeader>
                  <AlertDialogBody>You are not signed in yet. Do you want to go to the Sign-in page?</AlertDialogBody>
                  <AlertDialogFooter>
                    <Button ref={signinCancelRefResp} onClick={closeSigninPromptResp} variant="ghost">Cancel</Button>
                    <Button colorScheme="purple" onClick={handleGoToSignInResp} ml={3}>Go to Sign In</Button>
                  </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>

          {/* Responsive logout confirmation dialog */}
          <AlertDialog isOpen={isLogoutOpenResp} leastDestructiveRef={logoutCancelRefResp} onClose={closeLogoutResp} isCentered>
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold" color="#7b2cbf">Confirm Logout</AlertDialogHeader>
                <AlertDialogBody>Are you sure you want to logout?</AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={logoutCancelRefResp} onClick={closeLogoutResp} variant="ghost">Cancel</Button>
                  <Button colorScheme="red" onClick={handleConfirmLogoutResp} ml={3}>Sign Out</Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}

export default Sidebar;