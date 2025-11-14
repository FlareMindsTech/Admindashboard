// BillingManagement
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
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
  HStack,
  Divider,
  Image,
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaEye,
  FaEdit,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaShoppingCart,
  FaCheckCircle,
  FaTruck,
} from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdPayments, MdReceipt } from "react-icons/md";

// Import your API functions
import { getAllOrders, updateOrders } from "../utils/axiosInstance";

// Main Billing Management Component
function BillingManagement() {
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

  const [billingData, setBillingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // View state - 'list', 'add', 'edit'
  const [currentView, setCurrentView] = useState("list");

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    amount: "",
    dueDate: "",
    status: "pending",
    description: "",
    items: [],
  });

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

  // Helper function to safely get nested properties
  const safeGet = (obj, path, fallback = undefined) => {
    if (!path) return fallback;
    try {
      return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback;
    } catch {
      return fallback;
    }
  };

  // Helper function to transform order data to billing format
  const transformOrderToBilling = (orders) => {
    return orders.map((order, index) => {
      const user = safeGet(order, "user", {});
      const address = safeGet(order, "address", {});
      const orderItems = safeGet(order, "orderItems", []);
      
      return {
        _id: safeGet(order, "_id", `order-${index}`),
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
        customerName: safeGet(user, "name", safeGet(user, "email", "Unknown Customer").split('@')[0]),
        customerEmail: safeGet(user, "email", "No email"),
        amount: safeGet(order, "total_amount", safeGet(order, "totalAmount", 0)),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: mapOrderStatusToBillingStatus(safeGet(order, "status", "pending")),
        createdAt: safeGet(order, "createdAt", new Date().toISOString()),
        items: orderItems.map(item => ({
          name: safeGet(item, "name", "Unknown Item"),
          quantity: safeGet(item, "qty", safeGet(item, "quantity", 1)),
          price: safeGet(item, "price", 0)
        }))
      };
    });
  };

  // Map order status to billing status
  const mapOrderStatusToBillingStatus = (orderStatus) => {
    const statusMap = {
      'delivered': 'paid',
      'confirmed': 'pending',
      'pending': 'pending',
      'completed': 'paid',
      'failed': 'overdue',
      'refunded': 'overdue'
    };
    return statusMap[orderStatus?.toLowerCase()] || 'pending';
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

  // Fetch billing data from orders API
  useEffect(() => {
    const fetchBillingData = async () => {
      if (!currentUser) return;

      setLoading(true);
      setTableLoading(true);
      setDataLoaded(false);
      try {
        // Fetch orders from API
        const res = await getAllOrders();
        
        // Extract orders array from response
        let orders = [];
        if (Array.isArray(res)) {
          orders = res;
        } else if (res && Array.isArray(res.orders)) {
          orders = res.orders;
        } else if (res && Array.isArray(res.data)) {
          orders = res.data;
        } else {
          // Try to find array in response object
          const maybeArray = Object.values(res || {}).find((v) => Array.isArray(v));
          if (Array.isArray(maybeArray)) {
            orders = maybeArray;
          }
        }

        // Transform orders to billing format
        const billingData = transformOrderToBilling(orders);
        
        // Sort data by creation date (newest first)
        const sortedData = billingData.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setBillingData(sortedData);
        setFilteredData(sortedData);
        setDataLoaded(true);
        setTableLoading(false);
        setLoading(false);
        
      } catch (err) {
        console.error("Error fetching billing data:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to load billing data.";
        setError(errorMessage);
        setDataLoaded(true);
        toast({
          title: "Fetch Error",
          description: errorMessage,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setTableLoading(false);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchBillingData();
    }
  }, [currentUser, toast]);

  // Apply filters and search
  useEffect(() => {
    if (!dataLoaded) return;

    setTableLoading(true);
    setCurrentPage(1);

    const timer = setTimeout(() => {
      let filtered = billingData;

      // Apply status filter
      switch (activeFilter) {
        case "paid":
          filtered = billingData.filter((bill) => bill.status === "paid");
          break;
        case "pending":
          filtered = billingData.filter((bill) => bill.status === "pending");
          break;
        case "overdue":
          filtered = billingData.filter((bill) => bill.status === "overdue");
          break;
        default:
          filtered = billingData;
      }

      // Apply search filter
      if (searchTerm.trim() !== "") {
        filtered = filtered.filter(
          (bill) =>
            bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.amount.toString().includes(searchTerm)
        );
      }

      // Maintain order (newest first)
      const sortedFilteredData = filtered.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setFilteredData(sortedFilteredData);
      setTableLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeFilter, billingData, dataLoaded, searchTerm]);

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

  // Handle view bill
  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setViewModalOpen(true);
  };

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView("list");
    setError("");
    setSuccess("");
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (billId) => {
    try {
      // Find the original order to update
      const billToUpdate = billingData.find(bill => bill._id === billId);
      if (!billToUpdate) {
        throw new Error("Bill not found");
      }

      // Update the order status to 'delivered' (which maps to 'paid' in billing)
      await updateOrders(billId, { status: "delivered" });

      // Update local state
      setBillingData(prev => 
        prev.map(bill => 
          bill._id === billId ? { ...bill, status: "paid" } : bill
        )
      );
      setFilteredData(prev => 
        prev.map(bill => 
          bill._id === billId ? { ...bill, status: "paid" } : bill
        )
      );
      
      toast({
        title: "Bill Updated",
        description: "Bill marked as paid successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error marking bill as paid:", err);
      toast({
        title: "Update Error",
        description: err.response?.data?.message || err.message || "Failed to mark bill as paid",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
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
      case "paid":
        return { color: "white", bg: "green.500" };
      case "pending":
        return { color: "white", bg: "orange.500" };
      case "overdue":
        return { color: "white", bg: "red.500" };
      default:
        return { color: "white", bg: "#9d4edd" };
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

  // Calculate statistics
  const totalRevenue = billingData
    .filter(bill => bill.status === "paid")
    .reduce((sum, bill) => sum + bill.amount, 0);

  const pendingAmount = billingData
    .filter(bill => bill.status === "pending")
    .reduce((sum, bill) => sum + bill.amount, 0);

  const overdueAmount = billingData
    .filter(bill => bill.status === "overdue")
    .reduce((sum, bill) => sum + bill.amount, 0);

  if (!currentUser) {
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" color={customColor} />
      </Flex>
    );
  }

  // Render List View with Fixed Layout
  return (
    <Flex 
      flexDirection="column" 
      pt={{ base: "5px", md: "45px" }} 
      height="100vh" 
      overflow="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
          borderRadius: '24px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'transparent',
          borderRadius: '24px',
          transition: 'background 0.3s ease',
        },
        '&:hover::-webkit-scrollbar-thumb': {
          background: '#cbd5e1',
        },
        '&:hover::-webkit-scrollbar-thumb:hover': {
          background: '#94a3b8',
        },
        scrollbarWidth: 'thin',
        scrollbarColor: 'transparent transparent',
        '&:hover': {
          scrollbarColor: '#cbd5e1 transparent',
        },
      }}
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
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'transparent',
              borderRadius: '3px',
              transition: 'background 0.3s ease',
            },
            '&:hover::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
            },
            '&:hover::-webkit-scrollbar-thumb:hover': {
              background: '#94a3b8',
            },
          }}
        >
          {/* Total Revenue Card */}
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
                    Total Revenue
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>
                      ₹{totalRevenue.toLocaleString()}
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox
                  as="box"
                  h={{ base: "35px", md: "45px" }}
                  w={{ base: "35px", md: "45px" }}
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                >
                  <Icon
                    as={FaMoneyCheckAlt}
                    h={{ base: "18px", md: "24px" }}
                    w={{ base: "18px", md: "24px" }}
                    color="white"
                  />
                </IconBox>
              </Flex>
            </CardBody>
          </Card>

          {/* Pending Payments Card */}
          <Card
            minH="83px"
            cursor="pointer"
            onClick={() => handleCardClick("pending")}
            border={activeFilter === "pending" ? "2px solid" : "1px solid"}
            borderColor={activeFilter === "pending" ? customColor : `${customColor}30`}
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
                    Pending Payments
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>
                      ₹{pendingAmount.toLocaleString()}
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox 
                  as="box" 
                  h={{ base: "35px", md: "45px" }} 
                  w={{ base: "35px", md: "45px" }} 
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                >
                  <Icon
                    as={MdPayments}
                    h={{ base: "18px", md: "24px" }}
                    w={{ base: "18px", md: "24px" }}
                    color="white"
                  />
                </IconBox>
              </Flex>
            </CardBody>
          </Card>

          {/* Overdue Payments Card */}
          <Card
            minH="83px"
            cursor="pointer"
            onClick={() => handleCardClick("overdue")}
            border={activeFilter === "overdue" ? "2px solid" : "1px solid"}
            borderColor={activeFilter === "overdue" ? customColor : `${customColor}30`}
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
                    Overdue Payments
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>
                      ₹{overdueAmount.toLocaleString()}
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox 
                  as="box" 
                  h={{ base: "35px", md: "45px" }} 
                  w={{ base: "35px", md: "45px" }} 
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                >
                  <Icon
                    as={FaFileInvoiceDollar}
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
            {activeFilter === "paid" && "Paid Bills"}
            {activeFilter === "pending" && "Pending Payments"}
            {activeFilter === "overdue" && "Overdue Payments"}
            {activeFilter === "all" && "All Bills"}
          </Text>
          {activeFilter !== "all" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCardClick("all")}
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

      {/* Table Container */}
      <Box 
        mt={-8}
        flex="1" 
        display="flex" 
        flexDirection="column" 
        p={2}
        pt={0}
        overflow="hidden"
      >
        {/* Table Card with transparent background */}
        <Card 
          shadow="xl" 
          bg="transparent"
          display="flex" 
          flexDirection="column"
          height="100%"
          minH="0"
          border="none"
        >
          {/* Table Header */}
          <CardHeader 
            p="5px" 
            pb="5px"
            bg="transparent"
            flexShrink={0}
            borderBottom="1px solid"
            borderColor={`${customColor}20`}
          >
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              {/* Title */}
              <Heading size="md" flexShrink={0} color="gray.700">
                💰 Billing & Invoices
              </Heading>

              {/* Search Bar */}
              <Flex align="center" flex="1" maxW="400px">
                <Input
                  placeholder="Search by customer, invoice number, or amount..."
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
            </Flex>
          </CardHeader>
          
          {/* Table Content Area - Scrollable Body with Fixed Header */}
          <CardBody 
            bg="transparent"
            flex="1" 
            display="flex" 
            flexDirection="column" 
            p={0} 
            overflow="hidden"
          >
            {tableLoading ? (
              <Flex justify="center" align="center" py={10} flex="1">
                <Spinner size="xl" color={customColor} />
                <Text ml={4}>Loading billing data...</Text>
              </Flex>
            ) : (
              <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
                {currentItems.length > 0 ? (
                  <>
                    {/* Fixed Table Container */}
                    <Box 
                      flex="1"
                      display="flex"
                      flexDirection="column"
                      height="400px"
                      overflow="hidden"
                    >
                      {/* Scrollable Table Area */}
                      <Box
                        flex="1"
                        overflowY="hidden"
                        overflowX="hidden"
                        _hover={{
                          overflowY: "auto",
                          overflowX: "auto",
                        }}
                        css={{
                          '&::-webkit-scrollbar': {
                            width: '8px',
                            height: '8px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'transparent',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: 'transparent',
                            borderRadius: '4px',
                            transition: 'background 0.3s ease',
                          },
                          '&:hover::-webkit-scrollbar-thumb': {
                            background: '#cbd5e1',
                          },
                          '&:hover::-webkit-scrollbar-thumb:hover': {
                            background: '#94a3b8',
                          },
                        }}
                      >
                        <Table variant="simple" size="md" bg="transparent">
                          {/* Fixed Header */}
                          <Thead>
                            <Tr>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Invoice Details
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Customer
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Amount
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Due Date
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
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
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
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
                          <Tbody bg="transparent">
                            {displayItems.map((bill, index) => {
                              // Handle empty rows
                              if (bill.isEmpty) {
                                return (
                                  <Tr 
                                    key={bill._id}
                                    bg="transparent"
                                    height="60px"
                                  >
                                    <Td borderColor={`${customColor}20`} colSpan={6}>
                                      <Box height="60px" />
                                    </Td>
                                  </Tr>
                                );
                              }

                              const statusColors = getStatusColor(bill.status);
                              const isOverdue = bill.status === "overdue" && new Date(bill.dueDate) < new Date();
                              
                              return (
                                <Tr 
                                  key={bill._id || index}
                                  bg="transparent"
                                  _hover={{ bg: `${customColor}10` }}
                                  borderBottom="1px"
                                  borderColor={`${customColor}20`}
                                  height="60px"
                                >
                                  <Td borderColor={`${customColor}20`}>
                                    <Flex align="center">
                                      <Avatar
                                        size="sm"
                                        name={bill.invoiceNumber}
                                        bg={customColor}
                                        color="white"
                                        mr={3}
                                      />
                                      <Box>
                                        <Text fontWeight="medium">{bill.invoiceNumber}</Text>
                                        <Text fontSize="sm" color="gray.600">
                                          {new Date(bill.createdAt).toLocaleDateString()}
                                        </Text>
                                      </Box>
                                    </Flex>
                                  </Td>
                                  <Td borderColor={`${customColor}20`}>
                                    <Box>
                                      <Text fontWeight="medium">{bill.customerName}</Text>
                                      <Text fontSize="sm" color="gray.600">
                                        {bill.customerEmail}
                                      </Text>
                                    </Box>
                                  </Td>
                                  <Td borderColor={`${customColor}20`}>
                                    <Text fontWeight="bold" fontSize="md">
                                      ₹{bill.amount.toLocaleString()}
                                    </Text>
                                  </Td>
                                  <Td borderColor={`${customColor}20`}>
                                    <Text color={isOverdue ? "red.500" : "gray.700"}>
                                      {new Date(bill.dueDate).toLocaleDateString()}
                                    </Text>
                                  </Td>
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
                                      {bill.status.toUpperCase()}
                                    </Badge>
                                  </Td>
                                  <Td borderColor={`${customColor}20`}>
                                    <Flex gap={2}>
                                      <IconButton
                                        aria-label="View bill"
                                        icon={<FaEye />}
                                        bg="white"
                                        color="green.500"
                                        border="1px"
                                        borderColor="green.500"
                                        _hover={{ bg: "green.500", color: "white" }}
                                        size="sm"
                                        onClick={() => handleViewBill(bill)}
                                      />
                                      {bill.status !== "paid" && (
                                        <IconButton
                                          aria-label="Mark as paid"
                                          icon={<FaCheckCircle />}
                                          bg="white"
                                          color={customColor}
                                          border="1px"
                                          borderColor={customColor}
                                          _hover={{ bg: customColor, color: "white" }}
                                          size="sm"
                                          onClick={() => handleMarkAsPaid(bill._id)}
                                        />
                                      )}
                                    </Flex>
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      </Box>
                    </Box>

                    {/* Pagination Bar */}
                    {currentItems.length > 0 && (
                      <Box 
                        flexShrink={0}
                        p="16px"
                        borderTop="1px solid"
                        borderColor={`${customColor}20`}
                        bg="transparent"
                      >
                        <Flex
                          justify="flex-end"
                          align="center"
                          gap={3}
                        >
                          {/* Page Info */}
                          <Text fontSize="sm" color="gray.600" display={{ base: "none", sm: "block" }}>
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} bills
                          </Text>

                          {/* Pagination Controls */}
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
                              _disabled={{ 
                                opacity: 0.5, 
                                cursor: "not-allowed",
                                bg: "gray.100",
                                color: "gray.400",
                                borderColor: "gray.300"
                              }}
                            >
                              <Text display={{ base: "none", sm: "block" }}>Previous</Text>
                            </Button>

                            {/* Page Number Display */}
                            <Flex 
                              align="center" 
                              gap={2}
                              bg={`${customColor}10`}
                              px={3}
                              py={1}
                              borderRadius="6px"
                              minW="80px"
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
                            >
                              <Text display={{ base: "none", sm: "block" }}>Next</Text>
                            </Button>
                          </Flex>
                        </Flex>
                      </Box>
                    )}
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
                    bg="transparent"
                  >
                    <Text textAlign="center" color="gray.500" fontSize="lg">
                      {dataLoaded
                        ? billingData.length === 0
                          ? "No billing data found."
                          : searchTerm
                          ? "No bills match your search."
                          : "No bills match the selected filter."
                        : "Loading billing data..."}
                    </Text>
                  </Flex>
                )}
              </Box>
            )}
          </CardBody>
        </Card>
      </Box>

      {/* View Bill Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg={customColor} color="white">
            <Flex align="center">
              <Icon as={MdReceipt} mr={2} />
              Invoice Details
            </Flex>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {selectedBill && (
              <VStack spacing={6} align="stretch">
                {/* Header */}
                <Flex justify="space-between" align="start">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold">{selectedBill.invoiceNumber}</Text>
                    <Text color="gray.600">Created: {new Date(selectedBill.createdAt).toLocaleDateString()}</Text>
                  </VStack>
                  <Badge
                    bg={getStatusColor(selectedBill.status).bg}
                    color={getStatusColor(selectedBill.status).color}
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="md"
                    fontWeight="bold"
                  >
                    {selectedBill.status.toUpperCase()}
                  </Badge>
                </Flex>

                <Divider />

                {/* Customer Info */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={3}>Customer Information</Text>
                  <VStack align="start" spacing={2}>
                    <Text><strong>Name:</strong> {selectedBill.customerName}</Text>
                    <Text><strong>Email:</strong> {selectedBill.customerEmail}</Text>
                  </VStack>
                </Box>

                {/* Items */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={3}>Items</Text>
                  <VStack spacing={3} align="stretch">
                    {selectedBill.items.map((item, index) => (
                      <Flex key={index} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">{item.name}</Text>
                          <Text fontSize="sm" color="gray.600">
                            ₹{item.price} × {item.quantity}
                          </Text>
                        </VStack>
                        <Text fontWeight="bold">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>

                {/* Summary */}
                <Box bg={`${customColor}05`} p={4} borderRadius="lg">
                  <VStack spacing={2} align="stretch">
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Subtotal</Text>
                      <Text>₹{selectedBill.amount.toLocaleString()}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Tax</Text>
                      <Text>₹0</Text>
                    </Flex>
                    <Divider />
                    <Flex justify="space-between">
                      <Text fontSize="xl" fontWeight="bold">Total</Text>
                      <Text fontSize="xl" fontWeight="bold" color={customColor}>
                        ₹{selectedBill.amount.toLocaleString()}
                      </Text>
                    </Flex>
                  </VStack>
                </Box>

                {/* Due Date */}
                <Box>
                  <Text><strong>Due Date:</strong> {new Date(selectedBill.dueDate).toLocaleDateString()}</Text>
                  {selectedBill.status === "overdue" && (
                    <Text color="red.500" fontWeight="medium">
                      ⚠️ This bill is overdue
                    </Text>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="outline" 
              mr={3} 
              onClick={() => setViewModalOpen(false)}
            >
              Close
            </Button>
            {selectedBill?.status !== "paid" && (
              <Button
                bg={customColor}
                _hover={{ bg: customHoverColor }}
                color="white"
                onClick={() => {
                  handleMarkAsPaid(selectedBill._id);
                  setViewModalOpen(false);
                }}
              >
                Mark as Paid
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
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

export default BillingManagement;