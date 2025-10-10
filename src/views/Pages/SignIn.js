import React, { useState } from "react";
import axios from "axios";
import axiosInstance from "views/utils/axiosInstance";
import {
  Box,
  Flex,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
// Assuming signInImage is available at this path
import signInImage from "assets/img/signInImage.png";

function AdminLogin() {
  const bgForm = useColorModeValue("white", "navy.800");
  const titleColor = useColorModeValue("blue.600", "blue.300");
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Backend validation regex (Kept as is for consistency)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

  const handleLogin = async () => {
    // --- Validation logic (kept as is) ---
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Email and password are required",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!passwordRegex.test(password)) {
      toast({
        title: "Invalid Password",
        description:
          "Password must be at least 8 characters, include uppercase, lowercase, and a number",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      // --- API Call (kept as is) ---
      const res = await axios.post(
        "https://boutique-ecommerce-1.onrender.com/api/admins/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const { token, name, role } = res.data;

      // ----------------------------------------------------------------
      // 🔥 CRITICAL CHANGES START HERE: Store token and role separately
      // ----------------------------------------------------------------
      // 1. Store the JWT in the DEDICATED ADMIN KEY for adminAxiosInstance
      localStorage.setItem("adminToken", token); 
      
      // 2. Store the role in the DEDICATED ROLE KEY for the frontend component checks
      localStorage.setItem("userRole", role); 

      // 3. Store the user details in an ADMIN-SPECIFIC KEY (Optional, but good practice)
      localStorage.setItem(
        "adminUser",
        JSON.stringify({ name, email, role })
      );
      
      // 4. (Cleanup) Remove potential old generic user/token to avoid conflicts
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // ----------------------------------------------------------------

      console.log("Admin Token stored:", localStorage.getItem("adminToken"));
      console.log("User Role stored:", localStorage.getItem("userRole"));

      toast({
        title: "Login Successful",
        description: `Welcome, ${name} (${role.toUpperCase()})!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // --- Redirection logic (kept as is) ---
      setTimeout(() => {
        if (role === "super admin" || role === "admin") {
          window.location.href = "/admin/dashboard";
        } else {
          // Fallback, though API should only return admin/super admin roles here
          window.location.href = "/";
        }
      }, 500);
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: "Login Failed",
        description: err.response?.data?.message || "Server error",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex position="relative" w="100%" h="100vh" overflowY="auto">
      {/* Background Image Container */}
      <Box
        position="fixed" // Fixed to cover the whole viewport, regardless of scrolling
        top="0"
        left="0"
        w="100%"
        h="100%"
        bgImage={`url(${signInImage})`}
        bgSize="cover"
        bgPosition="center"
        zIndex="1" // Ensure background is behind the form
      >
        <Box w="100%" h="100%" bg="blue.500" opacity="0.75"></Box>
      </Box>

      {/* Login Form Container */}
      <Flex
        // minH removed, use h/w for content positioning
        h={{ base: "auto", md: "100vh" }} // 'auto' on mobile, full height on desktop
        w="100%"
        maxW={{ base: "100%", md: "1044px" }} // Max width on desktop
        mx="auto"
        justifyContent="center"
        alignItems={{ base: "flex-start", md: "center" }} // Center vertically on desktop
        py={{ base: "40px", md: "0" }} // Add padding on top/bottom for mobile
        position="relative" // Crucial: sets context for zIndex, allowing content to overlay fixed background
        zIndex="2" // Ensure form is in front of the background
      >
        <Flex
          direction="column"
          // --- RESPONSIVE WIDTH ADJUSTMENTS ---
          w={{ base: "90%", sm: "400px", md: "445px" }} // Narrower on small screens, fixed width on md+
          // ------------------------------------
          borderRadius="20px"
          p={{ base: "20px", sm: "40px" }} // Reduced padding on smaller screens
          bg={bgForm}
          boxShadow={useColorModeValue(
            "0px 8px 30px rgba(0, 0, 0, 0.1)",
            "0px 8px 30px rgba(0, 0, 0, 0.4)"
          )}
          mt={{ base: "100px", md: "0" }} // Push the form down on mobile so it's not hidden behind a potential fixed header
          mb={{ base: "100px", md: "0" }}
        >
          <Text
            fontSize="2xl"
            color={titleColor}
            fontWeight="extrabold"
            textAlign="center"
            mb="28px"
          >
            Admin Login
          </Text>

          <FormControl mb="4">
            <FormLabel fontSize="sm" fontWeight="semibold">
              Email
            </FormLabel>
            <Input
              type="email"
              placeholder="Enter email"
              mb="24px"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="lg" // Larger input size for better mobile tap target
            />

            <FormLabel fontSize="sm" fontWeight="semibold">
              Password
            </FormLabel>
            <Input
              type="password"
              placeholder="Enter password"
              mb="24px"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="lg" // Larger input size for better mobile tap target
            />

            <Button
              w="100%"
              h="50px"
              borderRadius="12px"
              bg="blue.500"
              color="white"
              onClick={handleLogin}
              isLoading={loading}
              fontSize="md"
            >
              LOGIN
            </Button>
          </FormControl>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default AdminLogin;