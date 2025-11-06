import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Select,
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
  useToast,
  Heading,
  Badge,
  Text,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaEdit,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
} from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdAdminPanelSettings } from "react-icons/md";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import {
  getAllAdmins,
  createAdmin,
  updateAdmin,
} from "views/utils/axiosInstance";

// Main Admin Management Component
function AdminManagement() {
  // Chakra color mode
  const textColor = useColorModeValue("gray.700", "white");
  const iconTeal = useColorModeValue("teal.300", "teal.300");
  const iconBoxInside = useColorModeValue("white", "white");
  const bgButton = useColorModeValue("gray.100", "gray.100");
  const tableHeaderBg = useColorModeValue("gray.100", "gray.700");

  // Custom color theme
  const customColor = "#7b2cbf";
  const customHoverColor = "#5a189a";

  const toast = useToast();

  const [adminData, setAdminData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Search filter state

  // View state - 'list', 'add', 'edit'
  const [currentView, setCurrentView] = useState("list");
  const [editingAdmin, setEditingAdmin] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "admin",
    password: "",
  });

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const displayItems = [...currentItems];
  while (displayItems.length < itemsPerPage && displayItems.length > 0) {
    displayItems.push({ _id: `empty-${displayItems.length}`, isEmpty: true });
  }

  // Get status color with background
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { color: "white", bg: "#9d4edd" };
      case "inactive":
        return { color: "white", bg: "red.500" };
      default:
        return { color: "white", bg: "#9d4edd" };
    }
  };

  // Fetch current user from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (
      !storedUser ||
      (storedUser.role !== "admin" && storedUser.role !== "super admin")
    ) {
      toast({
        title: "Access Denied",
        description: "Only admin or super admin users can access this page.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setCurrentUser(storedUser);
  }, [toast]);

  // Fetch admins from backend
  useEffect(() => {
    const fetchAdmins = async () => {
      if (!currentUser) return;

      setLoading(true);
      setTableLoading(true);
      setDataLoaded(false);
      try {
        const response = await getAllAdmins();
        console.log("Fetched admins response:", response);
        
        // Handle different response formats
        const admins = response.data?.admins || response.data || response?.admins || response || [];

        // Sort admins in descending order (newest first)
        const sortedAdmins = admins.sort(
          (a, b) =>
            new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id)
        );

        setAdminData(sortedAdmins);
        setFilteredData(sortedAdmins);
        setDataLoaded(true);
      } catch (err) {
        console.error("Error fetching admins:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to load admin list.";
        setError(errorMessage);
        setDataLoaded(true);
        toast({
          title: "Fetch Error",
          description: errorMessage,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    };

    if (currentUser) {
      fetchAdmins();
    }
  }, [currentUser, toast]);

  // Apply filters and search
  useEffect(() => {
    if (!dataLoaded) return;

    setTableLoading(true);
    setCurrentPage(1); // Reset to first page when filter changes

    const timer = setTimeout(() => {
      let filtered = adminData;

      // Apply role/status filter
      switch (activeFilter) {
        case "super":
          filtered = adminData.filter((admin) => admin.role === "super admin");
          break;
        case "active":
          filtered = adminData.filter((admin) => admin.status === "active");
          break;
        case "admins":
          filtered = adminData.filter((admin) => admin.role === "admin");
          break;
        default:
          filtered = adminData;
      }

      // Apply search filter
      if (searchTerm.trim() !== "") {
        filtered = filtered.filter(
          (admin) =>
            admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (admin.status &&
              admin.status.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      setFilteredData(filtered);
      setTableLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeFilter, adminData, dataLoaded, searchTerm]);

  // Handle input change for form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Handle add admin - show add form
  const handleAddAdmin = () => {
    setFormData({
      name: "",
      email: "",
      role: "admin",
      password: "",
    });
    setEditingAdmin(null);
    setCurrentView("add");
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  // Handle edit admin - show edit form
  const handleEditAdmin = (admin) => {
    setFormData({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      password: "", // Don't pre-fill password for security
    });
    setEditingAdmin(admin);
    setCurrentView("edit");
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView("list");
    setEditingAdmin(null);
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  // Handle form submit
  const handleSubmit = async () => {
    // Frontend validation
    if (!formData.name || !formData.email) {
      return toast({
        title: "Validation Error",
        description: "Name and email are required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    // For new admin, password is required
    if (currentView === "add" && !formData.password) {
      return toast({
        title: "Validation Error",
        description: "Password is required for new admin",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return toast({
        title: "Validation Error",
        description: "Invalid email format",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    // For new admin, validate password strength
    if (currentView === "add") {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        return toast({
          title: "Validation Error",
          description:
            "Password must be at least 8 characters, include uppercase, lowercase, and a number",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let response;

      if (currentView === "add") {
        // Create new admin using the API function
        response = await createAdmin(formData);
        console.log("Create admin response:", response);

        // Extract admin data from response
        const newAdmin = response.data?.admin || response.data || response;

        toast({
          title: "Admin Created",
          description: `Admin ${newAdmin.name} created successfully`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Add new admin to the beginning of the list (newest first)
        const updatedAdmins = [newAdmin, ...adminData];
        setAdminData(updatedAdmins);

        // Update filtered data based on current filter and search
        applyFiltersAndSearch(updatedAdmins);

        setSuccess("Admin created successfully!");
      } else {
        // Update existing admin using the API function
        response = await updateAdmin(editingAdmin._id, formData);
        console.log("Update admin response:", response);

        // Extract admin data from response
        const updatedAdmin = response.data?.admin || response.data || response;

        toast({
          title: "Admin Updated",
          description: `Admin ${updatedAdmin.name} updated successfully`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Update admin in the list
        const updatedAdmins = adminData.map((admin) =>
          admin._id === editingAdmin._id ? { ...admin, ...updatedAdmin } : admin
        );
        setAdminData(updatedAdmins);

        // Update filtered data
        applyFiltersAndSearch(updatedAdmins);

        setSuccess("Admin updated successfully!");
      }

      // Reset form and go back to list
      setFormData({
        name: "",
        email: "",
        role: "admin",
        password: "",
      });
      setEditingAdmin(null);

      // Wait a bit before going back to list to show success message
      setTimeout(() => {
        setCurrentView("list");
      }, 1500);
    } catch (err) {
      console.error("API Error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "API error. Try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  // Helper function to apply filters and search
  const applyFiltersAndSearch = (admins) => {
    let filtered = admins;

    // Apply role/status filter
    switch (activeFilter) {
      case "super":
        filtered = admins.filter((admin) => admin.role === "super admin");
        break;
      case "active":
        filtered = admins.filter((admin) => admin.status === "active");
        break;
      case "admins":
        filtered = admins.filter((admin) => admin.role === "admin");
        break;
      default:
        filtered = admins;
    }

    // Apply search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (admin) =>
          admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (admin.status &&
            admin.status.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredData(filtered);
  };

  // Card click handlers
  const handleCardClick = (filterType) => {
    setActiveFilter(filterType);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (!currentUser) {
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" color={customColor} />
      </Flex>
    );
  }

  // Render Form View (Add/Edit)
  if (currentView === "add" || currentView === "edit") {
    return (
      <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }} height="100vh" overflow="hidden">
        <Card bg="white" shadow="xl" height="100%" display="flex" flexDirection="column">
          <CardHeader bg="white" flexShrink={0}>
            <Flex align="center" mb={4}>
              <Button
                variant="ghost"
                leftIcon={<FaArrowLeft />}
                onClick={handleBackToList}
                mr={4}
                color={customColor}
                _hover={{ bg: `${customColor}10` }}
              >
                {/* Removed "Back to List" text, only icon */}
              </Button>
              <Heading size="md" color="gray.700">
                {currentView === "add" ? "Add New Admin" : "Edit Admin"}
              </Heading>
            </Flex>
          </CardHeader>
          <CardBody bg="white" flex="1" overflow="auto">
            {/* Success/Error Message Display */}
            {error && (
              <Text
                color="red.500"
                mb={4}
                p={3}
                border="1px"
                borderColor="red.200"
                borderRadius="md"
                bg="red.50"
              >
                {error}
              </Text>
            )}
            {success && (
              <Text
                color="green.500"
                mb={4}
                p={3}
                border="1px"
                borderColor="green.200"
                borderRadius="md"
                bg="green.50"
              >
                {success}
              </Text>
            )}
            <FormControl mb="24px">
              <FormLabel htmlFor="name" color="gray.700">Name</FormLabel>
              <Input
                id="name"
                name="name"
                placeholder="Admin Name"
                onChange={handleInputChange}
                value={formData.name}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                bg="white"
              />
            </FormControl>
            <FormControl mb="24px">
              <FormLabel htmlFor="email" color="gray.700">Email</FormLabel>
              <Input
                id="email"
                name="email"
                placeholder="Admin Email"
                onChange={handleInputChange}
                value={formData.email}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                bg="white"
              />
            </FormControl>
            <FormControl mb="24px">
              <FormLabel htmlFor="role" color="gray.700">Role</FormLabel>
              <Input
                id="role"
                name="role"
                value="admin"
                isReadOnly
                bg="gray.50"
                color="gray.600"
                cursor="not-allowed"
                _hover={{ cursor: "not-allowed" }}
                borderColor="gray.300"
              />
            </FormControl>
            <FormControl mb="24px">
              <FormLabel htmlFor="password" color="gray.700">
                {currentView === "add"
                  ? "Password"
                  : "Password (leave blank to keep current)"}
              </FormLabel>
              <InputGroup>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    currentView === "add"
                      ? "Admin Password"
                      : "New Password (optional)"
                  }
                  onChange={handleInputChange}
                  value={formData.password}
                  borderColor={`${customColor}50`}
                  _hover={{ borderColor: customColor }}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  bg="white"
                />
                <InputRightElement>
                  <IconButton
                    variant="ghost"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowPassword(!showPassword)}
                    color="gray.500"
                    _hover={{ color: customColor, bg: "transparent" }}
                    size="sm"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <Flex justify="flex-end" mt={6} flexShrink={0}>
              <Button 
                variant="outline" 
                mr={3} 
                onClick={handleBackToList}
                border="1px"
                borderColor="gray.300"
              >
                Cancel
              </Button>
              <Button
                bg={customColor}
                _hover={{ bg: customHoverColor }}
                color="white"
                onClick={handleSubmit}
                isLoading={loading}
              >
                {currentView === "add" ? "Create Admin" : "Update Admin"}
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </Flex>
    );
  }

  // Render List View with Fixed Layout
  return (
    <Flex 
      flexDirection="column" 
      pt={{ base: "5px", md: "10px" }} 
      height="100vh" 
      overflow="hidden"
    >
      {/* Fixed Statistics Cards */}
      <Box mb="24px">
        {/* Horizontal Cards Container */}
        <Flex
          direction="row"
          wrap="wrap"
          justify="center"
          gap={{ base: 3, md: 4 }}
          overflowX="auto"
          py={2}
          css={{
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: customColor,
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: customHoverColor,
            },
          }}
        >
          {/* Super Admins Card */}
          <Card
            minH="83px"
            cursor="pointer"
            onClick={() => handleCardClick("super")}
            border={activeFilter === "super" ? "2px solid" : "1px solid"}
            borderColor={activeFilter === "super" ? customColor : `${customColor}30`}
            transition="all 0.2s ease-in-out"
            bg="white"
            position="relative"
            overflow="hidden"
            w={{ base: "32%", md: "30%", lg: "25%" }}
            minW="100px"
            flex="1"
            _before={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${customColor}15, transparent)`,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            }}
            _hover={{
              transform: "translateY(-4px)",
              shadow: "xl",
              _before: {
                opacity: 1,
              },
              borderColor: customColor,
            }}
          >
            <CardBody position="relative" zIndex={1} p={{ base: 3, md: 4 }}>
              <Flex flexDirection="row" align="center" justify="space-between" w="100%">
                <Stat me="auto">
                  <StatLabel
                    fontSize={{ base: "sm", md: "md" }}
                    color="gray.600"
                    fontWeight="bold"
                    pb="0px"
                  >
                    Super Admins
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>
                      {adminData.filter((a) => a.role === "super admin").length}
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox 
                  as="box" 
                  h={{ base: "35px", md: "45px" }} 
                  w={{ base: "35px", md: "45px" }} 
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                  _groupHover={{
                    transform: "scale(1.1)",
                  }}
                >
                  <Icon
                    as={MdAdminPanelSettings}
                    h={{ base: "18px", md: "24px" }}
                    w={{ base: "18px", md: "24px" }}
                    color="white"
                  />
                </IconBox>
              </Flex>
            </CardBody>
          </Card>

          {/* Active Status Card */}
          <Card
            minH="83px"
            cursor="pointer"
            onClick={() => handleCardClick("active")}
            border={activeFilter === "active" ? "2px solid" : "1px solid"}
            borderColor={activeFilter === "active" ? customColor : `${customColor}30`}
            transition="all 0.2s ease-in-out"
            bg="white"
            position="relative"
            overflow="hidden"
            w={{ base: "32%", md: "30%", lg: "25%" }}
            minW="100px"
            flex="1"
            _before={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${customColor}15, transparent)`,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            }}
            _hover={{
              transform: "translateY(-4px)",
              shadow: "xl",
              _before: {
                opacity: 1,
              },
              borderColor: customColor,
            }}
          >
            <CardBody position="relative" zIndex={1} p={{ base: 3, md: 4 }}>
              <Flex flexDirection="row" align="center" justify="space-between" w="100%">
                <Stat me="auto">
                  <StatLabel
                    fontSize={{ base: "sm", md: "md" }}
                    color="gray.600"
                    fontWeight="bold"
                    pb="2px"
                  >
                    Active Status
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>
                      {adminData.filter((a) => a.status === "active").length}
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox 
                  as="box" 
                  h={{ base: "35px", md: "45px" }} 
                  w={{ base: "35px", md: "45px" }} 
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                  _groupHover={{
                    transform: "scale(1.1)",
                  }}
                >
                  <Icon
                    as={IoCheckmarkDoneCircleSharp}
                    h={{ base: "18px", md: "24px" }}
                    w={{ base: "18px", md: "24px" }}
                    color="white"
                  />
                </IconBox>
              </Flex>
            </CardBody>
          </Card>

          {/* Admins Only Card */}
          <Card
            minH="83px"
            cursor="pointer"
            onClick={() => handleCardClick("admins")}
            border={activeFilter === "admins" ? "2px solid" : "1px solid"}
            borderColor={activeFilter === "admins" ? customColor : `${customColor}30`}
            transition="all 0.2s ease-in-out"
            bg="white"
            position="relative"
            overflow="hidden"
            w={{ base: "32%", md: "30%", lg: "25%" }}
            minW="100px"
            flex="1"
            _before={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${customColor}15, transparent)`,
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            }}
            _hover={{
              transform: "translateY(-4px)",
              shadow: "xl",
              _before: {
                opacity: 1,
              },
              borderColor: customColor,
            }}
          >
            <CardBody position="relative" zIndex={1} p={{ base: 3, md: 4 }}>
              <Flex flexDirection="row" align="center" justify="space-between" w="100%">
                <Stat me="auto">
                  <StatLabel
                    fontSize={{ base: "sm", md: "md" }}
                    color="gray.600"
                    fontWeight="bold"
                    pb="2px"
                  >
                    Admins Only
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>
                      {adminData.filter((a) => a.role === "admin").length}
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox 
                  as="box" 
                  h={{ base: "35px", md: "45px" }} 
                  w={{ base: "35px", md: "45px" }} 
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                  _groupHover={{
                    transform: "scale(1.1)",
                  }}
                >
                  <Icon
                    as={FaUsers}
                    h={{ base: "18px", md: "24px" }}
                    w={{ base: "18px", md: "24px" }}
                    color="white"
                  />
                </IconBox>
              </Flex>
            </CardBody>
          </Card>
        </Flex>

        {/* Success/Error Message Display */}
        {error && (
          <Text
            color="red.500"
            mb={4}
            p={3}
            border="1px"
            borderColor="red.200"
            borderRadius="md"
            bg="red.50"
          >
            {error}
          </Text>
        )}
        {success && (
          <Text
            color="green.500"
            mb={4}
            p={3}
            border="1px"
            borderColor="green.200"
            borderRadius="md"
            bg="green.50"
          >
            {success}
          </Text>
        )}

        {/* Active Filter Display */}
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            {activeFilter === "super" && "Super Admins"}
            {activeFilter === "active" && "Active Admins"}
            {activeFilter === "admins" && "Admins Only"}
            {activeFilter === "all" && "All Administrators"}
          </Text>
          {activeFilter !== "all" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveFilter("all")}
              border="1px"
              borderColor={customColor}
              color={customColor}
              _hover={{ bg: customColor, color: "white" }}
            >
              Show All
            </Button>
          )}
        </Flex>
      </Box>

      {/* Fixed Table Container */}
      <Box 
        flex="1" 
        display="flex" 
        flexDirection="column" 
        p={2}
        pt={0}
        overflow="hidden"
        bg="white"
      >
        <Card 
          shadow="xl" 
          bg="white" 
          display="flex" 
          flexDirection="column"
          height="100%"
          minH="0"
        >
          {/* Fixed Table Header */}
          <CardHeader 
            p="5px" 
            pb="5px"
            bg="white" 
            flexShrink={0}
            borderBottom="1px solid"
            borderColor={`${customColor}20`}
          >
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              {/* Title */}
              <Heading size="md" flexShrink={0} color="gray.700">
                👤 Administrators Table
              </Heading>

              {/* Search Bar */}
              <Flex align="center" flex="1" maxW="400px">
                <Input
                  placeholder="Search by name, email, role, or status..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  size="sm"
                  mr={2}
                  borderColor={`${customColor}50`}
                  _hover={{ borderColor: customColor }}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  bg="white"
                />
                <Icon as={FaSearch} color="gray.400" />
                {searchTerm && (
                  <Button 
                    size="sm" 
                    ml={2} 
                    onClick={handleClearSearch}
                    bg="white"
                    color={customColor}
                    border="1px"
                    borderColor={customColor}
                    _hover={{ bg: customColor, color: "white" }}
                  >
                    Clear
                  </Button>
                )}
              </Flex>

              {/* Add Admin Button */}
              <Button
                bg={customColor}
                _hover={{ bg: customHoverColor }}
                color="white"
                onClick={handleAddAdmin}
                fontSize="sm"
                borderRadius="8px"
                flexShrink={0}
              >
                + Add Admin
              </Button>
            </Flex>
          </CardHeader>
          
          {/* Table Content Area - Scrollable Body with Fixed Header and Pagination */}
          <CardBody 
            bg="white" 
            flex="1" 
            display="flex" 
            flexDirection="column" 
            p={0} 
            overflow="hidden"
          >
            {tableLoading ? (
              <Flex justify="center" align="center" py={10} flex="1">
                <Spinner size="xl" color={customColor} />
                <Text ml={4}>Loading administrators...</Text>
              </Flex>
            ) : (
              <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
                {currentItems.length > 0 ? (
                  <>
                    {/* Table Container - Dynamic height with scrollable content */}
                    <Box 
                      flex="1"
                      display="flex"
                      flexDirection="column"
                      minH={{ base: "calc(100vh - 400px)", md: "calc(100vh - 450px)" }}
                      maxH={{ base: "calc(100vh - 400px)", md: "calc(100vh - 450px)" }}
                      overflow="hidden"
                      position="relative"
                    >
                      {/* Scrollable Table Area */}
                      <Box
                        flex="1"
                        overflowY="auto"
                        overflowX="auto"
                        css={{
                          '&::-webkit-scrollbar': {
                            width: '8px',
                            height: '8px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: customColor,
                            borderRadius: '4px',
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            background: customHoverColor,
                          },
                        }}
                        _hover={{
                          '&::-webkit-scrollbar-thumb': {
                            background: customColor,
                          }
                        }}
                      >
                        <Table variant="simple" size="md">
                          {/* Fixed Header */}
                        <Thead>
  <Tr>
    <Th 
      color="gray.700" 
      borderColor={`${customColor}30`}
      position="sticky"
      top={0}
      bg={`${customColor}90`}
      zIndex={10}
      fontWeight="bold"
      fontSize="sm"
      py={3}
      borderBottom="2px solid"
      borderBottomColor={`${customColor}50`}
    >
      Name
    </Th>
    <Th 
      color="gray.700" 
      borderColor={`${customColor}30`}
      position="sticky"
      top={0}
      bg={`${customColor}90`}
      zIndex={10}
      fontWeight="bold"
      fontSize="sm"
      py={3}
      borderBottom="2px solid"
      borderBottomColor={`${customColor}50`}
    >
      Email
    </Th>
    <Th 
      color="gray.700" 
      borderColor={`${customColor}30`}
      position="sticky"
      top={0}
      bg={`${customColor}90`}
      zIndex={10}
      fontWeight="bold"
      fontSize="sm"
      py={3}
      borderBottom="2px solid"
      borderBottomColor={`${customColor}50`}
    >
      Role
    </Th>
    <Th 
      color="gray.700" 
      borderColor={`${customColor}30`}
      position="sticky"
      top={0}
      bg={`${customColor}90`}
      zIndex={10}
      fontWeight="bold"
      fontSize="sm"
      py={3}
      borderBottom="2px solid"
      borderBottomColor={`${customColor}50`}
    >
      Status
    </Th>
    <Th 
      color="gray.700" 
      borderColor={`${customColor}30`}
      position="sticky"
      top={0}
      bg={`${customColor}90`}
      zIndex={10}
      fontWeight="bold"
      fontSize="sm"
      py={3}
      borderBottom="2px solid"
      borderBottomColor={`${customColor}50`}
    >
      Actions
    </Th>
  </Tr>
</Thead>
                          {/* Scrollable Body */}
                          <Tbody>
                            {displayItems.map((admin, index) => {
                              // Handle empty rows
                              if (admin.isEmpty) {
                                return (
                                  <Tr 
                                    key={admin._id}
                                    bg="white"
                                    height="60px"
                                  >
                                    <Td borderColor={`${customColor}20`} colSpan={5}>
                                      <Box height="60px" />
                                    </Td>
                                  </Tr>
                                );
                              }

                              const statusColors = getStatusColor(admin.status);
                              return (
                                <Tr 
                                  key={admin._id || index}
                                  bg="white"
                                  _hover={{ bg: `${customColor}10` }}
                                  borderBottom="1px"
                                  borderColor={`${customColor}20`}
                                  height="60px"
                                >
                                  <Td borderColor={`${customColor}20`}>{admin.name}</Td>
                                  <Td borderColor={`${customColor}20`}>{admin.email}</Td>
                                  <Td borderColor={`${customColor}20`}>{admin.role}</Td>
                                  <Td borderColor={`${customColor}20`}>
                                    <Badge
                                      bg={statusColors.bg}
                                      color={statusColors.color}
                                      px={3}
                                      py={1}
                                      borderRadius="full"
                                      fontSize="sm"
                                      fontWeight="bold"
                                    >
                                      {admin.status || "active"}
                                    </Badge>
                                  </Td>
                                  <Td borderColor={`${customColor}20`}>
                                    <IconButton
                                      aria-label="Edit admin"
                                      icon={<FaEdit />}
                                      bg="white"
                                      color={customColor}
                                      border="1px"
                                      borderColor={customColor}
                                      _hover={{ bg: customColor, color: "white" }}
                                      size="sm"
                                      onClick={() => handleEditAdmin(admin)}
                                    />
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      </Box>

                      {/* Fixed Pagination Bar - Always visible at bottom */}
                      <Box 
                        position="sticky"
                        bottom="0"
                        left="0"
                        right="0"
                        flexShrink={0}
                        p="16px"
                        borderTop="1px solid"
                        borderColor={`${customColor}20`}
                        bg="white"
                        boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)"
                        zIndex={10}
                      >
                        <Flex
                          justify="space-between"
                          align="center"
                          direction={{ base: "column", sm: "row" }}
                          gap={3}
                        >
                          <Text 
                            fontSize="sm" 
                            color="gray.600" 
                            alignSelf={{ base: "center", sm: "start" }}
                            mb={{ base: 2, sm: 0 }}
                            textAlign={{ base: "center", sm: "left" }}
                          >
                            Showing {indexOfFirstItem + 1} to{" "}
                            {Math.min(indexOfLastItem, filteredData.length)} of{" "}
                            {filteredData.length} entries
                            {searchTerm && ` (filtered from ${adminData.length} total)`}
                          </Text>
                          
                          {/* Centered Pagination Controls */}
                          <Flex 
                            align="center" 
                            gap={3} 
                            justify="center"
                            flex="1"
                            maxW="400px"
                          >
                            <Button
                              size="sm"
                              onClick={handlePrevPage}
                              isDisabled={currentPage === 1}
                              leftIcon={<FaChevronLeft />}
                              bg="white"
                              color={customColor}
                              border="1px"
                              borderColor={customColor}
                              _hover={{ bg: customColor, color: "white" }}
                              _disabled={{ 
                                opacity: 0.5, 
                                cursor: "not-allowed",
                                bg: "gray.100",
                                color: "gray.400",
                                borderColor: "gray.300"
                              }}
                              flexShrink={0}
                            >
                              <Text display={{ base: "none", sm: "block" }}>Previous</Text>
                              <Text display={{ base: "block", sm: "none" }}>Prev</Text>
                            </Button>

                            {/* Page Number Display - Centered with 1/X format */}
                            <Flex 
                              align="center" 
                              gap={2}
                              bg={`${customColor}10`}
                              px={4}
                              py={2}
                              borderRadius="8px"
                              minW="120px"
                              justify="center"
                            >
                              <Text fontSize="sm" fontWeight="bold" color={customColor}>
                                {currentPage}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                /
                              </Text>
                              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                                {totalPages}
                              </Text>
                            </Flex>

                            <Button
                              size="sm"
                              onClick={handleNextPage}
                              isDisabled={currentPage === totalPages}
                              rightIcon={<FaChevronRight />}
                              bg="white"
                              color={customColor}
                              border="1px"
                              borderColor={customColor}
                              _hover={{ bg: customColor, color: "white" }}
                              _disabled={{ 
                                opacity: 0.5, 
                                cursor: "not-allowed",
                                bg: "gray.100",
                                color: "gray.400",
                                borderColor: "gray.300"
                              }}
                              flexShrink={0}
                            >
                              Next
                            </Button>
                          </Flex>

                          {/* Empty flex box to balance the layout */}
                          <Box flex="1" display={{ base: "none", sm: "block" }} />
                        </Flex>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Flex 
                    height="200px" 
                    justify="center" 
                    align="center" 
                    border="1px dashed"
                    borderColor={`${customColor}30`}
                    borderRadius="md"
                    flex="1"
                  >
                    <Text textAlign="center" color="gray.500" fontSize="lg">
                      {dataLoaded
                        ? adminData.length === 0
                          ? "No administrators found."
                          : searchTerm
                          ? "No administrators match your search."
                          : "No administrators match the selected filter."
                        : "Loading administrators..."}
                    </Text>
                  </Flex>
                )}
              </Box>
            )}
          </CardBody>
        </Card>
      </Box>
    </Flex>
  );
}

// Custom IconBox component
function IconBox({ children, ...rest }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="12px"
      {...rest}
    >
      {children}
    </Box>
  );
}

export default AdminManagement;