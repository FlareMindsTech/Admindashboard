import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Badge,
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
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", role: "" });

  const [topDressDetails] = useState([
    { id: 1, name: "Floral Summer Dress", price: 1200, size: "M", color: "Red" },
    { id: 2, name: "Classic Black Gown", price: 2500, size: "L", color: "Black" },
    { id: 3, name: "Casual Denim Jacket", price: 1800, size: "XL", color: "Blue" },
  ]);

  const [showStaffDetails] = useState([
    { id: 1, name: "Ravi Kumar", email: "ravi.kumar@shopnow.com", department: "Customer Support", role: "Support Executive" },
    { id: 2, name: "Meena Sharma", email: "meena.sharma@shopnow.com", department: "Order Management", role: "Order Supervisor" },
    { id: 3, name: "Vikram Singh", email: "vikram.singh@shopnow.com", department: "Logistics", role: "Delivery Manager" },
    { id: 4, name: "Anjali Verma", email: "anjali.verma@shopnow.com", department: "Inventory", role: "Stock Manager" },
  ]);

  const [showSalesDetails] = useState([
    { id: 1, orderId: "ORD1001", customer: "Sanjay Kumar", product: "Wireless Headphones", quantity: 2, total: 4000, status: "Delivered" },
    { id: 2, orderId: "ORD1002", customer: "Priya Sharma", product: "Smartphone", quantity: 1, total: 15000, status: "Shipped" },
    { id: 3, orderId: "ORD1003", customer: "Arun Raj", product: "Casual Shoes", quantity: 3, total: 3600, status: "Pending" },
    { id: 4, orderId: "ORD1004", customer: "Meena Devi", product: "Laptop Bag", quantity: 1, total: 1200, status: "Cancelled" },
  ]);

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
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:7000/api/admins/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.admins || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

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
    // Frontend validation
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
        description: err.response?.data?.message || "Server error",
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
          Welcome, {currentUser.name} 👋
        </Text>
      </Box>

      {currentUser.role === "super admin" && (
        <Button mb={4} colorScheme="green" onClick={() => setIsModalOpen(true)}>
          Create Admin
        </Button>
      )}

      {/* Modal for Creating Admin */}
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
            Show User Details
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
