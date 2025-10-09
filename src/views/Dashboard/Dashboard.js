import React, { useState, useEffect } from "react";
// Remove the default 'axios' import
// import axios from "axios"; 
import { useNavigate } from "react-router-dom";
// --- CRITICAL CHANGE: IMPORT THE CUSTOM AXIOS INSTANCE ---
// Adjust the path to where your axiosInstance.js file is located
import axiosInstance from "../utils/axiosInstance"; 
// ---------------------------------------------------------

// Chakra imports
import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Heading,
  // ... (rest of Chakra components)
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
// Custom components
import Card from "components/Card/Card.js";
import BarChart from "components/Charts/BarChart";
import { FaChartLine, FaUserEdit } from "react-icons/fa";
import { RiDeleteBin5Fill } from "react-icons/ri";

export default function Dashboard() {
  const textColor = useColorModeValue("gray.700", "white");
  const tableHeaderBg = useColorModeValue("gray.100", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const toast = useToast();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });


  // Fetch current user from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || (storedUser.role !== "admin" && storedUser.role !== "super admin")) {
      toast({
        title: "Access Denied",
        description: "Only admin or super admin users can access this page.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      navigate("/auth/signin");
      return;
    }
    setCurrentUser(storedUser);
  }, [navigate, toast]);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // --- REFACTORED: Use axiosInstance, which automatically includes the token and base URL ---
        // NOTE: Assuming your backend API_BASE_URL is 'https://boutique-ecommerce-1.onrender.com/' 
        // and the route path is '/api/admins/all'.
        // If your axiosInstance base URL already includes '/api', adjust the path below to '/admins/all'.
        const res = await axiosInstance.get("api/admins/all"); 
        // ----------------------------------------------------------------------------------------
        setUsers(res.data.admins || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        // Optionally add a toast for error here
      }
    };
    // Ensure the data fetching only happens after authentication check is complete (optional but safer)
    if (currentUser) {
        fetchUsers();
    }
  }, [currentUser]); // Dependency on currentUser ensures it runs after user is set

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered": return "green";
      case "Shipped": return "blue";
      case "Pending": return "yellow";
      case "Cancelled": return "red";
      default: return "gray";
    }
  };

  // Create new admin
  const handleCreateAdmin = async () => {
    // Frontend validation (remains the same and is good practice)
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      return toast({
        title: "Validation Error",
        description: "All fields are required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdmin.email)) {
      return toast({
        title: "Validation Error",
        description: "Invalid email format",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newAdmin.password)) {
      return toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters, include uppercase, lowercase, and a number",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    try {
      // --- REFACTORED: Use axiosInstance, which automatically includes the token and base URL ---
      // The token verification is handled automatically by the backend upon receiving the token 
      // attached by the axiosInstance interceptor.
      const res = await axiosInstance.post(
        "api/admins/create", // Route relative to axiosInstance's baseURL
        newAdmin
      );
      // ------------------------------------------------------------------------------------------

      toast({
        title: "Admin Created",
        description: `Admin ${res.data.admin.name} created successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setUsers((prev) => [...prev, res.data.admin]);
      setNewAdmin({ name: "", email: "", password: "" });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Server error. Check if the user is a Super Admin.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!currentUser) return null;

  return (
// ... (Rest of the JSX remains the same)
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
      <Box mb={6}>
        <Text fontSize="2xl" fontWeight="bold" color={textColor}>
          Welcome, {currentUser.name} 👋
        </Text>
      </Box>

      {currentUser.role === "super admin" && (
        <Button mb={4} colorScheme="green" onClick={() => setIsModalOpen(true)}>
          Create Admin
        </Button>
      )}
// ... (Modal JSX remains the same)
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Admin</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel>Name</FormLabel>
              <Input
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Email</FormLabel>
              <Input
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleCreateAdmin}>Create</Button>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Summary Cards */}
      <SimpleGrid columns={{ sm: 1, md: 2, xl: 4 }} spacing="24px" mb="20px">
        <Card minH="125px" p={4} shadow="md" border="1px solid" borderColor={borderColor}>
          <Stat>
            <StatLabel color="gray.500">Total Users</StatLabel>
            <StatNumber fontSize="xl" color={textColor}>{users.length}</StatNumber>
          </Stat>
          <Button mt={3} colorScheme="blue" leftIcon={<FaChartLine />} onClick={() => setActiveSection("users")}>
            Show Admin Details
          </Button>
        </Card>
      </SimpleGrid>

      {/* Users Section */}
      {activeSection === "users" && (
        <Card p={5} shadow="xl">
          <Heading size="md" mb={4}>👤 Admin Details</Heading>
          <Table variant="striped" colorScheme="blue">
            <Thead bg="blue.100">
              <Tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((u, idx) => (
                <Tr key={u._id || idx}>
                  <Td>{idx + 1}</Td>
                  <Td>{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.role}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}
    </Flex>
  );
}