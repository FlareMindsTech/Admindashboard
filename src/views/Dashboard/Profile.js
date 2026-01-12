import React, { useEffect, useState } from "react";
import {
  Avatar, Button, Flex, Grid, Text, VStack, Image, Divider,
  useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, Spinner,
  Badge, useToast, Input, FormControl, FormLabel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, useDisclosure, Box, HStack
} from "@chakra-ui/react";
import { FaUsers, FaBoxOpen, FaEdit, FaSignOutAlt, FaSave, FaTimes, FaChartPie } from "react-icons/fa";
import Card from "components/Card/Card";
import { useNavigate } from "react-router-dom";
import { getAllAdmins, getAllProducts, getAllUsers,getAllOrders } from "../utils/axiosInstance";
import ReactApexChart from 'react-apexcharts';

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
      { icon: "chart", label: "Product Stock Overview" },
    ],
    createdAdmins: [],
    adminProducts: [],
    allUsers: [],
  };
};

// Helper function to safely extract string values from objects
const getSafeString = (value, fallback = 'N/A') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (value && typeof value === 'object') {
    if (value.name) return value.name;
    if (value._id) return value._id;
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
    if (image.url) return image.url;
    if (image.src) return image.src;
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

// Helper function to get role color
const getRoleColor = (role) => {
  switch (role?.toLowerCase()) {
    case 'super admin':
    case 'superadmin': return 'purple';
    case 'admin': return 'blue';
    case 'user': return 'green';
    case 'moderator': return 'orange';
    default: return 'gray';
  }
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'green';
    case 'inactive': return 'red';
    case 'draft': return 'yellow';
    case 'published': return 'blue';
    default: return 'gray';
  }
};

// Stock Analysis Component for Right Panel
const StockAnalysisComponent = ({ products, refreshProducts }) => {
  const cardBg = useColorModeValue("white", "navy.800");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refresh products data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProducts();
    setIsRefreshing(false);
  };

  // Calculate incoming products (stock > 50)
  const incomingProducts = products.filter(product => {
    const stock = product.stock || 0;
    return stock > 50;
  });

  // Calculate outgoing products (stock <= 10)
  const outgoingProducts = products.filter(product => {
    const stock = product.stock || 0;
    return stock > 0 && stock <= 10;
  });

  // Calculate remaining products (stock between 11-50)
  const remainingProducts = products.filter(product => {
    const stock = product.stock || 0;
    return stock > 10 && stock <= 50;
  });

  // Calculate zero stock products
  const zeroStockProducts = products.filter(product => {
    const stock = product.stock || 0;
    return stock === 0;
  });

  // Prepare data for Incoming Products Chart
  const incomingSeries = [
    incomingProducts.reduce((sum, product) => sum + (product.stock || 0), 0),
    remainingProducts.reduce((sum, product) => sum + (product.stock || 0), 0) + 
    outgoingProducts.reduce((sum, product) => sum + (product.stock || 0), 0)
  ];

  const incomingLabels = [
    `Incoming (${incomingProducts.length} products)`,
    `Other Stock (${remainingProducts.length + outgoingProducts.length} products)`
  ];

  // Prepare data for Outgoing Products Chart
  const outgoingSeries = [
    outgoingProducts.reduce((sum, product) => sum + (product.stock || 0), 0),
    remainingProducts.reduce((sum, product) => sum + (product.stock || 0), 0) + 
    incomingProducts.reduce((sum, product) => sum + (product.stock || 0), 0)
  ];

  const outgoingLabels = [
    `Outgoing (${outgoingProducts.length} products)`,
    `Other Stock (${remainingProducts.length + incomingProducts.length} products)`
  ];

  // Chart options for Incoming Products
  const incomingChartOptions = {
    chart: {
      type: 'pie',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      }
    },
    labels: incomingLabels,
    colors: ['#5a189a', '#9d4edd'],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    legend: {
      position: 'bottom',
      horizontalAlign: 'center'
    },
    title: {
      text: 'Incoming Products Stock',
      align: 'center',
      style: {
        fontSize: '16px',
        fontWeight: 'bold'
      }
    },
    tooltip: {
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const productCount = dataPointIndex === 0 ? incomingProducts.length : (remainingProducts.length + outgoingProducts.length);
        const productList = dataPointIndex === 0 ? incomingProducts : [...remainingProducts, ...outgoingProducts];
        const productNames = productList.slice(0, 5).map(p => p.name).join(', ');
        const moreText = productList.length > 5 ? ` and ${productList.length - 5} more...` : '';
        
        return `
          <div class="apexcharts-tooltip-title">${w.config.labels[seriesIndex]}</div>
          <div class="apexcharts-tooltip-series-group">
            <div class="apexcharts-tooltip-text">
              <div class="apexcharts-tooltip-y-group">
                <span class="apexcharts-tooltip-text-label">Total Stock:</span>
                <span class="apexcharts-tooltip-text-value">${series[seriesIndex]} units</span>
              </div>
              <div class="apexcharts-tooltip-y-group">
                <span class="apexcharts-tooltip-text-label">Products:</span>
                <span class="apexcharts-tooltip-text-value">${productCount} items</span>
              </div>
              <div class="apexcharts-tooltip-y-group">
                <span class="apexcharts-tooltip-text-label">Includes:</span>
                <span class="apexcharts-tooltip-text-value">${productNames}${moreText}</span>
              </div>
            </div>
          </div>
        `;
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '45%'
        }
      }
    }
  };

  // Chart options for Outgoing Products
  const outgoingChartOptions = {
    chart: {
      type: 'pie',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      }
    },
    labels: outgoingLabels,
    colors: ['#ff6b6b', '#ff9e6b'],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    legend: {
      position: 'bottom',
      horizontalAlign: 'center'
    },
    title: {
      text: 'Outgoing Products Stock',
      align: 'center',
      style: {
        fontSize: '16px',
        fontWeight: 'bold'
      }
    },
    tooltip: {
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const productCount = dataPointIndex === 0 ? outgoingProducts.length : (remainingProducts.length + incomingProducts.length);
        const productList = dataPointIndex === 0 ? outgoingProducts : [...remainingProducts, ...incomingProducts];
        const productNames = productList.slice(0, 5).map(p => p.name).join(', ');
        const moreText = productList.length > 5 ? ` and ${productList.length - 5} more...` : '';
        
        return `
          <div class="apexcharts-tooltip-title">${w.config.labels[seriesIndex]}</div>
          <div class="apexcharts-tooltip-series-group">
            <div class="apexcharts-tooltip-text">
              <div class="apexcharts-tooltip-y-group">
                <span class="apexcharts-tooltip-text-label">Total Stock:</span>
                <span class="apexcharts-tooltip-text-value">${series[seriesIndex]} units</span>
              </div>
              <div class="apexcharts-tooltip-y-group">
                <span class="apexcharts-tooltip-text-label">Products:</span>
                <span class="apexcharts-tooltip-text-value">${productCount} items</span>
              </div>
              <div class="apexcharts-tooltip-y-group">
                <span class="apexcharts-tooltip-text-label">Includes:</span>
                <span class="apexcharts-tooltip-text-value">${productNames}${moreText}</span>
              </div>
            </div>
          </div>
        `;
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '45%'
        }
      }
    }
  };

  return (
    <Card p={6} bg={cardBg}>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="lg" fontWeight="bold">Product Stock Analysis</Text>
        <Button 
          size="sm" 
          colorScheme="blue" 
          onClick={handleRefresh}
          isLoading={isRefreshing}
          leftIcon={<FaBoxOpen />}
        >
          Refresh Data
        </Button>
      </Flex>
      
      {/* Charts Section */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8} mb={8}>
        {/* Incoming Products Chart */}
        <Box>
          <ReactApexChart 
            options={incomingChartOptions} 
            series={incomingSeries} 
            type="pie" 
            height={350}
          />
        </Box>
        
        {/* Outgoing Products Chart */}
        <Box>
          <ReactApexChart 
            options={outgoingChartOptions} 
            series={outgoingSeries} 
            type="pie" 
            height={350}
          />
        </Box>
      </Grid>

      {/* Summary Statistics */}
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr 1fr" }} gap={4} mb={6}>
        <Card p={4} bg={useColorModeValue("gray.50", "gray.700")}>
          <Text fontSize="sm" color="gray.600" mb={2}>Total Products</Text>
          <Text fontSize="2xl" fontWeight="bold" color="#5a189a">{products?.length || 0}</Text>
        </Card>
        
        <Card p={4} bg={useColorModeValue("gray.50", "gray.700")}>
          <Text fontSize="sm" color="gray.600" mb={2}>Incoming Products</Text>
          <Text fontSize="2xl" fontWeight="bold" color="#5a189a">
            {incomingProducts.length}
          </Text>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {incomingProducts.reduce((sum, product) => sum + (product.stock || 0), 0)} units
          </Text>
        </Card>
        
        <Card p={4} bg={useColorModeValue("gray.50", "gray.700")}>
          <Text fontSize="sm" color="gray.600" mb={2}>Outgoing Products</Text>
          <Text fontSize="2xl" fontWeight="bold" color="#ff6b6b">
            {outgoingProducts.length}
          </Text>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {outgoingProducts.reduce((sum, product) => sum + (product.stock || 0), 0)} units
          </Text>
        </Card>

        <Card p={4} bg={useColorModeValue("gray.50", "gray.700")}>
          <Text fontSize="sm" color="gray.600" mb={2}>Out of Stock</Text>
          <Text fontSize="2xl" fontWeight="bold" color="red.500">
            {zeroStockProducts.length}
          </Text>
        </Card>
      </Grid>
    </Card>
  );
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


export default function AdminProfile() {
  const toast = useToast();
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "navy.800");
  const [adminData, setAdminData] = useState(getInitialAdminData());
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentView, setCurrentView] = useState("users");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
 

  const [currentPage, setCurrentPage] = useState(1);
  const adminsPerPage = 5;
  const productsPerPage = 5;
  const usersPerPage = 5;

  // Get current user role
  const currentUserRole = adminData.role?.toLowerCase();

  // Check if current user is super admin
  const isSuperAdmin = currentUserRole === 'super admin' || currentUserRole === 'superadmin';

  const fetchAllAdmins = async () => {
    setDataLoading(true);
    try {
      const allAdmins = await getAllAdmins();
      const adminsArray = Array.isArray(allAdmins) ? allAdmins : (allAdmins.admins || []);
      
      const safeAdmins = adminsArray.map(admin => ({
        ...admin,
        name: getSafeString(admin.name),
        email: getSafeString(admin.email),
        role: getSafeString(admin.role),
        avatar: getSafeImage(admin.avatar || admin.profileImage || admin.image),
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

  const fetchAllUsers = async () => {
    setDataLoading(true);
    try {
      const allUsers = await getAllUsers();
      const usersArray = Array.isArray(allUsers) ? allUsers : (allUsers.users || allUsers.data || []);
      
      const safeUsers = usersArray.map(user => ({
        ...user,
        name: getSafeString(user.name || user.username),
        email: getSafeString(user.email),
        role: getSafeString(user.role) || 'user',
        avatar: getSafeImage(user.avatar || user.profileImage || user.image),
        status: getSafeString(user.status) || 'active',
        createdAt: user.createdAt || user.created_date || user.registeredAt || new Date()
      }));
      
      setAdminData(prev => ({ ...prev, allUsers: safeUsers }));
    } catch (err) {
      console.error("Error fetching users:", err);
      toast({ title: "Error", description: "Failed to fetch users", status: "error" });
    } finally {
      setDataLoading(false);
    }
  };

  const fetchAdminProducts = async () => {
    setDataLoading(true);
    try {
      const response = await getAllProducts();
      console.log("🔄 Fetching products... Raw response:", response);
      
      let products = [];
      if (Array.isArray(response)) {
        products = response;
      } else if (response && Array.isArray(response.products)) {
        products = response.products;
      } else if (response && Array.isArray(response.data)) {
        products = response.data;
      } else {
        const maybeArray = Object.values(response || {}).find((v) => Array.isArray(v));
        if (Array.isArray(maybeArray)) {
          products = maybeArray;
        }
      }

      console.log("📊 Processed products count:", products.length);
      
      const processedProducts = products.map(product => {
        const stock = product.variants?.[0]?.stock || product.stock || product.quantity || 0;
        console.log(`Product: ${product.name}, Stock: ${stock}`);
        
        return {
          id: product._id || product.id,
          name: getSafeString(product.name || product.title),
          category: getSafeCategory(product.category),
          price: product.variants?.[0]?.price || product.price || product.cost || 0,
          stock: stock,
          status: getSafeString(product.status) || (product.isActive !== false ? 'Active' : 'Inactive'),
          createdAt: product.createdAt || product.dateAdded || new Date(),
          description: getSafeString(product.description),
          image: getSafeImage(product.image || product.imageUrl || product.thumbnail)
        };
      });

      console.log("✅ Final processed products:", processedProducts);
      
      setAdminData(prev => ({ ...prev, adminProducts: processedProducts }));
      
      toast({ 
        title: "Data Updated", 
        description: `Loaded ${processedProducts.length} products`, 
        status: "success", 
        duration: 2000 
      });
    } catch (err) {
      console.error("❌ Error fetching products:", err);
      toast({ 
        title: "Error", 
        description: "Failed to fetch products", 
        status: "error" 
      });
    } finally {
      setDataLoading(false);
    }
  };

  // Enhanced useEffect to handle product updates
  useEffect(() => {
    console.log(`🔄 Current view changed to: ${currentView}`);
    if (currentView === "users") {
      if (isSuperAdmin) {
        fetchAllAdmins();
      } else {
        fetchAllUsers();
      }
    } else if (currentView === "products" || currentView === "analytics") {
      fetchAdminProducts();
    }
  }, [currentView, isSuperAdmin]);

  // Add this function to force refresh products
  const refreshProductsData = async () => {
    await fetchAdminProducts();
  };

  const handleActionClick = async (action) => {
    console.log(`🖱️ Action clicked: ${action.label}`);
    if (action.label === "Manage Products") {
      setCurrentView("products");
      await fetchAdminProducts();
      setCurrentPage(1);
    } else if (action.label === "Manage Users") {
      setCurrentView("users");
      if (isSuperAdmin) {
        await fetchAllAdmins();
      } else {
        await fetchAllUsers();
      }
      setCurrentPage(1);
    } else if (action.label === "Product Stock Overview") {
      setCurrentView("analytics");
      await fetchAdminProducts();
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
    onEditAdminOpen();
  };

  const handleSaveAdmin = (updatedAdmin) => {
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

  const indexOfLastUser = currentPage * usersPerPage;
  const currentUsers = adminData.allUsers.slice(indexOfLastUser - usersPerPage, indexOfLastUser);
  const totalUserPages = Math.ceil(adminData.allUsers.length / usersPerPage);

  const indexOfLastProduct = currentPage * productsPerPage;
  const currentProducts = adminData.adminProducts.slice(indexOfLastProduct - productsPerPage, indexOfLastProduct);
  const totalProductPages = Math.ceil(adminData.adminProducts.length / productsPerPage);

  return (
    <Flex direction={{ base: "column", md: "row" }} gap={8} p={6} mt={12}>
      {/* Left Panel - Fixed Card */}
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

          <VStack spacing={2} align="center" w="100%">
            <Text fontSize="lg" fontWeight="bold">{adminData.name}</Text>
            <Badge colorScheme={getRoleColor(adminData.role)} fontSize="sm" px={2} py={1}>
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
                    <FaChartPie />
                  }
                  onClick={() => handleActionClick(action)}
                  colorScheme={
                    currentView === "users" && action.label === "Manage Users" ? "#5a189a" : 
                    currentView === "products" && action.label === "Manage Products" ? "#5a189a" : 
                    currentView === "analytics" && action.label === "Product Stock Overview" ? "#5a189a" : 
                    "gray"
                  }
                >
                  {action.label}
                </Button>
              ))}
            </VStack>

       
          </VStack>
        </Flex>
      </Card>

      {/* Right Panel */}
      <Grid templateColumns="1fr" gap={4} flex="1" mt={12}>
        {isEditingProfile && (
          <ProfileEditComponent
            adminData={adminData}
            onSave={handleSaveProfile}
            onCancel={handleCancelEdit}
          />
        )}

        {!isEditingProfile && (
          <>
            {currentView === "dashboard" && (
              <Card p={6} bg={cardBg}>
                <Text fontSize="lg" fontWeight="bold">Welcome, {adminData.name}!</Text>
                <Text mt={2} color="gray.600">
                  Use the navigation menu to manage {isSuperAdmin ? 'admins' : 'users'}, products, or view stock analytics.
                </Text>
              </Card>
            )}

            {currentView === "users" && (
  <Card 
    p={{ base: 3, md: 5 }} 
    bg={cardBg} 
    w="100%" 
    overflowX="auto"
  >
    <Text 
      fontSize={{ base: "md", md: "lg" }} 
      fontWeight="bold" 
      mb={4}
    >
      {isSuperAdmin ? "All Admins" : "All Users"}
    </Text>

    {dataLoading ? (
      <Flex justify="center" py={8}>
        <Spinner size="lg" />
      </Flex>
    ) : (
      <>
        <Table 
          variant="simple" 
          size="sm" 
          className="responsive-table"
        >
          <Thead display={{ base: "none", md: "table-header-group" }}>
            <Tr>
              <Th>Avatar</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Created</Th>
            </Tr>
          </Thead>

          <Tbody>
  {(isSuperAdmin ? currentAdmins : currentUsers).length > 0 ? (
    (isSuperAdmin ? currentAdmins : currentUsers).map((person, i) => {
      const displayName = getSafeString(person?.name || "N/A");

      return (
        <Tr
          key={person._id || i}
          fontSize={{ base: "sm", md: "md" }}
          display={{ base: "block", md: "table-row" }}
          borderBottom={{ base: "1px solid #eee", md: "none" }}
          p={{ base: 2, md: 0 }}
        >
          {/* Avatar + Mobile View */}
          <Td
            display="flex"
            alignItems="center"
            gap={3}
            py={2}
            border="none"
          >
            <Avatar
              size="sm"
              name={displayName}
            
              bg="#5a189a"
              color="white"
            />

            <Box display={{ base: "block", md: "none" }}>
              <Text fontWeight="bold">{displayName}</Text>
              <Text fontSize="xs" color="gray.500">
                {getSafeString(person.email)}
              </Text>
            </Box>
          </Td>

          {/* Name (Desktop only) */}
          <Td display={{ base: "none", md: "table-cell" }}>
            {displayName}
          </Td>

          {/* Email */}
          <Td display={{ base: "none", md: "table-cell" }}>
            {getSafeString(person.email)}
          </Td>

          {/* Role */}
          <Td>
            <Badge
              colorScheme={getRoleColor(getSafeString(person.role))}
              px={2}
              py={1}
              borderRadius="md"
              fontSize="0.75rem"
            >
              {getSafeString(person.role)}
            </Badge>
          </Td>

          {/* Status */}
          <Td>
            <Badge
              colorScheme={getStatusColor(person.status)}
              px={2}
              py={1}
              borderRadius="md"
              fontSize="0.75rem"
            >
              {getSafeString(person.status) || "Active"}
            </Badge>
          </Td>

          {/* Created Date */}
          <Td>
            {person.createdAt
              ? new Date(person.createdAt).toLocaleDateString()
              : "N/A"}
          </Td>
        </Tr>
      );
    })
  ) : (
    <Tr>
      <Td colSpan={6} textAlign="center" py={8}>
        <Text color="gray.500">
          No {isSuperAdmin ? "admins" : "users"} found
        </Text>
      </Td>
    </Tr>
  )}
</Tbody>

        </Table>

        {/* Pagination */}
        {(isSuperAdmin ? adminData.createdAdmins.length : adminData.allUsers.length) >
          (isSuperAdmin ? adminsPerPage : usersPerPage) && (
          <Flex 
            justifyContent="space-between" 
            mt={4} 
            px={2}
            fontSize={{ base: "sm", md: "md" }}
          >
            <Button
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              isDisabled={currentPage === 1}
            >
              Previous
            </Button>

            <Text>
              Page {currentPage} of{" "}
              {isSuperAdmin ? totalAdminPages : totalUserPages}
            </Text>

            <Button
              size="sm"
              onClick={() =>
                setCurrentPage(p =>
                  Math.min(
                    p + 1,
                    isSuperAdmin ? totalAdminPages : totalUserPages
                  )
                )
              }
              isDisabled={
                currentPage ===
                (isSuperAdmin ? totalAdminPages : totalUserPages)
              }
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
  <Card
    p={{ base: 3, md: 5 }}
    bg={cardBg}
    w="100%"
    overflowX="auto"
    fontFamily="'Poppins', sans-serif"
  >
    {/* Header */}
    <Flex
      justify="space-between"
      align="center"
      mb={4}
      flexDirection={{ base: "column", sm: "row" }}
      gap={2}
    >
      <Text
        fontSize={{ base: "md", md: "lg" }}
        fontWeight="bold"
      >
        Your Products
      </Text>

      <Badge
        colorScheme="green"
        fontSize={{ base: "xs", sm: "sm" }}
        px={3}
        py={1}
      >
        Total: {adminData.adminProducts.length}
      </Badge>
    </Flex>

    {/* Loader */}
    {dataLoading ? (
      <Flex justify="center" py={8}>
        <Spinner size="lg" />
      </Flex>
    ) : (
      <>
        {/* Responsive Table (same pattern as Users) */}
        <Table 
          variant="simple" 
          size="sm"
        >
          {/* Desktop Headers */}
          <Thead display={{ base: "none", md: "table-header-group" }}>
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
                <Tr
                  key={i}
                  fontSize={{ base: "sm", md: "md" }}
                  display={{ base: "block", md: "table-row" }}
                  borderBottom={{ base: "1px solid #eee", md: "none" }}
                  p={{ base: 2, md: 0 }}
                >
                  {/* MOBILE TOP SECTION */}
                  <Td
                    display={{ base: "flex", md: "table-cell" }}
                    flexDirection="column"
                    gap={1}
                    py={2}
                    border="none"
                  >
                    {/* NAME — always visible on mobile */}
                    <Text fontWeight="bold" display={{ md: "none" }}>
                      {getSafeString(product.name)}
                    </Text>

                    {/* PRICE — small screen highlight */}
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      display={{ md: "none" }}
                    >
                      ₹{product.price ?? "-"}
                    </Text>

                    {/* DESKTOP NAME */}
                    <Box display={{ base: "none", md: "block" }}>
                      {getSafeString(product.name)}
                    </Box>
                  </Td>

                  {/* CATEGORY */}
                  <Td display={{ base: "none", md: "table-cell" }}>
                    <Badge colorScheme="purple" variant="subtle">
                      {getSafeString(product.category)}
                    </Badge>
                  </Td>

                  {/* PRICE */}
                  <Td display={{ base: "none", md: "table-cell" }}>
                    ₹{product.price ?? "-"}
                  </Td>

                  {/* STOCK */}
                  <Td>
                    <Badge
                      colorScheme={product.stock > 0 ? "green" : "red"}
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="0.75rem"
                    >
                      {product.stock ?? 0} in stock
                    </Badge>
                  </Td>

                  {/* STATUS */}
                  <Td>
                    <Badge
                      colorScheme={getStatusColor(product.status)}
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="0.75rem"
                    >
                      {getSafeString(product.status)}
                    </Badge>
                  </Td>

                  {/* CREATED DATE */}
                  <Td>
                    {product.createdAt
                      ? new Date(product.createdAt).toLocaleDateString()
                      : "N/A"}
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={6} textAlign="center" py={8}>
                  <Text color="gray.500">No products added yet</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>

        {/* Pagination */}
        {adminData.adminProducts.length > productsPerPage && (
          <Flex
            justifyContent="space-between"
            mt={4}
            px={2}
            fontSize={{ base: "sm", md: "md" }}
            flexDirection={{ base: "column", sm: "row" }}
            gap={{ base: 3, sm: 0 }}
            textAlign="center"
          >
            <Button
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              isDisabled={currentPage === 1}
            >
              Previous
            </Button>

            <Text>
              Page {currentPage} of {totalProductPages}
            </Text>

            <Button
              size="sm"
              onClick={() =>
                setCurrentPage(p => Math.min(p + 1, totalProductPages))
              }
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





            {currentView === "analytics" && (
              <StockAnalysisComponent 
                products={adminData.adminProducts} 
                refreshProducts={refreshProductsData}
              />
            )}
          </>
        )}
      </Grid>

    
    </Flex>
  );
}