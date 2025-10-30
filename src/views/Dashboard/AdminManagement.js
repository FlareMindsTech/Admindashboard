// Chakra imports
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Icon,
  Input,
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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
  };

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView("list");
    setEditingAdmin(null);
    setError("");
    setSuccess("");
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
      <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
        <Card bg="white" shadow="xl">
          <CardHeader bg="white">
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
          <CardBody bg="white">
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
              <Input
                id="password"
                name="password"
                type="password"
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
            </FormControl>
            <Flex justify="flex-end" mt={6}>
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

  // Render List View
  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
      {/* Statistics Cards */}
      <Grid
        templateColumns={{ sm: "1fr", md: "1fr 1fr 1fr" }}
        gap="24px"
        mb="24px"
      >
        {/* Super Admins Card */}
        <Card
          minH="83px"
          cursor="pointer"
          onClick={() => handleCardClick("super")}
          border={activeFilter === "super" ? "2px solid" : "1px solid"}
          borderColor={activeFilter === "super" ? customColor : `${customColor}30`}
          transition="all 0.2s"
          bg="white"
          _hover={{ transform: "translateY(-2px)", shadow: "lg", bg: `${customColor}05` }}
        >
          <CardBody>
            <Flex flexDirection="row" align="center" justify="center" w="100%">
              <Stat me="auto">
                <StatLabel
                  fontSize="sm"
                  color="gray.600"
                  fontWeight="bold"
                  pb="2px"
                >
                  Super Admins
                </StatLabel>
                <Flex>
                  <StatNumber fontSize="lg" color={textColor}>
                    {adminData.filter((a) => a.role === "super admin").length}
                  </StatNumber>
                </Flex>
              </Stat>
              <IconBox as="box" h={"45px"} w={"45px"} bg={customColor}>
                <Icon
                  as={MdAdminPanelSettings}
                  h={"24px"}
                  w={"24px"}
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
          transition="all 0.2s"
          bg="white"
          _hover={{ transform: "translateY(-2px)", shadow: "lg", bg: `${customColor}05` }}
        >
          <CardBody>
            <Flex flexDirection="row" align="center" justify="center" w="100%">
              <Stat me="auto">
                <StatLabel
                  fontSize="sm"
                  color="gray.600"
                  fontWeight="bold"
                  pb="2px"
                >
                  Active Status
                </StatLabel>
                <Flex>
                  <StatNumber fontSize="lg" color={textColor}>
                    {adminData.filter((a) => a.status === "active").length}
                  </StatNumber>
                </Flex>
              </Stat>
              <IconBox as="box" h={"45px"} w={"45px"} bg={customColor}>
                <Icon
                  as={IoCheckmarkDoneCircleSharp}
                  h={"24px"}
                  w={"24px"}
                  color="white"
                />
              </IconBox>
            </Flex>
          </CardBody>
        </Card>

        {/* Admins Only Card */}
        <Card
          minH="100px"
          cursor="pointer"
          onClick={() => handleCardClick("admins")}
          border={activeFilter === "admins" ? "2px solid" : "1px solid"}
          borderColor={activeFilter === "admins" ? customColor : `${customColor}30`}
          transition="all 0.2s"
          bg="white"
          _hover={{ transform: "translateY(-2px)", shadow: "lg", bg: `${customColor}05` }}
        >
          <CardBody>
            <Flex flexDirection="row" align="center" justify="center" w="100%">
              <Stat me="auto">
                <StatLabel
                  fontSize="sm"
                  color="gray.600"
                  fontWeight="bold"
                  pb="2px"
                >
                  Admins Only
                </StatLabel>
                <Flex>
                  <StatNumber fontSize="lg" color={textColor}>
                    {adminData.filter((a) => a.role === "admin").length}
                  </StatNumber>
                </Flex>
              </Stat>
              <IconBox as="box" h={"45px"} w={"45px"} bg={customColor}>
                <Icon
                  as={FaUsers}
                  h={"24px"}
                  w={"24px"}
                  color="white"
                />
              </IconBox>
            </Flex>
          </CardBody>
        </Card>
      </Grid>

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

      {/* Admin Table with new styling */}
      <Card p={5} shadow="xl" bg="white">
        <CardHeader p="6px 0px 22px 0px" bg="white">
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
        <CardBody bg="white">
          
          {tableLoading ? (
            <Flex justify="center" align="center" py={10}>
              <Spinner size="xl" color={customColor} />
              <Text ml={4}>Loading administrators...</Text>
            </Flex>
          ) : (
            <>
              {currentItems.length > 0 ? (
                <>
                  <Table variant="simple" bg="white">
                    <Thead bg={`${customColor}20`}>
                      <Tr>
                        <Th color="gray.700" borderColor={`${customColor}30`}>Name</Th>
                        <Th color="gray.700" borderColor={`${customColor}30`}>Email</Th>
                        <Th color="gray.700" borderColor={`${customColor}30`}>Role</Th>
                        <Th color="gray.700" borderColor={`${customColor}30`}>Status</Th>
                        <Th color="gray.700" borderColor={`${customColor}30`}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {currentItems.map((admin, index) => {
                        const statusColors = getStatusColor(admin.status);
                        return (
                          <Tr 
                            key={admin._id || index}
                            bg="white"
                            _hover={{ bg: `${customColor}10` }}
                            borderBottom="1px"
                            borderColor={`${customColor}20`}
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
                              <Button
                                bg="white"
                                color={customColor}
                                border="1px"
                                borderColor={customColor}
                                _hover={{ bg: customColor, color: "white" }}
                                size="sm"
                                leftIcon={<FaEdit />}
                                onClick={() => handleEditAdmin(admin)}
                              >
                                Edit
                              </Button>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Flex
                      justify="space-between"
                      align="center"
                      mt={4}
                      pt={4}
                      borderTop="1px solid"
                      borderColor={`${customColor}20`}
                    >
                      <Text fontSize="sm" color="gray.600">
                        Showing {indexOfFirstItem + 1} to{" "}
                        {Math.min(indexOfLastItem, filteredData.length)} of{" "}
                        {filteredData.length} entries
                        {searchTerm &&
                          ` (filtered from ${adminData.length} total)`}
                      </Text>
                      <Flex align="center" gap={2}>
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
                          _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                        >
                          Previous
                        </Button>

                        {/* Page Numbers */}
                        <Flex gap={1}>
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <Button
                              key={page}
                              size="sm"
                              variant={
                                currentPage === page ? "solid" : "outline"
                              }
                              bg={currentPage === page ? customColor : "white"}
                              color={currentPage === page ? "white" : customColor}
                              border="1px"
                              borderColor={customColor}
                              _hover={currentPage === page ? 
                                { bg: customHoverColor } : 
                                { bg: customColor, color: "white" }
                              }
                              onClick={() => handlePageClick(page)}
                            >
                              {page}
                            </Button>
                          ))}
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
                          _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                        >
                          Next
                        </Button>
                      </Flex>
                    </Flex>
                  )}
                </>
              ) : (
                <Text textAlign="center" py={10} color="gray.500" fontSize="lg">
                  {dataLoaded
                    ? adminData.length === 0
                      ? "No administrators found."
                      : searchTerm
                      ? "No administrators match your search."
                      : "No administrators match the selected filter."
                    : "Loading administrators..."}
                </Text>
              )}
            </>
          )}
        </CardBody>
      </Card>
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