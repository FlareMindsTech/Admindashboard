import React, { useEffect, useState } from "react";
import {
  Avatar, Button, Flex, Grid, Text, VStack, Image, Divider,
  useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, Spinner,
  Badge, useToast, Input, Fade, FormControl, FormLabel,
} from "@chakra-ui/react";
import { FaUsers, FaBoxOpen, FaEdit, FaSignOutAlt, FaSave, FaTimes } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import storeLogo from "assets/img/Aadvi-logo.png";
import Card from "components/Card/Card";
import { useNavigate } from "react-router-dom";
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
  const [currentView, setCurrentView] = useState("users"); // Changed from "dashboard" to "users"
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(adminData);

  const [currentPage, setCurrentPage] = useState(1);
  const adminsPerPage = 5;

  const fetchAllAdmins = async () => {
    setDataLoading(true);
    try {
      const allAdmins = await getAllAdmins();
      const adminsArray = Array.isArray(allAdmins) ? allAdmins : (allAdmins.admins || []);
      setAdminData(prev => ({ ...prev, createdAdmins: adminsArray }));
    } catch (err) {
      toast({ title: "Error", description: "Failed to fetch admins", status: "error" });
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch admins when component mounts since "users" view is now default
  useEffect(() => {
    if (currentView === "users") {
      fetchAllAdmins();
    }
  }, [currentView]);

  const handleActionClick = async (action) => {
    if (action.label === "Manage Products") setCurrentView("products");
    else if (action.label === "Manage Users") {
      setCurrentView("users");
      await fetchAllAdmins();
      setCurrentPage(1);
    } else setCurrentView("dashboard");
  };

  const handleLogout = () => {
    localStorage.clear();
    toast({ title: "Logged Out", status: "info", duration: 2000 });
    navigate("/auth/signin");
  };

  const handleChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });
  const handleSave = () => {
    setAdminData(editData);
    setIsEditing(false);
    toast({ title: "Profile updated", status: "success", duration: 2000 });
  };

  const indexOfLastAdmin = currentPage * adminsPerPage;
  const currentAdmins = adminData.createdAdmins.slice(indexOfLastAdmin - adminsPerPage, indexOfLastAdmin);
  const totalPages = Math.ceil(adminData.createdAdmins.length / adminsPerPage);

  return (
    <Flex direction={{ base: "column", md: "row" }} gap={8} p={6} mt={12}>
      {/* Left Panel */}
      <Card
        w={{ base: "100%", md: "280px" }}
        bg={cardBg}
        mt={12}
        p={5}
        borderRadius="2xl"
        boxShadow="md"
        transition="all 0.3s ease"
        _hover={{ transform: "translateY(-3px)", boxShadow: "xl" }}
      >
        <Flex direction="column" align="center">
          <Image src={storeLogo} alt="Store Logo" boxSize="60px" mb={3} />
          <Avatar src={adminData.avatar} size="xl" mb={3} />

          {/* View Mode */}
          <Fade in={!isEditing}>
            <VStack spacing={2} align="center">
              <Text fontSize="lg" fontWeight="bold">{adminData.name}</Text>
              <Badge colorScheme={adminData.role === "superadmin" ? "purple" : "blue"}>
                {adminData.role}
              </Badge>
              <Text fontSize="sm" mb={2}>{adminData.email}</Text>
            </VStack>
          </Fade>

          {/* Edit Mode */}
          <Fade in={isEditing}>
            {isEditing && (
              <VStack spacing={3} align="stretch" w="100%">
                <FormControl>
                  <FormLabel fontSize="sm">Name</FormLabel>
                  <Input size="sm" name="name" value={editData.name} onChange={handleChange} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Email</FormLabel>
                  <Input size="sm" name="email" value={editData.email} onChange={handleChange} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Role</FormLabel>
                  <Input size="sm" name="role" value={editData.role} onChange={handleChange} />
                </FormControl>
              </VStack>
            )}
          </Fade>

          <Divider my={3} />

          {!isEditing && (
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
                  colorScheme={currentView === "users" && action.label === "Manage Users" ? "blue" : 
                              currentView === "products" && action.label === "Manage Products" ? "blue" : 
                              currentView === "dashboard" && action.label === "Settings" ? "blue" : "gray"}
                >
                  {action.label}
                </Button>
              ))}
            </VStack>
          )}

          {/* Action Buttons */}
          <VStack spacing={2} w="100%">
            {!isEditing ? (
              <Button w="100%" leftIcon={<FaEdit />} colorScheme="blue" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <Flex w="100%" gap={2}>
                <Button flex="1" colorScheme="green" leftIcon={<FaSave />} onClick={handleSave}>
                  Save
                </Button>
                <Button flex="1" colorScheme="gray" leftIcon={<FaTimes />} onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </Flex>
            )}
           
          </VStack>
        </Flex>
      </Card>

      {/* Right Panel */}
      <Grid templateColumns="1fr" gap={4} flex="1"  mt={12} >
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
                      <Tr><Td colSpan={4} textAlign="center">No admins found</Td></Tr>
                    )}
                  </Tbody>
                </Table>
                {adminData.createdAdmins.length > adminsPerPage && (
                  <Flex justifyContent="space-between" mt={4}>
                    <Button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} isDisabled={currentPage === 1}>Previous</Button>
                    <Text>Page {currentPage} of {totalPages}</Text>
                    <Button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} isDisabled={currentPage === totalPages}>Next</Button>
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