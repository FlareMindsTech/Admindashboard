// AdminProfile.js
import {
  Avatar,
  Box,
  Button,
  Flex,
  Grid,
  Text,
  VStack,
  HStack,
  Image,
  Divider,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner, 
  Alert,
  AlertIcon,
  useToast, 
} from "@chakra-ui/react";
import { FaUsers, FaBoxOpen, FaEdit, FaSignOutAlt } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import storeLogo from "assets/img/Aadvi-logo.png";
import Card from "components/Card/Card";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


// Helper function to safely read and parse admin data from local storage
const getInitialAdminData = () => {
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  let userData = {};
  let adminId = null;

  try {
    if (userString) {
      userData = JSON.parse(userString);
      // Assuming the user object has an _id field from the database
      adminId = userData._id; 
    }
  } catch (e) {
    console.error("Failed to parse user data from localStorage:", e);
  }

  // Use parsed data or fallbacks for initial display
  const name = userData.name || "Admin User";
  const role = userData.role || "Guest";
  const email = userData.email || "admin@example.com";

  return {
    adminId,
    token,
    name,
    role,
    email,
    joined: "N/A", 
    avatar: "https://i.pravatar.cc/150?img=32",
    actions: [
      { icon: "users", label: "Manage Users" },
      { icon: "box", label: "Manage Products" },
      { icon: "settings", label: "Settings" },
    ],
    users: [],
  };
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function AdminProfile() {
  const toast = useToast();
  const navigate = useNavigate();
  const textColor = useColorModeValue("gray.700", "white");
  const subTextColor = useColorModeValue("gray.500", "gray.300");
  const cardBg = useColorModeValue("white", "navy.800");

  const initialData = getInitialAdminData();
  const [adminData, setAdminData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState("dashboard");

  // ✅ Fetch Admin Data from backend
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      setError("");

      const { token, adminId } = initialData; // Use initial data for credentials

      // Check for required credentials
      if (!token) {
        setError("Token not found. Please log in.");
        setLoading(false);
        navigate("/auth/signin"); // Redirect if no token
        return;
      }
      if (!adminId) {
         setError("Admin ID not found. Please check login process.");
         setLoading(false);
         return;
      }

      // ✅ Backend URL
      const BASE_URL = "http://localhost:7000/api/admins";
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // --- 1. Profile API (Specific Admin Details) ---
        const profileRes = await axios.get(
          `${BASE_URL}/byId/${adminId}`,
          { headers }
        );

        // --- 2. Users API (All Admins/Users for Management View) ---
        const usersRes = await axios.get(
          `${BASE_URL}/all`,
          { headers }
        );

        const newAdminData = {
          ...adminData, 
          name: profileRes.data.name,
          role: profileRes.data.role,
          email: profileRes.data.email,
          joined: profileRes.data.createdAt?.slice(0, 10),
          users: usersRes.data || [],
        };
        
        setAdminData(newAdminData);

      } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
        // Show the error but allow initial data to remain visible
        setError(err.response?.data?.message || "Failed to load complete admin data from API.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []); 

  const handleActionClick = (action) => {
    // Navigate to the Product Management page instead of setting a local view
    if (action.label === "Manage Products") {
        navigate("/admin/products"); // Assuming this is your product management route
    } else if (action.label === "Manage Users") {
      setCurrentView("users");
    } else {
      setCurrentView("dashboard");
    }
  };
  
  // LOGOUT HANDLER
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });

    setTimeout(() => {
        navigate("/auth/signin"); 
    }, 1000);
  };


  return (
    <Flex direction={{ base: "column", md: "row" }} gap={8} p={9} mt={9}>
      {/* ⚠️ Error Alert */}
      {error && (
        <Alert 
          status="error" 
          position="absolute" 
          top="100px" 
          left="50%" 
          transform="translateX(-50%)" 
          width={{base: "90%", md: "50%"}} 
          zIndex="99"
          borderRadius="lg"
        >
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Left Column */}
      <Card w={{ base: "100%", md: "300px" }} bg={cardBg} p={6} borderRadius="20px" shadow="md">
        <Flex direction="column" align="center">
          
          {loading && (
            <Spinner
              position="absolute"
              size="xl"
              thickness="4px"
              color="blue.500"
              emptyColor="gray.200"
              zIndex="1"
              mt="40px"
            />
          )}

          <Image src={storeLogo} alt="Store Logo" boxSize="80px" mb={4} />
          <Avatar 
            src={adminData.avatar} 
            size="2xl" 
            mb={4} 
            opacity={loading ? 0.6 : 1} 
          />
          <Text fontSize="xl" fontWeight="bold" color={textColor} opacity={loading ? 0.6 : 1}>{adminData.name}</Text>
          <Text fontSize="sm" color={subTextColor} opacity={loading ? 0.6 : 1}>{adminData.role}</Text>
          <Text fontSize="xs" color={subTextColor} mb={4} opacity={loading ? 0.6 : 1}>
            {adminData.email} {adminData.joined !== "N/A" ? `• Joined ${adminData.joined}` : ''}
          </Text>

          <Divider my={3} />

          {/* Action Buttons */}
          <VStack spacing={2} align="start" w="100%" mb={4}>
            {adminData.actions?.map((action, idx) => (
              <Button
                key={idx}
                variant="ghost"
                w="100%"
                justifyContent="start"
                leftIcon={action.icon === "users" ? <FaUsers /> : action.icon === "box" ? <FaBoxOpen /> : <IoSettingsSharp />}
                onClick={() => handleActionClick(action)}
                isDisabled={loading}
              >
                {action.label}
              </Button>
            ))}
          </VStack>

          <VStack spacing={2} w="100%">
            <Button w="100%" leftIcon={<FaEdit />} colorScheme="blue" isDisabled={loading}>Edit Profile</Button>
            <Button w="100%" leftIcon={<FaSignOutAlt />} colorScheme="red" onClick={handleLogout}>Logout</Button>
          </VStack>
        </Flex>
      </Card>

      {/* Right Column (View Area) */}
      <Grid templateColumns="1fr" gap={4} flex="1">
        {currentView === "dashboard" && (
          <Card p={6} borderRadius="20px" bg={cardBg} shadow="md">
            <Text fontSize="lg" fontWeight="bold">Welcome, {adminData.name}!</Text>
            <Text fontSize="sm" color={subTextColor}>Here’s your admin dashboard overview.</Text>
          </Card>
        )}

        {currentView === "users" && (
          <Card p={6} borderRadius="20px" bg={cardBg} shadow="md">
            <Flex justify="space-between" align="center" mb={4}>
                <Text fontSize="lg" fontWeight="bold">Manage Users</Text>
                {loading && <HStack><Spinner size="sm" /> <Text fontSize="sm" color={subTextColor}>Fetching users...</Text></HStack>}
            </Flex>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                </Tr>
              </Thead>
              <Tbody>
                {adminData.users.length > 0 ? (
                    adminData.users.map((user, idx) => (
                    <Tr key={idx}>
                      <Td>{user.name}</Td>
                      <Td>{user.email}</Td>
                      <Td>{user.role}</Td>
                    </Tr>
                  ))
                ) : (
                    <Tr>
                        <Td colSpan={3} textAlign="center" color={subTextColor}>
                            {loading ? "Loading users..." : "No user data found."}
                        </Td>
                    </Tr>
                )}
              </Tbody>
            </Table>
          </Card>
        )}

        {/* Placeholder for when Manage Products button is clicked */}
        {currentView === "products" && (
          <Card p={6} borderRadius="20px" bg={cardBg} shadow="md">
            <Text fontSize="lg" fontWeight="bold">Manage Products</Text>
            <Text fontSize="sm" color={subTextColor}>Redirecting to product management page...</Text>
          </Card>
        )}
      </Grid>
    </Flex>
  );
}