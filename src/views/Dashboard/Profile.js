import React, { useEffect, useState } from "react";
import {
  Avatar, Button, Flex, Grid, Text, VStack, Image, Divider,
  useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, Spinner,
  Badge, useToast, Input, Fade, FormControl, FormLabel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, useDisclosure, Box, HStack
} from "@chakra-ui/react";
import { FaUsers, FaBoxOpen, FaEdit, FaSignOutAlt, FaSave, FaTimes } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import storeLogo from "assets/img/Aadvi-logo.png";
import Card from "components/Card/Card";
import { useNavigate } from "react-router-dom";
import { getAllAdmins, getAllProducts } from "../utils/axiosInstance";

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
    avatar: userData.avatar || userData.profileImage || userData.image || "https://i.pravatar.cc/150?img=32",
    actions: [
      { icon: "users", label: "Manage Users" },
      { icon: "box", label: "Manage Products" },
      { icon: "settings", label: "Settings" },
    ],
    createdAdmins: [],
    adminProducts: [],
  };
};

// Helper function to safely extract string values from objects
const getSafeString = (value, fallback = 'N/A') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (value && typeof value === 'object') {
    // If it's an object with a name property
    if (value.name) return value.name;
    // If it's an object with a _id property (common in MongoDB)
    if (value._id) return value._id;
    // Try to stringify or return fallback
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

// Helper function to safely extract image URL
const getSafeImage = (image, fallback = "https://i.pravatar.cc/150?img=32") => {
  if (typeof image === 'string' && image.trim() !== '') return image;
  if (image && typeof image === 'object') {
    // If it's an object with url property
    if (image.url) return image.url;
    // If it's an object with src property
    if (image.src) return image.src;
    // If it's an object with imageUrl property
    if (image.imageUrl) return image.imageUrl;
  }
  return fallback;
};

// Helper function to safely extract category
const getSafeCategory = (category) => {
  if (typeof category === 'string') return category;
  if (category && typeof category === 'object') {
    return category.name || category.title || category._id || 'Uncategorized';
  }
  return 'Uncategorized';
};

// Edit Admin Modal Component
const EditAdminModal = ({ isOpen, onClose, admin, onSave }) => {
  const [editData, setEditData] = useState(admin || {});
  const toast = useToast();

  useEffect(() => {
    setEditData(admin || {});
  }, [admin]);

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!editData.name || !editData.email) {
      toast({ title: "Error", description: "Name and email are required", status: "error" });
      return;
    }
    onSave(editData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Admin</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input 
                name="name" 
                value={getSafeString(editData.name, '')} 
                onChange={handleChange}
                placeholder="Enter admin name"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input 
                name="email" 
                type="email"
                value={getSafeString(editData.email, '')} 
                onChange={handleChange}
                placeholder="Enter admin email"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Role</FormLabel>
              <Input 
                name="role" 
                value={getSafeString(editData.role, '')} 
                onChange={handleChange}
                placeholder="Enter admin role"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="gray" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" bg={'#5a189a'} onClick={handleSave}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Profile Edit Component for Right Panel
const ProfileEditComponent = ({ adminData, onSave, onCancel }) => {
  const [editData, setEditData] = useState(adminData);

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(editData);
  };

  return (
    <Card p={6} bg={useColorModeValue("white", "navy.800")}>
      <Text fontSize="xl" fontWeight="bold" mb={6}>Edit Your Profile</Text>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">Name</FormLabel>
          <Input 
            name="name" 
            value={editData.name} 
            onChange={handleChange}
            placeholder="Enter your name"
            size="md"
          />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">Email</FormLabel>
          <Input 
            name="email" 
            type="email"
            value={editData.email} 
            onChange={handleChange}
            placeholder="Enter your email"
            size="md"
          />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">Role</FormLabel>
          <Input 
            name="role" 
            value={editData.role} 
            onChange={handleChange}
            placeholder="Enter your role"
            size="md"
          />
        </FormControl>
        <HStack spacing={3} mt={6}>
          <Button 
            flex="1" 
            bg={"#5a189a"}
            colorScheme="green" 
            leftIcon={<FaSave />} 
            onClick={handleSave}
            size="md"
          >
            Save Changes
          </Button>
          <Button 
            flex="1" 
            colorScheme="gray" 
            leftIcon={<FaTimes />} 
            onClick={onCancel}
            size="md"
          >
            Cancel
          </Button>
        </HStack>
      </VStack>
    </Card>
  );
};

export default function AdminProfile() {
  const toast = useToast();
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "navy.800");
  const [adminData, setAdminData] = useState(getInitialAdminData());
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentView, setCurrentView] = useState("users");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // States for edit admin modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const adminsPerPage = 5;
  const productsPerPage = 5;

  const fetchAllAdmins = async () => {
    setDataLoading(true);
    try {
      const allAdmins = await getAllAdmins();
      const adminsArray = Array.isArray(allAdmins) ? allAdmins : (allAdmins.admins || []);
      
      // Safely process admin data
      const safeAdmins = adminsArray.map(admin => ({
        ...admin,
        name: getSafeString(admin.name),
        email: getSafeString(admin.email),
        role: getSafeString(admin.role),
        avatar: getSafeImage(admin.avatar || admin.profileImage || admin.image),
        // Ensure createdAt is properly handled
        createdAt: admin.createdAt || admin.created_date || new Date()
      }));
      
      setAdminData(prev => ({ ...prev, createdAdmins: safeAdmins }));
    } catch (err) {
      console.error("Error fetching admins:", err);
      toast({ title: "Error", description: "Failed to fetch admins", status: "error" });
    } finally {
      setDataLoading(false);
    }
  };

  const fetchAdminProducts = async () => {
    setDataLoading(true);
    try {
      const response = await getAllProducts();
      
      // Extract products array from response
      let products = [];
      if (Array.isArray(response)) {
        products = response;
      } else if (response && Array.isArray(response.products)) {
        products = response.products;
      } else if (response && Array.isArray(response.data)) {
        products = response.data;
      } else {
        // Try to find array in response object
        const maybeArray = Object.values(response || {}).find((v) => Array.isArray(v));
        if (Array.isArray(maybeArray)) {
          products = maybeArray;
        }
      }

      console.log("Raw products data:", products);
      
      // Safely process products data
      const processedProducts = products.map(product => ({
        id: product._id || product.id,
        name: getSafeString(product.name || product.title),
        category: getSafeCategory(product.category),
        price: product.price || product.cost || 0,
        stock: product.stock || product.quantity || 0,
        status: getSafeString(product.status) || (product.isActive !== false ? 'Active' : 'Inactive'),
        createdAt: product.createdAt || product.dateAdded || new Date(),
        description: getSafeString(product.description),
        image: getSafeImage(product.image || product.imageUrl || product.thumbnail)
      }));

      console.log("Processed products:", processedProducts);
      
      setAdminData(prev => ({ ...prev, adminProducts: processedProducts }));
    } catch (err) {
      console.error("Error fetching products:", err);
      toast({ 
        title: "Error", 
        description: "Failed to fetch products", 
        status: "error" 
      });
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === "users") {
      fetchAllAdmins();
    } else if (currentView === "products") {
      fetchAdminProducts();
    }
  }, [currentView]);

  const handleActionClick = async (action) => {
    if (action.label === "Manage Products") {
      setCurrentView("products");
      await fetchAdminProducts();
      setCurrentPage(1);
    } else if (action.label === "Manage Users") {
      setCurrentView("users");
      await fetchAllAdmins();
      setCurrentPage(1);
    } else {
      setCurrentView("dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast({ title: "Logged Out", status: "info", duration: 2000 });
    navigate("/auth/signin");
  };

  const handleSaveProfile = (updatedData) => {
    setAdminData(updatedData);
    setIsEditingProfile(false);
    toast({ title: "Profile updated", status: "success", duration: 2000 });
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
  };

  // Edit Admin functions
  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    onOpen();
  };

  const handleSaveAdmin = (updatedAdmin) => {
    // Update the admin in the local state
    const updatedAdmins = adminData.createdAdmins.map(admin => 
      admin._id === updatedAdmin._id ? { ...admin, ...updatedAdmin } : admin
    );
    
    setAdminData(prev => ({ ...prev, createdAdmins: updatedAdmins }));
    
    toast({ 
      title: "Admin Updated", 
      description: `${updatedAdmin.name} has been updated successfully`, 
      status: "success", 
      duration: 3000 
    });
  };

  // Pagination calculations
  const indexOfLastAdmin = currentPage * adminsPerPage;
  const currentAdmins = adminData.createdAdmins.slice(indexOfLastAdmin - adminsPerPage, indexOfLastAdmin);
  const totalAdminPages = Math.ceil(adminData.createdAdmins.length / adminsPerPage);

  const indexOfLastProduct = currentPage * productsPerPage;
  const currentProducts = adminData.adminProducts.slice(indexOfLastProduct - productsPerPage, indexOfLastProduct);
  const totalProductPages = Math.ceil(adminData.adminProducts.length / productsPerPage);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'draft': return 'yellow';
      case 'published': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <Flex direction={{ base: "column", md: "row" }} gap={8} p={6} mt={12}>
      {/* Left Panel - Fixed Card (Always shows profile view) */}
      <Card
        w={{ base: "100%", md: "280px" }}
        bg={cardBg}
        mt={12}
        p={5}
        borderRadius="2xl"
        boxShadow="md"
        transition="all 0.3s ease"
        _hover={{ transform: "translateY(-3px)", boxShadow: "xl" }}
        position="sticky"
        top="100px"
        alignSelf="flex-start"
      >
        <Flex direction="column" align="center">
          <Image src={storeLogo} alt="Store Logo" boxSize="60px" mb={3} />
          <Avatar 
           
            size="xl" 
            mb={3}
            name={adminData.name}
            bg="#5a189a"
            color="white"
            showBorder
            border="3px solid"
            borderColor="#5a189a"
          />

          {/* Always show profile details in left panel */}
          <VStack spacing={2} align="center" w="100%">
            <Text fontSize="lg" fontWeight="bold">{adminData.name}</Text>
            <Badge colorScheme={adminData.role === "superadmin" ? "purple" : "blue"}>
              {adminData.role}
            </Badge>
            <Text fontSize="sm" mb={2}>{adminData.email}</Text>
            
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
                  colorScheme={currentView === "users" && action.label === "Manage Users" ? "#5a189a" : 
                              currentView === "products" && action.label === "Manage Products" ? "#5a189a" : 
                              currentView === "dashboard" && action.label === "Settings" ? "blue" : "gray"}
                >
                  {action.label}
                </Button>
              ))}
            </VStack>

            <VStack spacing={2} w="100%">
              <Button 
                bg={"#5a189a"}
                w="100%" 
                leftIcon={<FaEdit />} 
                color="white"
                _hover={{ bg: "#4a148c" }}
                onClick={() => setIsEditingProfile(true)}
              >
                Edit Profile
              </Button>
            </VStack>
          </VStack>
        </Flex>
      </Card>

      {/* Right Panel - Shows either edit form or content based on currentView and isEditingProfile */}
      <Grid templateColumns="1fr" gap={4} flex="1" mt={12}>
        {/* Show Edit Profile Form when isEditingProfile is true */}
        {isEditingProfile && (
          <ProfileEditComponent
            adminData={adminData}
            onSave={handleSaveProfile}
            onCancel={handleCancelEdit}
          />
        )}

        {/* Show regular content when NOT editing profile */}
        {!isEditingProfile && (
          <>
            {currentView === "dashboard" && (
              <Card p={6} bg={cardBg}>
                <Text fontSize="lg" fontWeight="bold">Welcome, {adminData.name}!</Text>
                <Text mt={2} color="gray.600">
                  Use the navigation menu to manage users, products, or update your profile settings.
                </Text>
              </Card>
            )}

            {currentView === "users" && (
              <Card p={6} bg={cardBg}>
                <Text fontSize="lg" fontWeight="bold" mb={4}>All Admins</Text>
                {dataLoading ? (
                  <Flex justify="center" py={8}>
                    <Spinner size="lg" />
                  </Flex>
                ) : (
                  <>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Avatar</Th>
                          <Th>Name</Th>
                          <Th>Email</Th>
                          <Th>Role</Th>
                          <Th>Created</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {currentAdmins.length > 0 ? (
                          currentAdmins.map((admin, i) => (
                            <Tr key={i}>
                              <Td>
                                <Avatar 
                                  size="sm" 
                                   
                                  name={getSafeString(admin.name)}
                                  bg="#5a189a"
                                  color="white"
                                />
                              </Td>
                              <Td>{getSafeString(admin.name)}</Td>
                              <Td>{getSafeString(admin.email)}</Td>
                              <Td>
                                <Badge colorScheme={getSafeString(admin.role) === "superadmin" ? "purple" : "blue"}>
                                  {getSafeString(admin.role)}
                                </Badge>
                              </Td>
                              <Td>{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "N/A"}</Td>
                              <Td>
                                <Button
                                  bg={"#5a189a"}
                                  size="sm"
                                  color="white"
                                  _hover={{ bg: "#4a148c" }}
                                  leftIcon={<FaEdit />}
                                  onClick={() => handleEditAdmin(admin)}
                                >
                                  Edit
                                </Button>
                              </Td>
                            </Tr>
                          ))
                        ) : (
                          <Tr>
                            <Td colSpan={6} textAlign="center" py={8}>
                              <Text color="gray.500">No admins found</Text>
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                    {adminData.createdAdmins.length > adminsPerPage && (
                      <Flex justifyContent="space-between" mt={4}>
                        <Button 
                          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                          isDisabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Text>Page {currentPage} of {totalAdminPages}</Text>
                        <Button 
                          onClick={() => setCurrentPage(p => Math.min(p + 1, totalAdminPages))} 
                          isDisabled={currentPage === totalAdminPages}
                        >
                          Next
                        </Button>
                      </Flex>
                    )}
                  </>
                )}
              </Card>
            )}

            {currentView === "products" && (
              <Card p={6} bg={cardBg}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="lg" fontWeight="bold">Your Products</Text>
                  <Badge colorScheme="green" fontSize="sm">
                    Total: {adminData.adminProducts.length}
                  </Badge>
                </Flex>
                {dataLoading ? (
                  <Flex justify="center" py={8}>
                    <Spinner size="lg" />
                  </Flex>
                ) : (
                  <>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                         
                          <Th>Name</Th>
                          <Th>Category</Th>
                          <Th>Price</Th>
                          <Th>Stock</Th>
                          <Th>Status</Th>
                          <Th>Created</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {currentProducts.length > 0 ? (
                          currentProducts.map((product, i) => (
                            <Tr key={i}>
                             
                              <Td fontWeight="medium">{getSafeString(product.name)}</Td>
                              <Td>
                                <Badge colorScheme="purple" variant="subtle">
                                  {getSafeString(product.category)}
                                </Badge>
                              </Td>
                             <Td>₹{product.price ?? product.variants?.[0]?.price ?? "-"}</Td>

                            <Td>
  <Badge 
    colorScheme={
      (product.stock ?? product.variants?.[0]?.stock) > 0
      ? "green"
      : "red"
    }
  >
    {product.stock ?? product.variants?.[0]?.stock ?? 0} in stock
  </Badge>
</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(product.status)}>
                                  {getSafeString(product.status)}
                                </Badge>
                              </Td>
                              <Td>{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A"}</Td>
                            </Tr>
                          ))
                        ) : (
                          <Tr>
                            <Td colSpan={7} textAlign="center" py={8}>
                              <VStack spacing={2}>
                                <Text color="gray.500">No products added yet</Text>
                                <Text fontSize="sm" color="gray.400">
                                  Products you add will appear here
                                </Text>
                              </VStack>
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                    {adminData.adminProducts.length > productsPerPage && (
                      <Flex justifyContent="space-between" mt={4}>
                        <Button 
                          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                          isDisabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Text>Page {currentPage} of {totalProductPages}</Text>
                        <Button 
                          onClick={() => setCurrentPage(p => Math.min(p + 1, totalProductPages))} 
                          isDisabled={currentPage === totalProductPages}
                        >
                          Next
                        </Button>
                      </Flex>
                    )}
                  </>
                )}
              </Card>
            )}
          </>
        )}
      </Grid>

      {/* Edit Admin Modal */}
      <EditAdminModal
        isOpen={isOpen}
        onClose={onClose}
        admin={selectedAdmin}
        onSave={handleSaveAdmin}
      />
    </Flex>
  );
}