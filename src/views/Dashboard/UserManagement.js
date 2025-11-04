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
  IconButton,
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
  Avatar,
  InputGroup,
  InputRightElement,
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
  FaUserPlus,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdAdminPanelSettings, MdPerson } from "react-icons/md";
import {
  getAllUsers,
  updateUser,
  createUser,
} from "views/utils/axiosInstance";

// Main User Management Component
function UserManagement() {
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

  const [userData, setUserData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Search filter state
  const [showPassword, setShowPassword] = useState(false); // Show password state
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Show confirm password state

  // View state - 'list', 'add', 'edit'
  const [currentView, setCurrentView] = useState("list");
  const [editingUser, setEditingUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    profileImage: "",
    role: "user"
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Toggle password visibility
  const handleTogglePassword = () => setShowPassword(!showPassword);
  const handleToggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const handleAddUser = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      profileImage: "",
      role: "user"
    });
    setEditingUser(null);
    setCurrentView("add");
    setError("");
    setSuccess("");
    setShowPassword(false); // Reset password visibility
    setShowConfirmPassword(false); // Reset confirm password visibility
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

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;

      setLoading(true);
      setTableLoading(true);
      setDataLoaded(false);
      try {
        const response = await getAllUsers();
        console.log("Fetched users response:", response);
        
        // Handle different response formats
        const users = response.data?.users || response.data || response?.users || response || [];

        // Sort users in descending order (newest first)
        const sortedUsers = users.sort(
          (a, b) =>
            new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id)
        );

        setUserData(sortedUsers);
        setFilteredData(sortedUsers);
        setDataLoaded(true);
      } catch (err) {
        console.error("Error fetching users:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to load user list.";
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
      fetchUsers();
    }
  }, [currentUser, toast]);

  // Apply filters and search
  useEffect(() => {
    if (!dataLoaded) return;

    setTableLoading(true);
    setCurrentPage(1); // Reset to first page when filter changes

    const timer = setTimeout(() => {
      let filtered = userData;

      // Apply role/status filter
      switch (activeFilter) {
        case "active":
          filtered = userData.filter((user) => user.status === "active");
          break;
        case "inactive":
          filtered = userData.filter((user) => user.status === "inactive");
          break;
        case "verified":
          filtered = userData.filter((user) => user.isVerified === true);
          break;
        default:
          filtered = userData;
      }

      // Apply search filter
      if (searchTerm.trim() !== "") {
        filtered = filtered.filter(
          (user) =>
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.status && user.status.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      setFilteredData(filtered);
      setTableLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeFilter, userData, dataLoaded, searchTerm]);

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

  // Handle edit user - show edit form
  const handleEditUser = (user) => {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      email: user.email || "",
      password: "", // Don't pre-fill password for security
      confirmPassword: "",
      profileImage: user.profileImage || "",
      role: user.role || "user"
    });
    setEditingUser(user);
    setCurrentView("edit");
    setError("");
    setSuccess("");
    setShowPassword(false); // Reset password visibility
    setShowConfirmPassword(false); // Reset confirm password visibility
  };

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView("list");
    setEditingUser(null);
    setError("");
    setSuccess("");
    setShowPassword(false); // Reset password visibility
    setShowConfirmPassword(false); // Reset confirm password visibility
  };

  // Handle form submit for both add and edit
  const handleSubmit = async () => {
    // Frontend validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      return toast({
        title: "Validation Error",
        description: "First name, last name, and email are required",
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

    // For add user, password is required
    if (currentView === "add" && !formData.password) {
      return toast({
        title: "Validation Error",
        description: "Password is required for new users",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    // Validate password strength if provided
    if (formData.password) {
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

    // Check password confirmation for add user
    if (currentView === "add" && formData.password !== formData.confirmPassword) {
      return toast({
        title: "Validation Error",
        description: "Passwords do not match",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Prepare data for API with exact structure
      const userDataToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        role: formData.role,
        profileImage: formData.profileImage || "",
        ...(formData.password && { password: formData.password })
      };

      let response;
      let successMessage;

      if (currentView === "edit" && editingUser) {
        // Update existing user
        response = await updateUser(editingUser._id, userDataToSend);
        successMessage = `User ${response.data?.firstName || formData.firstName} updated successfully`;
      } else {
        // Create new user
        response = await createUser(userDataToSend);
        successMessage = `User ${response.data?.firstName || formData.firstName} created successfully`;
      }

      console.log("User operation response:", response);

      // Extract user data from response
      const userResponse = response.data || response;

      toast({
        title: currentView === "edit" ? "User Updated" : "User Created",
        description: successMessage,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh user list
      const fetchUsers = async () => {
        try {
          const usersResponse = await getAllUsers();
          const users = usersResponse.data?.users || usersResponse.data || usersResponse?.users || usersResponse || [];
          const sortedUsers = users.sort(
            (a, b) => new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id)
          );
          setUserData(sortedUsers);
          setFilteredData(sortedUsers);
        } catch (err) {
          console.error("Error refreshing users:", err);
        }
      };

      await fetchUsers();

      setSuccess(successMessage);
      
      // Reset form and go back to list
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        profileImage: "",
        role: "user"
      });
      setEditingUser(null);
      setCurrentView("list");

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

  // Auto-hide success/error messages after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Get status color with background
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { color: "white", bg: "#9d4edd" };
      case "inactive":
        return { color: "white", bg: "red.500" };
      case "pending":
        return { color: "white", bg: "yellow.500" };
      default:
        return { color: "white", bg: "#9d4edd" };
    }
  };

  // Get verification badge
  const getVerificationBadge = (isVerified) => {
    if (isVerified) {
      return { text: "Verified", color: "green" };
    } else {
      return { text: "Not Verified", color: "red" };
    }
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
                {currentView === "add" ? "Add New User" : "Edit User"}
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
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
              <FormControl isRequired>
                <FormLabel htmlFor="firstName" color="gray.700">First Name</FormLabel>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="First Name"
                  onChange={handleInputChange}
                  value={formData.firstName}
                  borderColor={`${customColor}50`}
                  _hover={{ borderColor: customColor }}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  bg="white"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel htmlFor="lastName" color="gray.700">Last Name</FormLabel>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Last Name"
                  onChange={handleInputChange}
                  value={formData.lastName}
                  borderColor={`${customColor}50`}
                  _hover={{ borderColor: customColor }}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  bg="white"
                />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
              <FormControl isRequired>
                <FormLabel htmlFor="email" color="gray.700">Email</FormLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  onChange={handleInputChange}
                  value={formData.email}
                  borderColor={`${customColor}50`}
                  _hover={{ borderColor: customColor }}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  bg="white"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="phone" color="gray.700">Phone</FormLabel>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Phone Number"
                  onChange={handleInputChange}
                  value={formData.phone}
                  borderColor={`${customColor}50`}
                  _hover={{ borderColor: customColor }}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  bg="white"
                />
              </FormControl>
            </SimpleGrid>

            <FormControl mb="24px">
              <FormLabel htmlFor="role" color="gray.700">Role</FormLabel>
              <Select
                id="role"
                name="role"
                onChange={handleInputChange}
                value={formData.role}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                bg="white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super admin">Super Admin</option>
              </Select>
            </FormControl>

            <FormControl mb="24px">
              <FormLabel htmlFor="profileImage" color="gray.700">Profile Image URL</FormLabel>
              <Input
                id="profileImage"
                name="profileImage"
                placeholder="Profile Image URL"
                onChange={handleInputChange}
                value={formData.profileImage}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                bg="white"
              />
            </FormControl>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
              <FormControl isRequired={currentView === "add"}>
                <FormLabel htmlFor="password" color="gray.700">
                  {currentView === "add" ? "Password *" : "New Password (optional)"}
                </FormLabel>
                <InputGroup>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={currentView === "add" ? "Password" : "New Password"}
                    onChange={handleInputChange}
                    value={formData.password}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                    pr="3rem"
                  />
                  <InputRightElement width="3rem">
                    <IconButton
                      h="1.75rem"
                      size="sm"
                      onClick={handleTogglePassword}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                      variant="ghost"
                      color={customColor}
                      _hover={{ bg: "transparent", color: customHoverColor }}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {currentView === "add" && (
                <FormControl isRequired>
                  <FormLabel htmlFor="confirmPassword" color="gray.700">
                    Confirm Password *
                  </FormLabel>
                  <InputGroup>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      onChange={handleInputChange}
                      value={formData.confirmPassword}
                      borderColor={`${customColor}50`}
                      _hover={{ borderColor: customColor }}
                      _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                      bg="white"
                      pr="3rem"
                    />
                    <InputRightElement width="3rem">
                      <IconButton
                        h="1.75rem"
                        size="sm"
                        onClick={handleToggleConfirmPassword}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        icon={showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        variant="ghost"
                        color={customColor}
                        _hover={{ bg: "transparent", color: customHoverColor }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              )}
            </SimpleGrid>

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
                {currentView === "add" ? "Create User" : "Update User"}
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
      pt={{ base: "120px", md: "45px" }} 
      height="100vh" 
      overflow="hidden"
    >
      {/* Fixed Statistics Cards */}
      <Box>
        <Grid
          templateColumns={{ sm: "1fr", md: "1fr 1fr 1fr" }}
          gap="24px"
          mb="24px"
        >
          {/* Total Users Card */}
          <Card
            minH="83px"
            cursor="pointer"
            onClick={() => handleCardClick("all")}
            border={activeFilter === "all" ? "2px solid" : "1px solid"}
            borderColor={activeFilter === "all" ? customColor : `${customColor}30`}
            transition="all 0.2s ease-in-out"
            bg="white"
            position="relative"
            overflow="hidden"
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
            <CardBody position="relative" zIndex={1}>
              <Flex flexDirection="row" align="center" justify="center" w="100%">
                <Stat me="auto">
                  <StatLabel
                    fontSize="sm"
                    color="gray.600"
                    fontWeight="bold"
                    pb="2px"
                  >
                    Total Users
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize="lg" color={textColor}>
                      {userData.length}
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox 
                  as="box" 
                  h={"45px"} 
                  w={"45px"} 
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                  _groupHover={{
                    transform: "scale(1.1)",
                  }}
                >
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

          {/* Active Users Card */}
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
            <CardBody position="relative" zIndex={1}>
              <Flex flexDirection="row" align="center" justify="center" w="100%">
                <Stat me="auto">
                  <StatLabel
                    fontSize="sm"
                    color="gray.600"
                    fontWeight="bold"
                    pb="2px"
                  >
                    Active Users
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize="lg" color={textColor}>
                      {userData.filter((a) => a.status === "active").length}
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox 
                  as="box" 
                  h={"45px"} 
                  w={"45px"} 
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                  _groupHover={{
                    transform: "scale(1.1)",
                  }}
                >
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

          {/* Verified Users Card */}
          <Card
            minH="83px"
            cursor="pointer"
            onClick={() => handleCardClick("verified")}
            border={activeFilter === "verified" ? "2px solid" : "1px solid"}
            borderColor={activeFilter === "verified" ? customColor : `${customColor}30`}
            transition="all 0.2s ease-in-out"
            bg="white"
            position="relative"
            overflow="hidden"
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
            <CardBody position="relative" zIndex={1}>
              <Flex flexDirection="row" align="center" justify="center" w="100%">
                <Stat me="auto">
                  <StatLabel
                    fontSize="sm"
                    color="gray.600"
                    fontWeight="bold"
                    pb="2px"
                  >
                    Verified Users
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize="lg" color={textColor}>
                      {userData.filter((a) => a.isVerified === true).length}
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox 
                  as="box" 
                  h={"45px"} 
                  w={"45px"} 
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                  _groupHover={{
                    transform: "scale(1.1)",
                  }}
                >
                  <Icon
                    as={MdPerson}
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
            {activeFilter === "active" && "Active Users"}
            {activeFilter === "inactive" && "Inactive Users"}
            {activeFilter === "verified" && "Verified Users"}
            {activeFilter === "all" && "All Users"}
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
        p={6}
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
            p="24px" 
            pb="16px"
            bg="white" 
            flexShrink={0}
            borderBottom="1px solid"
            borderColor={`${customColor}20`}
          >
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              {/* Title */}
              <Heading size="md" flexShrink={0} color="gray.700">
                👥 Users Table
              </Heading>

              {/* Search Bar */}
              <Flex align="center" flex="1" maxW="400px">
                <Input
                  placeholder="Search by name, email, phone, or role..."
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

              {/* Add User Button */}
              <Button
                bg={customColor}
                _hover={{ bg: customHoverColor }}
                color="white"
                onClick={handleAddUser}
                fontSize="sm"
                borderRadius="8px"
                flexShrink={0}
                leftIcon={<FaUserPlus />}
              >
                Add User
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
                <Text ml={4}>Loading users...</Text>
              </Flex>
            ) : (
              <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
                {currentItems.length > 0 ? (
                  <>
                    {/* Table Container - Fixed height with scrollable content */}
                   <Box 
  position="relative" 
  flex="1"
  overflow="hidden"
  display="flex"
  flexDirection="column"
>
  {/* Single Table Container */}
  <Box
    flex="1"
    display="flex"
    flexDirection="column"
    overflow="hidden"
  >
    {/* Scrollable Table */}
    <Box
      flex="1"
      overflow="auto"
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
    >
      <Table variant="simple" size="md">
        {/* Fixed Header */}
        <Thead>
          <Tr bg={`${customColor}20`}>
            <Th 
              color="gray.700" 
              borderColor={`${customColor}30`}
              position="sticky"
              top={0}
              bg={`${customColor}20`}
              zIndex={1}
            >
              User
            </Th>
            <Th 
              color="gray.700" 
              borderColor={`${customColor}30`}
              position="sticky"
              top={0}
              bg={`${customColor}20`}
              zIndex={1}
            >
              Contact
            </Th>
            <Th 
              color="gray.700" 
              borderColor={`${customColor}30`}
              position="sticky"
              top={0}
              bg={`${customColor}20`}
              zIndex={1}
            >
              Role
            </Th>
            <Th 
              color="gray.700" 
              borderColor={`${customColor}30`}
              position="sticky"
              top={0}
              bg={`${customColor}20`}
              zIndex={1}
            >
              Actions
            </Th>
          </Tr>
        </Thead>

        {/* Scrollable Body */}
        <Tbody>
          {currentItems.map((user, index) => {
            const statusColors = getStatusColor(user.status);
            const verification = getVerificationBadge(user.isVerified);
            return (
              <Tr 
                key={user._id || index}
                bg="white"
                _hover={{ bg: `${customColor}10` }}
                borderBottom="1px"
                borderColor={`${customColor}20`}
                height="60px"
              >
                <Td borderColor={`${customColor}20`}>
                  <Flex align="center">
                    <Avatar
                      size="sm"
                      name={`${user.firstName} ${user.lastName}`}
                      src={user.profileImage}
                      mr={3}
                    />
                    <Box>
                      <Text fontWeight="medium">{`${user.firstName} ${user.lastName}`}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {user.email}
                      </Text>
                    </Box>
                  </Flex>
                </Td>
                <Td borderColor={`${customColor}20`}>
                  <Box>
                    <Text>{user.email}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {user.phone || "No phone"}
                    </Text>
                  </Box>
                </Td>
                <Td borderColor={`${customColor}20`}>
                  <Badge
                    colorScheme={
                      user.role === "super admin" ? "purple" :
                      user.role === "admin" ? "blue" : "gray"
                    }
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {user.role || "user"}
                  </Badge>
                </Td>
                <Td borderColor={`${customColor}20`}>
                  <IconButton
                    aria-label="Edit user"
                    icon={<FaEdit />}
                    bg="white"
                    color={customColor}
                    border="1px"
                    borderColor={customColor}
                    _hover={{ bg: customColor, color: "white" }}
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  </Box>
</Box>
                    {/* Fixed Pagination Controls */}
                    <Box 
                      flexShrink={0} 
                      p="24px"
                      pt="16px"
                      borderTop="1px solid"
                      borderColor={`${customColor}20`}
                      bg="white"
                    >
                      <Flex
                        justify="space-between"
                        align={{ base: "stretch", md: "center" }}
                        direction={{ base: "column", md: "row" }}
                        gap={4}
                      >
                        <Text fontSize="sm" color="gray.600" alignSelf="center">
                          Showing {indexOfFirstItem + 1} to{" "}
                          {Math.min(indexOfLastItem, filteredData.length)} of{" "}
                          {filteredData.length} entries
                          {searchTerm &&
                            ` (filtered from ${userData.length} total)`}
                        </Text>
                        <Flex align="center" gap={2} justify="center" flexWrap="wrap">
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
                          <Flex gap={1} flexWrap="wrap" justify="center">
                            {(() => {
                              const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                              
                              if (totalPages <= 7) {
                                return pages.map(page => (
                                  <Button
                                    key={page}
                                    size="sm"
                                    variant={currentPage === page ? "solid" : "outline"}
                                    bg={currentPage === page ? customColor : "white"}
                                    color={currentPage === page ? "white" : customColor}
                                    border="1px"
                                    borderColor={customColor}
                                    _hover={currentPage === page ? 
                                      { bg: customHoverColor } : 
                                      { bg: customColor, color: "white" }
                                    }
                                    onClick={() => handlePageClick(page)}
                                    minW="40px"
                                  >
                                    {page}
                                  </Button>
                                ));
                              }

                              const visiblePages = new Set([
                                1,
                                2,
                                3,
                                currentPage - 1,
                                currentPage,
                                currentPage + 1,
                                totalPages - 2,
                                totalPages - 1,
                                totalPages
                              ].filter(page => page >= 1 && page <= totalPages));

                              const sortedPages = Array.from(visiblePages).sort((a, b) => a - b);
                              const result = [];

                              sortedPages.forEach((page, index) => {
                                if (index > 0 && page - sortedPages[index - 1] > 1) {
                                  result.push(
                                    <Text key={`ellipsis-${page}`} px={2} color="gray.500" alignSelf="center">
                                      ...
                                    </Text>
                                  );
                                }

                                result.push(
                                  <Button
                                    key={page}
                                    size="sm"
                                    variant={currentPage === page ? "solid" : "outline"}
                                    bg={currentPage === page ? customColor : "white"}
                                    color={currentPage === page ? "white" : customColor}
                                    border="1px"
                                    borderColor={customColor}
                                    _hover={currentPage === page ? 
                                      { bg: customHoverColor } : 
                                      { bg: customColor, color: "white" }
                                    }
                                    onClick={() => handlePageClick(page)}
                                    minW="40px"
                                  >
                                    {page}
                                  </Button>
                                );
                              });

                              return result;
                            })()}
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
                        ? userData.length === 0
                          ? "No users found."
                          : searchTerm
                          ? "No users match your search."
                          : "No users match the selected filter."
                        : "Loading users..."}
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

export default UserManagement;