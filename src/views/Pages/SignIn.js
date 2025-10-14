import React, { useState } from "react";
import axios from "axios";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { InputGroup, InputRightElement } from "@chakra-ui/react";
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
import signInImage from "assets/img/bg.jpg"; 

function AdminLogin() {
  const bgForm = useColorModeValue("#E6E6FA", "navy.800");
  const titleColor = useColorModeValue("blue.600", "blue.300");
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

  const handleLogin = async () => {
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
      const res = await axios.post(
        "https://boutique-ecommerce-1.onrender.com/api/admins/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const { token, name, role } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({ name, email, role })
      );

      console.log("Token stored:", localStorage.getItem("token"));
      console.log("User stored:", localStorage.getItem("user"));

      toast({
        title: "Login Successful",
        description: `Welcome, ${name}!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setTimeout(() => {
        if (role === "super admin" || role === "admin") {
          // Changed to client-side router navigation if available, 
          // but sticking to window.location.href as in your original code
          window.location.href = "/admin/dashboard"; 
        } else {
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
    <Flex
      position="fixed"
      top="0"
      left="0"
      w="100%"
      h="100vh"
      overflow="hidden" // ✅ Removes scrollbar
      alignItems="center"
      justifyContent="center"
      bg={`url(${signInImage}) center/cover no-repeat`}
      _before={{
        content: `""`,
        position: "absolute",
        top: 0,
        left: 0,
        w: "100%",
        h: "100%",
        bg: "purple.400",
        opacity: 0.75,
        zIndex: 1,
      }}
    >
      <Flex
        direction="column"
        w={{ base: "90%", sm: "400px", md: "445px" }}
        borderRadius="20px"
        p={{ base: "20px", sm: "40px" }}
        bg={bgForm}
        boxShadow={useColorModeValue(
          "0px 8px 30px rgba(0, 0, 0, 0.1)",
          "0px 8px 30px rgba(0, 0, 0, 0.4)"
        )}
        zIndex="2"
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
            size="lg"
          />

          <FormLabel fontSize="sm" fontWeight="semibold">
            Password
          </FormLabel>
          <InputGroup size="lg">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              mb="24px"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputRightElement width="3rem">
              <Button
                h="1.75rem"
                size="sm"
                bg="transparent"
                _hover={{ bg: "transparent" }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <ViewIcon /> : <ViewOffIcon />}
              </Button>
            </InputRightElement>
          </InputGroup>

  <Button
  w="100%"
  h="50px"
  borderRadius="12px"
  bg="purple.500"
  color="white"
  onClick={handleLogin}
  isLoading={loading}
  fontSize="md"
  _hover={{ bg: "purple.600" }}   // darker on hover
  _active={{ bg: "purple.700" }}  // darkest on click
  transition="background 0.3s"    // smooth transition
>
  LOGIN
</Button>


        </FormControl>
      </Flex>
    </Flex>
  );
}

export default AdminLogin;
