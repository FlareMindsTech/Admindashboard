// ProductManagement
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
  Textarea,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
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
  FaEdit,
  FaPlus,
  FaEye,
  FaTrash,
  FaBox,
  FaTags,
  FaShoppingCart,
} from "react-icons/fa";
import { MdCategory, MdInventory } from "react-icons/md";
import {
  getAllCategories,
  getAllProducts,
  createProducts,
  updateProducts,
  deleteProducts,
  createCategories,
  updateCategories,
} from "views/utils/axiosInstance";

// Main Product Management Component
function ProductManagement() {
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

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
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
  const [selectedItem, setSelectedItem] = useState(null);

  // View state - 'list', 'add', 'edit'
  const [currentView, setCurrentView] = useState("list");
  const [editingItem, setEditingItem] = useState(null);
  const [itemType, setItemType] = useState("product"); // 'product' or 'category'

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    color: "",
    size: "",
    images: [],
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

  // Helper function to safely extract and sort data
  const extractAndSortData = (responseData, dataKey) => {
    if (!responseData) return [];
    
    // Handle different response structures
    let dataArray = [];
    
    if (Array.isArray(responseData)) {
      dataArray = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      dataArray = responseData.data;
    } else if (responseData.categories && Array.isArray(responseData.categories)) {
      dataArray = responseData.categories;
    } else if (responseData.products && Array.isArray(responseData.products)) {
      dataArray = responseData.products;
    } else if (typeof responseData === 'object') {
      // If it's a single object, wrap it in an array
      dataArray = [responseData];
    }
    
    // Sort data in alphabetical order
    return dataArray.sort((a, b) => 
      (a.name || '').toString().toLowerCase().localeCompare((b.name || '').toString().toLowerCase())
    );
  };

  const handleAddItem = (type) => {
    setItemType(type);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      color: "",
      size: "",
      images: [],
    });
    setEditingItem(null);
    setCurrentView("add");
    setError("");
    setSuccess("");
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

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      setLoading(true);
      setTableLoading(true);
      setDataLoaded(false);
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          getAllCategories(),
          getAllProducts()
        ]);

        console.log("Categories Response:", categoriesResponse);
        console.log("Products Response:", productsResponse);

        // Use helper function to safely extract and sort data
        const categoriesData = extractAndSortData(categoriesResponse, 'categories');
        const productsData = extractAndSortData(productsResponse, 'products');

        console.log("Extracted Categories:", categoriesData);
        console.log("Extracted Products:", productsData);

        setCategories(categoriesData);
        setProducts(productsData);
        setFilteredData(productsData); // Default to products view
        setDataLoaded(true);
      } catch (err) {
        console.error("Error fetching data:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to load data.";
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
      fetchData();
    }
  }, [currentUser, toast]);

  // Apply filters and search
  useEffect(() => {
    if (!dataLoaded) return;

    setTableLoading(true);
    setCurrentPage(1);

    const timer = setTimeout(() => {
      let dataToFilter = activeFilter === "categories" ? categories : products;
      
      // Ensure dataToFilter is an array
      if (!Array.isArray(dataToFilter)) {
        dataToFilter = [];
      }

      let filtered = dataToFilter;

      // Apply search filter
      if (searchTerm.trim() !== "") {
        filtered = dataToFilter.filter(
          (item) =>
            item.name?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.price && item.price.toString().includes(searchTerm)) ||
            (item.category?.name && item.category.name.toString().toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Maintain alphabetical order after filtering
      const sortedFilteredData = filtered.sort((a, b) => 
        (a.name || '').toString().toLowerCase().localeCompare((b.name || '').toString().toLowerCase())
      );

      setFilteredData(sortedFilteredData);
      setTableLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeFilter, categories, products, dataLoaded, searchTerm]);

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

  // Handle edit item
  const handleEditItem = (item) => {
    const isCategory = activeFilter === "categories";
    setItemType(isCategory ? "category" : "product");
    
    if (isCategory) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        price: "",
        stock: "",
        category: "",
        color: "",
        size: "",
        images: [],
      });
    } else {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        price: item.price || item.variants?.[0]?.price || "",
        stock: item.stock || item.variants?.[0]?.stock || "",
        category: item.category?._id || item.category || "",
        color: item.variants?.[0]?.color || "",
        size: item.variants?.[0]?.size || "",
        images: item.images || [],
      });
    }
    
    setEditingItem(item);
    setCurrentView("edit");
    setError("");
    setSuccess("");
  };

  // Handle view item
  const handleViewItem = (item) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView("list");
    setEditingItem(null);
    setError("");
    setSuccess("");
  };

  // Refresh data function
  const refreshData = async () => {
    try {
      const [categoriesResponse, productsResponse] = await Promise.all([
        getAllCategories(),
        getAllProducts()
      ]);

      const categoriesData = extractAndSortData(categoriesResponse, 'categories');
      const productsData = extractAndSortData(productsResponse, 'products');

      setCategories(categoriesData);
      setProducts(productsData);
      setFilteredData(activeFilter === "categories" ? categoriesData : productsData);
    } catch (err) {
      console.error("Error refreshing data:", err);
      toast({
        title: "Refresh Error",
        description: "Failed to refresh data",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle form submit for both add and edit
  const handleSubmit = async () => {
    if (!formData.name) {
      return toast({
        title: "Validation Error",
        description: "Name is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let response;
      let successMessage;

      if (itemType === "category") {
        const categoryData = {
          name: formData.name,
          description: formData.description
        };

        if (currentView === "edit" && editingItem) {
          response = await updateCategories(editingItem._id, categoryData);
          successMessage = `Category ${response.data?.name || formData.name} updated successfully`;
        } else {
          response = await createCategories(categoryData);
          successMessage = `Category ${response.data?.name || formData.name} created successfully`;
        }
      } else {
        // Validate product data
        if (!formData.price || !formData.stock) {
          throw new Error("Price and stock are required for products");
        }

        const productData = {
          name: formData.name,
          description: formData.description,
          price: Number(formData.price),
          stock: Number(formData.stock),
          category: formData.category,
          variants: [
            {
              color: formData.color || "default",
              size: formData.size || "default",
              price: Number(formData.price),
              stock: Number(formData.stock),
              sku: editingItem?.variants?.[0]?.sku || `SKU-${Date.now()}`
            }
          ]
        };

        if (currentView === "edit" && editingItem) {
          response = await updateProducts(editingItem._id, productData);
          successMessage = `Product ${response.data?.name || formData.name} updated successfully`;
        } else {
          response = await createProducts(productData);
          successMessage = `Product ${response.data?.name || formData.name} created successfully`;
        }
      }

      toast({
        title: currentView === "edit" ? "Item Updated" : "Item Created",
        description: successMessage,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh data
      await refreshData();

      setSuccess(successMessage);
      setFormData({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "",
        color: "",
        size: "",
        images: [],
      });
      setEditingItem(null);
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

  // Handle delete item
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      return;
    }

    try {
      setLoading(true);
      if (activeFilter === "categories") {
        // Note: You might want to check if category has products before deleting
        await deleteProducts(item._id); // Using deleteProducts as placeholder - you might need a deleteCategories endpoint
      } else {
        await deleteProducts(item._id);
      }

      toast({
        title: "Item Deleted",
        description: `${item.name} deleted successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh data
      await refreshData();
    } catch (err) {
      console.error("Delete Error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete item.";
      toast({
        title: "Delete Error",
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
      case "out of stock":
        return { color: "white", bg: "red.500" };
      case "in stock":
        return { color: "white", bg: "green.500" };
      default:
        return { color: "white", bg: "#9d4edd" };
    }
  };

  // Card click handlers
  const handleCardClick = (filterType) => {
    setActiveFilter(filterType);
    const dataToShow = filterType === "categories" ? categories : products;
    setFilteredData(Array.isArray(dataToShow) ? dataToShow : []);
    setCurrentPage(1);
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
      <Flex 
        flexDirection="column" 
        pt={{ base: "120px", md: "75px" }} 
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
                {currentView === "add" 
                  ? `Add New ${itemType === 'category' ? 'Category' : 'Product'}`
                  : `Edit ${itemType === 'category' ? 'Category' : 'Product'}`
                }
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
                <FormLabel htmlFor="name" color="gray.700">
                  {itemType === 'category' ? 'Category Name' : 'Product Name'}
                </FormLabel>
                <Input
                  id="name"
                  name="name"
                  placeholder={itemType === 'category' ? 'Category Name' : 'Product Name'}
                  onChange={handleInputChange}
                  value={formData.name}
                  borderColor={`${customColor}50`}
                  _hover={{ borderColor: customColor }}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  bg="white"
                />
              </FormControl>
              
              {itemType === 'product' && (
                <FormControl isRequired>
                  <FormLabel htmlFor="price" color="gray.700">Price</FormLabel>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="Price"
                    onChange={handleInputChange}
                    value={formData.price}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                  />
                </FormControl>
              )}
            </SimpleGrid>

            {itemType === 'product' && (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <FormControl isRequired>
                  <FormLabel htmlFor="stock" color="gray.700">Stock</FormLabel>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    placeholder="Stock Quantity"
                    onChange={handleInputChange}
                    value={formData.stock}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel htmlFor="category" color="gray.700">Category</FormLabel>
                  <Select
                    id="category"
                    name="category"
                    onChange={handleInputChange}
                    value={formData.category}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>
            )}

            {itemType === 'product' && (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <FormControl>
                  <FormLabel htmlFor="color" color="gray.700">Color</FormLabel>
                  <Input
                    id="color"
                    name="color"
                    placeholder="Color"
                    onChange={handleInputChange}
                    value={formData.color}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel htmlFor="size" color="gray.700">Size</FormLabel>
                  <Input
                    id="size"
                    name="size"
                    placeholder="Size"
                    onChange={handleInputChange}
                    value={formData.size}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                  />
                </FormControl>
              </SimpleGrid>
            )}

            <FormControl mb="24px">
              <FormLabel htmlFor="description" color="gray.700">Description</FormLabel>
              <Textarea
                id="description"
                name="description"
                placeholder={`Enter ${itemType} description`}
                onChange={handleInputChange}
                value={formData.description}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                bg="white"
                rows={3}
              />
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
                {currentView === "add" 
                  ? `Create ${itemType === 'category' ? 'Category' : 'Product'}`
                  : `Update ${itemType === 'category' ? 'Category' : 'Product'}`
                }
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
          {/* All Products Card */}
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
                    All Products
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>
                      {Array.isArray(products) ? products.length : 0}
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
                    as={FaBox}
                    h={{ base: "18px", md: "24px" }}
                    w={{ base: "18px", md: "24px" }}
                    color="white"
                  />
                </IconBox>
              </Flex>
            </CardBody>
          </Card>

          {/* Categories Card */}
          <Card
            minH="83px"
            cursor="pointer"
            onClick={() => handleCardClick("categories")}
            border={activeFilter === "categories" ? "2px solid" : "1px solid"}
            borderColor={activeFilter === "categories" ? customColor : `${customColor}30`}
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
                    Categories
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>
                      {Array.isArray(categories) ? categories.length : 0}
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
                    as={MdCategory}
                    h={{ base: "18px", md: "24px" }}
                    w={{ base: "18px", md: "24px" }}
                    color="white"
                  />
                </IconBox>
              </Flex>
            </CardBody>
          </Card>

          {/* In Stock Products Card */}
          <Card
            minH="83px"
            cursor="pointer"
            onClick={() => handleCardClick("inStock")}
            border={activeFilter === "inStock" ? "2px solid" : "1px solid"}
            borderColor={activeFilter === "inStock" ? customColor : `${customColor}30`}
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
                    In Stock
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>
                      {Array.isArray(products) ? products.filter(p => 
                        (p.stock > 0 || p.variants?.[0]?.stock > 0)
                      ).length : 0}
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
                    as={FaShoppingCart}
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
            {activeFilter === "categories" && "Categories"}
            {activeFilter === "inStock" && "In Stock Products"}
            {activeFilter === "all" && "All Products"}
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
              Show All Products
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
                {activeFilter === "categories" ? "🏷️ Categories" : "🛒 Products"}
              </Heading>

              {/* Search Bar */}
              <Flex align="center" flex="1" maxW="400px">
                <Input
                  placeholder={`Search ${activeFilter === 'categories' ? 'categories' : 'products'}...`}
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

              {/* Add Buttons */}
              <Flex gap={2}>
                <Button
                  bg={customColor}
                  _hover={{ bg: customHoverColor }}
                  color="white"
                  onClick={() => handleAddItem("category")}
                  fontSize="sm"
                  borderRadius="8px"
                  flexShrink={0}
                  leftIcon={<FaPlus />}
                >
                  Add Category
                </Button>
                <Button
                  bg={customColor}
                  _hover={{ bg: customHoverColor }}
                  color="white"
                  onClick={() => handleAddItem("product")}
                  fontSize="sm"
                  borderRadius="8px"
                  flexShrink={0}
                  leftIcon={<FaPlus />}
                >
                  Add Product
                </Button>
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
                <Text ml={4}>Loading {activeFilter === 'categories' ? 'categories' : 'products'}...</Text>
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
                                {activeFilter === "categories" ? "Category" : "Product"}
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
                                Description
                              </Th>
                              {activeFilter !== "categories" && (
                                <>
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
                                    Price
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
                                    Stock
                                  </Th>
                                </>
                              )}
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
                            {displayItems.map((item, index) => {
                              // Handle empty rows
                              if (item.isEmpty) {
                                return (
                                  <Tr 
                                    key={item._id}
                                    bg="transparent"
                                    height="60px"
                                  >
                                    <Td borderColor={`${customColor}20`} colSpan={activeFilter === "categories" ? 4 : 6}>
                                      <Box height="60px" />
                                    </Td>
                                  </Tr>
                                );
                              }

                              const statusColors = getStatusColor(
                                activeFilter === "categories" 
                                  ? "Active" 
                                  : (item.stock > 0 || item.variants?.[0]?.stock > 0) ? "In Stock" : "Out of Stock"
                              );
                              
                              return (
                                <Tr 
                                  key={item._id || index}
                                  bg="transparent"
                                  _hover={{ bg: `${customColor}10` }}
                                  borderBottom="1px"
                                  borderColor={`${customColor}20`}
                                  height="60px"
                                >
                                  <Td borderColor={`${customColor}20`}>
                                    <Flex align="center">
                                      {activeFilter !== "categories" && item.images && item.images.length > 0 ? (
                                        <Image
                                          src={item.images[0].url || item.images[0]}
                                          alt={item.name}
                                          boxSize="40px"
                                          objectFit="cover"
                                          borderRadius="md"
                                          mr={3}
                                        />
                                      ) : (
                                        <Avatar
                                          size="sm"
                                          name={item.name}
                                          bg={customColor}
                                          color="white"
                                          mr={3}
                                        />
                                      )}
                                      <Box>
                                        <Text fontWeight="medium">{item.name}</Text>
                                        {activeFilter !== "categories" && (
                                          <Text fontSize="sm" color="gray.600">
                                            {item.category?.name || "No category"}
                                          </Text>
                                        )}
                                      </Box>
                                    </Flex>
                                  </Td>
                                  <Td borderColor={`${customColor}20`}>
                                    <Text noOfLines={2} maxW="200px">
                                      {item.description || "No description"}
                                    </Text>
                                  </Td>
                                  {activeFilter !== "categories" && (
                                    <>
                                      <Td borderColor={`${customColor}20`}>
                                        <Text fontWeight="bold">
                                          ₹{item.price || item.variants?.[0]?.price || "0"}
                                        </Text>
                                      </Td>
                                      <Td borderColor={`${customColor}20`}>
                                        <Text>
                                          {item.stock || item.variants?.[0]?.stock || "0"}
                                        </Text>
                                      </Td>
                                    </>
                                  )}
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
                                      {activeFilter === "categories" ? "Active" : 
                                       (item.stock > 0 || item.variants?.[0]?.stock > 0) ? "In Stock" : "Out of Stock"}
                                    </Badge>
                                  </Td>
                                  <Td borderColor={`${customColor}20`}>
                                    <Flex gap={2}>
                                      <IconButton
                                        aria-label="View item"
                                        icon={<FaEye />}
                                        bg="white"
                                        color="green.500"
                                        border="1px"
                                        borderColor="green.500"
                                        _hover={{ bg: "green.500", color: "white" }}
                                        size="sm"
                                        onClick={() => handleViewItem(item)}
                                      />
                                      <IconButton
                                        aria-label="Edit item"
                                        icon={<FaEdit />}
                                        bg="white"
                                        color={customColor}
                                        border="1px"
                                        borderColor={customColor}
                                        _hover={{ bg: customColor, color: "white" }}
                                        size="sm"
                                        onClick={() => handleEditItem(item)}
                                      />
                                      <IconButton
                                        aria-label="Delete item"
                                        icon={<FaTrash />}
                                        bg="white"
                                        color="red.500"
                                        border="1px"
                                        borderColor="red.500"
                                        _hover={{ bg: "red.500", color: "white" }}
                                        size="sm"
                                        onClick={() => handleDeleteItem(item)}
                                      />
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
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} {activeFilter === 'categories' ? 'categories' : 'products'}
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
                        ? (activeFilter === "categories" ? categories : products).length === 0
                          ? `No ${activeFilter === 'categories' ? 'categories' : 'products'} found.`
                          : searchTerm
                          ? `No ${activeFilter === 'categories' ? 'categories' : 'products'} match your search.`
                          : `No ${activeFilter === 'categories' ? 'categories' : 'products'} match the selected filter.`
                        : `Loading ${activeFilter === 'categories' ? 'categories' : 'products'}...`}
                    </Text>
                  </Flex>
                )}
              </Box>
            )}
          </CardBody>
        </Card>
      </Box>

      {/* View Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg={customColor} color="white">
            {activeFilter === "categories" ? "Category Details" : "Product Details"}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {selectedItem && (
              <SimpleGrid columns={1} spacing={4}>
                <Flex align="center">
                  {activeFilter !== "categories" && selectedItem.images && selectedItem.images.length > 0 ? (
                    <Image
                      src={selectedItem.images[0].url || selectedItem.images[0]}
                      alt={selectedItem.name}
                      boxSize="80px"
                      objectFit="cover"
                      borderRadius="md"
                      mr={4}
                    />
                  ) : (
                    <Avatar
                      size="lg"
                      name={selectedItem.name}
                      bg={customColor}
                      color="white"
                      mr={4}
                    />
                  )}
                  <Box>
                    <Heading size="md" mb={2}>{selectedItem.name}</Heading>
                    <Badge
                      bg={getStatusColor(
                        activeFilter === "categories" 
                          ? "Active" 
                          : (selectedItem.stock > 0 || selectedItem.variants?.[0]?.stock > 0) ? "In Stock" : "Out of Stock"
                      ).bg}
                      color="white"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {activeFilter === "categories" ? "Active" : 
                       (selectedItem.stock > 0 || selectedItem.variants?.[0]?.stock > 0) ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </Box>
                </Flex>

                {selectedItem.description && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Description:</Text>
                    <Text>{selectedItem.description}</Text>
                  </Box>
                )}

                {activeFilter !== "categories" && (
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontWeight="bold">Price:</Text>
                      <Text>₹{selectedItem.price || selectedItem.variants?.[0]?.price || "0"}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Stock:</Text>
                      <Text>{selectedItem.stock || selectedItem.variants?.[0]?.stock || "0"}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Category:</Text>
                      <Text>{selectedItem.category?.name || "No category"}</Text>
                    </Box>
                    {selectedItem.variants?.[0]?.color && (
                      <Box>
                        <Text fontWeight="bold">Color:</Text>
                        <Text>{selectedItem.variants[0].color}</Text>
                      </Box>
                    )}
                    {selectedItem.variants?.[0]?.size && (
                      <Box>
                        <Text fontWeight="bold">Size:</Text>
                        <Text>{selectedItem.variants[0].size}</Text>
                      </Box>
                    )}
                  </SimpleGrid>
                )}
              </SimpleGrid>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              bg={customColor}
              _hover={{ bg: customHoverColor }}
              color="white"
              onClick={() => setViewModalOpen(false)}
            >
              Close
            </Button>
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

export default ProductManagement;