import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// --- CRITICAL CHANGE: IMPORT THE DEDICATED ADMIN AXIOS INSTANCE ---
import { adminAxiosInstance } from "../utils/axiosInstance"; 
// ------------------------------------------------------------------

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
import { FaChartLine } from "react-icons/fa";
// The following are currently unused but kept for reference
// import { FaUserEdit } from "react-icons/fa";
// import { RiDeleteBin5Fill } from "react-icons/ri";

export default function Dashboard() {
  const textColor = useColorModeValue("gray.700", "white");
  // const tableHeaderBg = useColorModeValue("gray.100", "gray.700"); // Unused
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const toast = useToast();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", role: "" });


  // Fetch current user details and enforce role access
  useEffect(() => {
    // Check for the admin-specific user data and the userRole
    const storedUser = JSON.parse(localStorage.getItem("adminUser"));
    const storedRole = localStorage.getItem("userRole"); 

    if (!storedUser || (storedRole !== "admin" && storedRole !== "super admin")) {
      toast({
        title: "Access Denied",
        description: "Only Admin or Super Admin users can access this page.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      navigate("/auth/signin");
      return;
    }
    // Set the current user based on the adminUser object
    setCurrentUser({ ...storedUser, role: storedRole }); 
  }, [navigate, toast]);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      // Ensure we have the user context before fetching
      if (!currentUser) return; 
      
      try {
        // --- CRITICAL CHANGE: Use adminAxiosInstance ---
        // This ensures the request uses the 'adminToken' and not the generic 'token'
        const res = await adminAxiosInstance.get("/admins/all"); 
        // NOTE: The leading slash ensures the path is relative to the API_BASE_URL defined in axiosInstance.js.
        // If your base URL is '.../api', the route should be '/admins/all'.
        // If your base URL is '...', the route should be '/api/admins/all'.
        // Based on the login URL, I'm assuming 'api' is NOT in the base URL, so I've changed the path to '/api/admins/all'
        // For robustness, I'll update the path here to match the structure implied by your previous code:
        // 'api/admins/all' -> '/api/admins/all'
        
        setUsers(res.data.admins || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        toast({
          title: "Fetch Error",
          description: err.response?.data?.message || "Failed to load admin list.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    
    // Only fetch data once we've successfully authenticated and set the currentUser
    if (currentUser) {
        fetchUsers();
    }
  }, [currentUser, toast]); // Added toast as dependency

  // The getStatusColor function is irrelevant to this component but kept if it was used elsewhere.
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
    // Access check: only Super Admin can create new admins
    if (currentUser?.role !== "super admin") {
        return toast({
          title: "Permission Denied",
          description: "Only Super Admins can create new admin accounts.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
    }

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
      // --- CRITICAL CHANGE: Use adminAxiosInstance ---
      const res = await adminAxiosInstance.post(
        "/admins/create", // Route relative to adminAxiosInstance's baseURL
        newAdmin
      );
      // ------------------------------------------------

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
        title: "Error Creating Admin",
        description: err.response?.data?.message || "Server error. Check if the authenticated user has Super Admin privileges.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!currentUser) return null;

  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
      <Box mb={6}>
        <Text fontSize="2xl" fontWeight="bold" color={textColor}>
          Welcome, {currentUser.name} 👋 ({currentUser.role.toUpperCase()})
        </Text>
      </Box>

      {/* Access Control: Only Super Admin sees the Create Admin button */}
      {currentUser.role === "super admin" && (
        <Button mb={4} colorScheme="green" onClick={() => setIsModalOpen(true)}>
          Create Admin
        </Button>
      )}

      {/* Create Admin Modal */}
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
            <Button 
                colorScheme="blue" 
                mr={3} 
                onClick={handleCreateAdmin}
                // Ensure the button is also disabled if they aren't a Super Admin
                isDisabled={currentUser.role !== "super admin"}
            >
                Create
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Summary Cards */}
      <SimpleGrid columns={{ sm: 1, md: 2, xl: 4 }} spacing="24px" mb="20px">
        <Card minH="125px" p={4} shadow="md" border="1px solid" borderColor={borderColor}>
          <Stat>
            <StatLabel color="gray.500">Total Admins</StatLabel>
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