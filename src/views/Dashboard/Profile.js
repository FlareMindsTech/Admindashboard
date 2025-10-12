import React, { useEffect, useState } from "react";
import {
  Avatar, Button, Flex, Grid, Text, VStack,
  Image, Divider, useColorModeValue, Table, Thead, Tbody, Tr, Th, Td,
  Spinner, Badge, useToast, Card as ChakraCard,
} from "@chakra-ui/react";
import { FaUsers, FaBoxOpen, FaEdit, FaSignOutAlt } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import storeLogo from "assets/img/Aadvi-logo.png";
import Card from "components/Card/Card";
import { useNavigate } from "react-router-dom";

// Fetch all admins
import { getAllAdmins } from "../utils/axiosInstance";

const getInitialAdminData = () => {
  const userString = localStorage.getItem("user");
  let userData = {};
  try { userData = JSON.parse(userString) || {}; } catch {}

  return {
    adminId: userData._id || userData.id,
    name: userData.name || "Admin User",
    role: userData.role || "Guest",
    email: userData.email || "admin@example.com",
    joined: "N/A",
    avatar: "https://i.pravatar.cc/150?img=32",
    actions: [
      { icon: "users", label: "Manage Users" },
      { icon: "box", label: "Manage Products" },
      { icon: "settings", label: "Settings" },
    ],
    createdAdmins: [],
    superadminProducts: [
      { name: "Sample Product 1", category: "Category A", price: 100, stock: 10, createdAt: new Date() },
      { name: "Sample Product 2", category: "Category B", price: 200, stock: 5, createdAt: new Date() },
    ],
  };
};

export default function AdminProfile() {
  const toast = useToast();
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "navy.800");

  const [adminData, setAdminData] = useState(getInitialAdminData());
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const adminsPerPage = 5;

  // Fetch all admins
  const fetchAllAdmins = async () => {
    setDataLoading(true);
    try {
      const allAdmins = await getAllAdmins();
      const adminsArray = Array.isArray(allAdmins) ? allAdmins : (allAdmins.admins || []);
      setAdminData(prev => ({ ...prev, createdAdmins: adminsArray }));
    } catch (err) {
      console.error("Error fetching admins:", err);
      toast({ title: "Error", description: "Failed to fetch admins", status: "error" });
      setAdminData(prev => ({ ...prev, createdAdmins: [] }));
    } finally {
      setDataLoading(false);
    }
  };

  // Handle sidebar actions
  const handleActionClick = async (action) => {
    if (action.label === "Manage Products") {
      setCurrentView("products");
    } else if (action.label === "Manage Users") {
      setCurrentView("users");
      await fetchAllAdmins();
      setCurrentPage(1); // Reset pagination
    } else {
      setCurrentView("dashboard");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    toast({ title: "Logged Out", status: "info", duration: 2000 });
    navigate("/auth/signin");
  };

  // Pagination helpers
  const indexOfLastAdmin = currentPage * adminsPerPage;
  const indexOfFirstAdmin = indexOfLastAdmin - adminsPerPage;
  const currentAdmins = adminData.createdAdmins.slice(indexOfFirstAdmin, indexOfLastAdmin);
  const totalPages = Math.ceil(adminData.createdAdmins.length / adminsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  return (
    <Flex direction={{ base: "column", md: "row" }} gap={8} p={9} mt={9}>
      {/* Left Panel */}
      <Card w={{ base: "100%", md: "300px" }} bg={cardBg} p={6}>
        <Flex direction="column" align="center">
          <Image src={storeLogo} alt="Store Logo" boxSize="80px" mb={4} />
          <Avatar src={adminData.avatar} size="2xl" mb={4} />
          <Text fontSize="xl" fontWeight="bold">{adminData.name}</Text>
          <Badge colorScheme={adminData.role === "superadmin" ? "purple" : "blue"} mb={2}>
            {adminData.role}
          </Badge>
          <Text fontSize="sm" mb={4}>{adminData.email}</Text>
          <Divider my={3} />
          <VStack spacing={2} align="start" w="100%" mb={4}>
            {adminData.actions.map((action, idx) => (
              <Button
                key={idx}
                variant="ghost"
                w="100%"
                justifyContent="start"
                leftIcon={
                  action.icon === "users" ? <FaUsers /> :
                  action.icon === "box" ? <FaBoxOpen /> :
                  <IoSettingsSharp />
                }
                onClick={() => handleActionClick(action)}
              >
                {action.label}
              </Button>
            ))}
          </VStack>
          <VStack spacing={2} w="100%">
            <Button w="100%" leftIcon={<FaEdit />} colorScheme="blue">Edit Profile</Button>
            <Button w="100%" leftIcon={<FaSignOutAlt />} colorScheme="red" onClick={handleLogout}>Logout</Button>
          </VStack>
        </Flex>
      </Card>

      {/* Right Panel */}
      <Grid templateColumns="1fr" gap={4} flex="1">
        {currentView === "dashboard" && (
          <Card p={6} bg={cardBg}>
            <Text fontSize="lg" fontWeight="bold">Welcome, {adminData.name}!</Text>
          </Card>
        )}

        {currentView === "users" && (
          <Card p={6} bg={cardBg}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>All Admins</Text>
            {dataLoading ? <Spinner /> : (
              <>
                <Table variant="simple">
                  <Thead>
                    <Tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Created</Th></Tr>
                  </Thead>
                  <Tbody>
                    {currentAdmins.length > 0 ? (
                      currentAdmins.map((a, i) => (
                        <Tr key={i}>
                          <Td>{a.name}</Td>
                          <Td>{a.email}</Td>
                          <Td><Badge colorScheme={a.role === "superadmin" ? "purple" : "blue"}>{a.role}</Badge></Td>
                          <Td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "N/A"}</Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={4} textAlign="center">No admins found</Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>

                {/* Pagination Controls */}
                {adminData.createdAdmins.length > adminsPerPage && (
                  <Flex justifyContent="space-between" mt={4}>
                    <Button onClick={prevPage} isDisabled={currentPage === 1}>Previous</Button>
                    <Text>Page {currentPage} of {totalPages}</Text>
                    <Button onClick={nextPage} isDisabled={currentPage === totalPages}>Next</Button>
                  </Flex>
                )}
              </>
            )}
          </Card>
        )}

        {currentView === "products" && (
          <Card p={6} bg={cardBg}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>Products (Dummy)</Text>
            <Table variant="simple">
              <Thead>
                <Tr><Th>Name</Th><Th>Category</Th><Th>Price</Th><Th>Stock</Th><Th>Created</Th></Tr>
              </Thead>
              <Tbody>
                {adminData.superadminProducts.map((p, i) => (
                  <Tr key={i}>
                    <Td>{p.name}</Td>
                    <Td>{p.category}</Td>
                    <Td>₹{p.price}</Td>
                    <Td>{p.stock}</Td>
                    <Td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "N/A"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        )}
      </Grid>
    </Flex>
  );
}
