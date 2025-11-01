// Chakra imports
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllCategories,
  createCategories,
  getAllProducts,
  createProducts,
  updateCategories,
  updateProducts,
  deleteProducts,
} from "../utils/axiosInstance";

import {
  Flex,
  Grid,
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
  Badge,
  Heading,
  Text,
  useToast,
  Icon,
  Button,
  IconButton,
  Box,
  Input,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select,
  Image,
  Textarea,
  Spinner,
  Center,
} from "@chakra-ui/react";

// Import your custom Card components
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";

import {
  FaUsers,
  FaArrowLeft,
  FaEye,
  FaEdit,
  FaPlusCircle,
  FaTrash,
  FaSearch,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdCategory } from "react-icons/md";

export default function ProductManagement() {
  const textColor = useColorModeValue("gray.700", "white");
  const toast = useToast();
  const navigate = useNavigate();

  // Custom color theme
  const customColor = "#7b2cbf";
  const customHoverColor = "#5a189a";

  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentView, setCurrentView] = useState("categories"); // Changed default to "categories"
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Loading states
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filters
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // Increased items per page for better density

  const initialCategory = { name: "", description: "" };
  const initialProduct = {
    name: "",
    price: "",
    stock: "",
    color: "",
    size: "",
    description: "",
    imgFiles: [],
  };

  const [newCategory, setNewCategory] = useState(initialCategory);
  const [newProduct, setNewProduct] = useState(initialProduct);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // Filtered data
  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredProducts = products.filter(
    (prod) =>
      prod.name?.toLowerCase().includes(productSearch.toLowerCase()) &&
      (productCategoryFilter ? 
        (prod.category?._id === productCategoryFilter || prod.category === productCategoryFilter) 
        : true)
  );

  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  
  const totalCategoryPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentView === "categories" && currentPage < totalCategoryPages) {
      setCurrentPage(currentPage + 1);
    } else if (currentView === "products" && currentPage < totalProductPages) {
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

  // Fetch current user
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || (storedUser.role !== "admin" && storedUser.role !== "super admin")) {
      toast({
        title: "Access Denied",
        description: "Only admin or super admin can access this page.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      navigate("/auth/signin");
      return;
    }
    setCurrentUser(storedUser);
  }, [navigate, toast]);

  // Fetch categories + products
  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setIsLoadingCategories(true);
      setIsLoadingProducts(true);

      const [categoryData, productData] = await Promise.all([
        getAllCategories(),
        getAllProducts()
      ]);

      setCategories(categoryData.categories || categoryData.data || []);
      setProducts(productData.products || productData.data || []);
      
    } catch (err) {
      toast({
        title: "Fetch Error",
        description: err.message || "Failed to load dashboard data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingData(false);
      setIsLoadingCategories(false);
      setIsLoadingProducts(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  // Reset pagination when view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentView]);

  if (!currentUser) return null;

  const handleBack = () => {
    setCurrentView("categories"); // Changed to go back to categories view
    setSelectedCategory(null);
    setSelectedProduct(null);
    setNewCategory(initialCategory);
    setNewProduct(initialProduct);
  };

  // Reset form
  const handleResetCategory = () => setNewCategory(initialCategory);
  const handleResetProduct = () => setNewProduct(initialProduct);

  // Category Submit
  const handleSubmitCategory = async () => {
    if (!newCategory.name.trim()) {
      return toast({
        title: "Validation Error",
        description: "Category name is required.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    try {
      setIsSubmitting(true);
      const data = await createCategories(newCategory);
      toast({
        title: "Category Created",
        description: `"${data.category?.name || data.data?.name}" added successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchData();
      handleBack();
    } catch (err) {
      toast({
        title: "Error Creating Category",
        description: err.message || "Failed to create category",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Category
  const handleUpdateCategory = async () => {
    if (!newCategory.name.trim()) {
      return toast({
        title: "Validation Error",
        description: "Category name is required.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    try {
      setIsSubmitting(true);
      await updateCategories(selectedCategory._id, newCategory);
      toast({
        title: "Category Updated",
        description: `"${newCategory.name}" updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchData();
      handleBack();
    } catch (error) {
      toast({
        title: "Error Updating Category",
        description: error.message || "Failed to update category",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Product Submit (Add/Edit)
  const handleSubmitProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      return toast({
        title: "Validation Error",
        description: "Name, Price, and Stock are required fields.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    if (!selectedCategory?._id) {
      return toast({
        title: "Category Error",
        description: "Please select a category first.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    try {
      setIsSubmitting(true);

      // Prepare product data according to backend expectations
      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description?.trim() || "",
        category: selectedCategory._id,
        images: newProduct.imgFiles,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        color: newProduct.color || "default",
        size: newProduct.size || "default",
        variants: [
          {
            color: newProduct.color || "default",
            size: newProduct.size || "default",
            price: Number(newProduct.price),
            stock: Number(newProduct.stock),
            sku: selectedProduct
              ? selectedProduct.variants?.[0]?.sku
              : `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          },
        ],
      };

      let response;
      if (selectedProduct) {
        response = await updateProducts(selectedProduct._id, productData);
        toast({
          title: "Product Updated",
          description: `"${productData.name}" updated successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        response = await createProducts(productData);
        toast({
          title: "Product Created",
          description: `"${productData.name}" added successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      console.log("Product API Response:", response);
      await fetchData();
      handleBack();
    } catch (err) {
      console.error("Product submission error:", err);
      toast({
        title: selectedProduct ? "Error Updating Product" : "Error Creating Product",
        description: err.message || "Failed to save product",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Product handler
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setSelectedCategory(categories.find((c) => c._id === product.category?._id || c._id === product.category));
    
    const productImages = product.images || product.imgFiles || [];
    
    setNewProduct({
      name: product.name,
      price: product.price || product.variants?.[0]?.price || "",
      stock: product.stock || product.variants?.[0]?.stock || "",
      color: product.color || product.variants?.[0]?.color || "",
      size: product.size || product.variants?.[0]?.size || "",
      description: product.description || "",
      imgFiles: productImages,
    });
    setCurrentView("addProduct");
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setNewCategory({ name: category.name, description: category.description || "" });
    setCurrentView("editCategory");
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      setIsLoadingProducts(true);
      await deleteProducts(productId);
      toast({
        title: "Product Deleted",
        description: "Product deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchData();
    } catch (err) {
      toast({
        title: "Delete Error",
        description: err.message || "Failed to delete product",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleViewCategory = (cat) => {
    setSelectedCategory(cat);
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedCategory(null);
  };

  // Loading component for tables
  const TableLoader = ({ columns = 6 }) => (
    <Tr>
      <Td colSpan={columns} textAlign="center" py={4}>
        <Center>
          <Spinner size="md" color={customColor} mr={3} />
          <Text fontSize="sm">Loading data...</Text>
        </Center>
      </Td>
    </Tr>
  );

  // Custom IconBox component
  const IconBox = ({ children, ...rest }) => (
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

  // Render Form Views (Add/Edit Category/Product)
  if (currentView === "addCategory" || currentView === "editCategory" || currentView === "addProduct") {
    return (
      <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }} height="100vh" overflow="hidden">
        <Card bg="white" shadow="xl" height="100%" display="flex" flexDirection="column">
          <CardHeader bg="white" flexShrink={0}>
            <Flex align="center" mb={4}>
              <Button
                variant="ghost"
                leftIcon={<FaArrowLeft />}
                onClick={handleBack}
                mr={4}
                color={customColor}
                _hover={{ bg: `${customColor}10` }}
                size="sm"
              >
                Back
              </Button>
              <Heading size="md" color="gray.700">
                {currentView === "addCategory" && "Add New Category"}
                {currentView === "editCategory" && "Edit Category"}
                {currentView === "addProduct" && (selectedProduct ? "Edit Product" : "Add New Product")}
              </Heading>
            </Flex>
          </CardHeader>
          <CardBody bg="white" flex="1" overflow="auto">
            {/* Category Form */}
            {(currentView === "addCategory" || currentView === "editCategory") && (
              <>
                <FormControl mb="20px">
                  <FormLabel htmlFor="name" color="gray.700" fontSize="sm">Name *</FormLabel>
                  <Input
                    id="name"
                    placeholder="Enter category name"
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    value={newCategory.name}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                    size="sm"
                  />
                </FormControl>
                <FormControl mb="20px">
                  <FormLabel htmlFor="description" color="gray.700" fontSize="sm">Description</FormLabel>
                  <Textarea
                    id="description"
                    placeholder="Enter category description"
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    value={newCategory.description}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                    rows={2}
                    size="sm"
                  />
                </FormControl>
                <Flex justify="flex-end" mt={4} flexShrink={0}>
                  <Button 
                    variant="outline" 
                    mr={3} 
                    onClick={handleResetCategory}
                    border="1px"
                    borderColor="gray.300"
                    size="sm"
                  >
                    Reset
                  </Button>
                  <Button
                    bg={customColor}
                    _hover={{ bg: customHoverColor }}
                    color="white"
                    onClick={currentView === "addCategory" ? handleSubmitCategory : handleUpdateCategory}
                    isLoading={isSubmitting}
                    size="sm"
                  >
                    {currentView === "addCategory" ? "Create Category" : "Update Category"}
                  </Button>
                </Flex>
              </>
            )}

            {/* Product Form */}
            {currentView === "addProduct" && (
              <>
                {!selectedCategory && (
                  <FormControl mb="20px">
                    <FormLabel htmlFor="category" color="gray.700" fontSize="sm">Category *</FormLabel>
                    <Select
                      id="category"
                      placeholder="Select category"
                      value={selectedCategory?._id || ""}
                      onChange={(e) => {
                        const category = categories.find(c => c._id === e.target.value);
                        setSelectedCategory(category);
                      }}
                      borderColor={`${customColor}50`}
                      _hover={{ borderColor: customColor }}
                      _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                      bg="white"
                      size="sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Grid templateColumns={["1fr", "1fr 1fr"]} gap={4} mb={4}>
                  <FormControl isRequired>
                    <FormLabel color="gray.700" fontSize="sm">Product Name *</FormLabel>
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Enter product name"
                      borderColor={`${customColor}50`}
                      _hover={{ borderColor: customColor }}
                      _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                      bg="white"
                      size="sm"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color="gray.700" fontSize="sm">Price *</FormLabel>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                      borderColor={`${customColor}50`}
                      _hover={{ borderColor: customColor }}
                      _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                      bg="white"
                      size="sm"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color="gray.700" fontSize="sm">Stock *</FormLabel>
                    <Input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      placeholder="Enter stock quantity"
                      min="0"
                      borderColor={`${customColor}50`}
                      _hover={{ borderColor: customColor }}
                      _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                      bg="white"
                      size="sm"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Color</FormLabel>
                    <Input
                      value={newProduct.color}
                      onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                      placeholder="Enter color"
                      borderColor={`${customColor}50`}
                      _hover={{ borderColor: customColor }}
                      _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                      bg="white"
                      size="sm"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Size</FormLabel>
                    <Input
                      value={newProduct.size}
                      onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                      placeholder="Enter size"
                      borderColor={`${customColor}50`}
                      _hover={{ borderColor: customColor }}
                      _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                      bg="white"
                      size="sm"
                    />
                  </FormControl>
                </Grid>

                <FormControl mb="20px">
                  <FormLabel color="gray.700" fontSize="sm">Description</FormLabel>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={2}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                    size="sm"
                  />
                </FormControl>

                <FormControl mb="20px">
                  <FormLabel color="gray.700" fontSize="sm">Image URLs (comma-separated)</FormLabel>
                  <Input
                    placeholder="e.g. https://example.com/img1.jpg, https://example.com/img2.png"
                    value={newProduct.imgFiles.join(", ")}
                    onChange={(e) => {
                      const urls = e.target.value
                        .split(",")
                        .map((url) => url.trim())
                        .filter((url) => url !== "");
                      setNewProduct({ ...newProduct, imgFiles: urls });
                    }}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                    size="sm"
                  />
                </FormControl>

                <Flex justify="flex-end" mt={4} flexShrink={0}>
                  <Button 
                    variant="outline" 
                    mr={3} 
                    onClick={handleResetProduct}
                    border="1px"
                    borderColor="gray.300"
                    size="sm"
                  >
                    Reset
                  </Button>
                  <Button
                    bg={customColor}
                    _hover={{ bg: customHoverColor }}
                    color="white"
                    onClick={handleSubmitProduct}
                    isLoading={isSubmitting}
                    isDisabled={!selectedCategory}
                    size="sm"
                  >
                    {selectedProduct ? "Update Product" : "Create Product"}
                  </Button>
                </Flex>
              </>
            )}
          </CardBody>
        </Card>
      </Flex>
    );
  }

  // Main Dashboard View with Fixed Layout
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
          gap="20px"
          mb="20px"
        >
          {/* All Categories Card */}
          <Card
            minH="75px"
            cursor="pointer"
            onClick={() => setCurrentView("categories")}
            border={currentView === "categories" ? "2px solid" : "1px solid"}
            borderColor={currentView === "categories" ? customColor : `${customColor}30`}
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
              transform: "translateY(-2px)",
              shadow: "lg",
              _before: {
                opacity: 1,
              },
              borderColor: customColor,
            }}
          >
            <CardBody position="relative" zIndex={1} p={4}>
              <Flex flexDirection="row" align="center" justify="center" w="100%">
                <Stat me="auto">
                  <StatLabel
                    fontSize="xs"
                    color="gray.600"
                    fontWeight="bold"
                    pb="1px"
                  >
                    All Categories
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize="md" color={textColor}>
                      {isLoadingCategories ? <Spinner size="xs" /> : categories.length}
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox 
                  as="box" 
                  h={"35px"} 
                  w={"35px"} 
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                >
                  <Icon
                    as={MdCategory}
                    h={"18px"}
                    w={"18px"}
                    color="white"
                  />
                </IconBox>
              </Flex>
            </CardBody>
          </Card>

          {/* All Products Card */}
          <Card
            minH="75px"
            cursor="pointer"
            onClick={() => setCurrentView("products")}
            border={currentView === "products" ? "2px solid" : "1px solid"}
            borderColor={currentView === "products" ? customColor : `${customColor}30`}
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
              transform: "translateY(-2px)",
              shadow: "lg",
              _before: {
                opacity: 1,
              },
              borderColor: customColor,
            }}
          >
            <CardBody position="relative" zIndex={1} p={4}>
              <Flex flexDirection="row" align="center" justify="center" w="100%">
                <Stat me="auto">
                  <StatLabel
                    fontSize="xs"
                    color="gray.600"
                    fontWeight="bold"
                    pb="1px"
                  >
                    All Products
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize="md" color={textColor}>
                      {isLoadingProducts ? <Spinner size="xs" /> : products.length}
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox 
                  as="box" 
                  h={"35px"} 
                  w={"35px"} 
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                >
                  <Icon
                    as={IoCheckmarkDoneCircleSharp}
                    h={"18px"}
                    w={"18px"}
                    color="white"
                  />
                </IconBox>
              </Flex>
            </CardBody>
          </Card>

          {/* Total Sales Card */}
          <Card
            minH="75px"
            cursor="pointer"
            onClick={() => setCurrentView("sales")}
            border={currentView === "sales" ? "2px solid" : "1px solid"}
            borderColor={currentView === "sales" ? customColor : `${customColor}30`}
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
              transform: "translateY(-2px)",
              shadow: "lg",
              _before: {
                opacity: 1,
              },
              borderColor: customColor,
            }}
          >
            <CardBody position="relative" zIndex={1} p={4}>
              <Flex flexDirection="row" align="center" justify="center" w="100%">
                <Stat me="auto">
                  <StatLabel
                    fontSize="xs"
                    color="gray.600"
                    fontWeight="bold"
                    pb="1px"
                  >
                    Total Sales
                  </StatLabel>
                  <Flex>
                    <StatNumber fontSize="md" color={textColor}>
                      ₹ 10,000
                    </StatNumber>
                  </Flex>
                </Stat>
                <IconBox 
                  as="box" 
                  h={"35px"} 
                  w={"35px"} 
                  bg={customColor}
                  transition="all 0.2s ease-in-out"
                >
                  <Icon
                    as={FaUsers}
                    h={"18px"}
                    w={"18px"}
                    color="white"
                  />
                </IconBox>
              </Flex>
            </CardBody>
          </Card>
        </Grid>
      </Box>

      {/* Fixed Table Container */}
      <Box 
        flex="1" 
        display="flex" 
        flexDirection="column" 
        p={4}
        pt={0}
        overflow="hidden"
        bg="white"
      >
        <Card 
          shadow="lg" 
          bg="white" 
          display="flex" 
          flexDirection="column"
          height="100%"
          minH="0"
        >
          {/* Fixed Table Header */}
          <CardHeader 
            p="16px" 
            pb="12px"
            bg="white" 
            flexShrink={0}
            borderBottom="1px solid"
            borderColor={`${customColor}20`}
          >
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
              {/* Title */}
              <Heading size="sm" flexShrink={0} color="gray.700">
                {currentView === "categories" && "🏷️ Categories"}
                {currentView === "products" && "🛒 Products"}
                {currentView === "sales" && "💰 Sales"}
              </Heading>

              {/* Search Bar */}
              <Flex align="center" flex="1" maxW="350px">
                <Input
                  placeholder={
                    currentView === "categories" 
                      ? "Search categories..." 
                      : "Search products..."
                  }
                  value={currentView === "categories" ? categorySearch : productSearch}
                  onChange={(e) => currentView === "categories" 
                    ? setCategorySearch(e.target.value) 
                    : setProductSearch(e.target.value)
                  }
                  size="sm"
                  mr={2}
                  borderColor={`${customColor}50`}
                  _hover={{ borderColor: customColor }}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  bg="white"
                  fontSize="sm"
                />
                <Icon as={FaSearch} color="gray.400" boxSize={3} />
              </Flex>

              {/* Add Button */}
              <Button
                bg={customColor}
                _hover={{ bg: customHoverColor }}
                color="white"
                onClick={() => {
                  if (currentView === "categories") {
                    setCurrentView("addCategory");
                  } else {
                    setSelectedCategory(null);
                    setCurrentView("addProduct");
                  }
                }}
                fontSize="sm"
                borderRadius="6px"
                flexShrink={0}
                leftIcon={<FaPlusCircle />}
                size="sm"
                px={3}
              >
                {currentView === "categories" ? "Add Category" : "Add Product"}
              </Button>
            </Flex>
          </CardHeader>
          
          {/* Table Content Area */}
          <CardBody 
            bg="white" 
            flex="1" 
            display="flex" 
            flexDirection="column" 
            p={0} 
            overflow="hidden"
          >
            {isLoadingData ? (
              <Flex justify="center" align="center" py={6} flex="1">
                <Spinner size="lg" color={customColor} />
                <Text ml={3} fontSize="sm">Loading data...</Text>
              </Flex>
            ) : (
              <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
                {/* Categories Table */}
                {currentView === "categories" && (
                  <>
                    {/* Table Container */}
                   <Box 
  position="relative" 
  flex="1"
  overflow="hidden"
  display="flex"
  flexDirection="column"
>
  {/* Single Scrollable Table Container */}
  <Box
    flex="1"
    overflow="auto"
    css={{
      '&::-webkit-scrollbar': {
        width: '6px',
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
    <Table variant="simple" size="sm">
      {/* Fixed Header */}
      <Thead>
        <Tr bg={`${customColor}10`}>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            #
          </Th>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            Name
          </Th>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            Description
          </Th>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            Status
          </Th>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            Add Product
          </Th>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            Actions
          </Th>
        </Tr>
      </Thead>

      {/* Scrollable Body */}
      <Tbody>
        {currentCategories.length > 0 ? (
          currentCategories.map((cat, idx) => (
            <Tr 
              key={cat._id || idx}
              bg="white"
              _hover={{ bg: `${customColor}05` }}
              borderBottom="1px"
              borderColor={`${customColor}20`}
              height="45px"
            >
              <Td borderColor={`${customColor}20`} fontSize="sm" py={2} px={3}>
                {indexOfFirstItem + idx + 1}
              </Td>
              <Td borderColor={`${customColor}20`} fontWeight="medium" fontSize="sm" py={2} px={3}>
                {cat.name}
              </Td>
              <Td borderColor={`${customColor}20`} fontSize="sm" py={2} px={3}>
                <Text noOfLines={1} maxW="200px">
                  {cat.description || "-"}
                </Text>
              </Td>
              <Td borderColor={`${customColor}20`} fontSize="sm" py={2} px={3}>
                <Badge
                  bg="#9d4edd"
                  color="white"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {cat.status || "Active"}
                </Badge>
              </Td>
              <Td borderColor={`${customColor}20`} fontSize="sm" py={2} px={3}>
                <Button
                  bg="white"
                  color={customColor}
                  border="1px"
                  borderColor={customColor}
                  _hover={{ bg: customColor, color: "white" }}
                  size="xs"
                  onClick={() => { setSelectedCategory(cat); setCurrentView("addProduct"); }}
                  fontSize="xs"
                  px={2}
                >
                  + Add
                </Button>
              </Td>
              <Td borderColor={`${customColor}20`} fontSize="sm" py={2} px={3}>
                <IconButton
                                  aria-label="Edit category"
                                  icon={<FaEdit />}
                                  bg="white"
                                  color={customColor}
                                  border="1px"
                                  borderColor={customColor}
                                  _hover={{ bg: customColor, color: "white" }}
                                  size="sm"
                  onClick={() => handleEditCategory(cat)}
                 
                />
                  
              </Td>
            </Tr>
          ))
        ) : (
          <Tr>
            <Td colSpan={6} textAlign="center" py={6}>
              <Text fontSize="sm">No categories found</Text>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  </Box>
</Box>
                    {/* Fixed Pagination Controls */}
                    <Box 
                      flexShrink={0} 
                      p="16px"
                      pt="12px"
                      borderTop="1px solid"
                      borderColor={`${customColor}20`}
                      bg="white"
                    >
                      <Flex
                        justify="space-between"
                        align={{ base: "stretch", md: "center" }}
                        direction={{ base: "column", md: "row" }}
                        gap={3}
                      >
                        <Text fontSize="xs" color="gray.600" alignSelf="center">
                          Showing {indexOfFirstItem + 1} to{" "}
                          {Math.min(indexOfLastItem, filteredCategories.length)} of{" "}
                          {filteredCategories.length} categories
                        </Text>
                        <Flex align="center" gap={1} justify="center" flexWrap="wrap">
                          <Button
                            size="xs"
                            onClick={handlePrevPage}
                            isDisabled={currentPage === 1}
                            leftIcon={<FaChevronLeft />}
                            bg="white"
                            color={customColor}
                            border="1px"
                            borderColor={customColor}
                            _hover={{ bg: customColor, color: "white" }}
                            _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                            fontSize="xs"
                            px={2}
                          >
                            Prev
                          </Button>

                          {/* Page Numbers */}
                          <Flex gap={1} flexWrap="wrap" justify="center">
                            {Array.from({ length: totalCategoryPages }, (_, i) => i + 1).map(page => (
                              <Button
                                key={page}
                                size="xs"
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
                                minW="32px"
                                h="32px"
                                fontSize="xs"
                              >
                                {page}
                              </Button>
                            ))}
                          </Flex>

                          <Button
                            size="xs"
                            onClick={handleNextPage}
                            isDisabled={currentPage === totalCategoryPages}
                            rightIcon={<FaChevronRight />}
                            bg="white"
                            color={customColor}
                            border="1px"
                            borderColor={customColor}
                            _hover={{ bg: customColor, color: "white" }}
                            _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                            fontSize="xs"
                            px={2}
                          >
                            Next
                          </Button>
                        </Flex>
                      </Flex>
                    </Box>
                  </>
                )}

                {/* Products Table */}
                {currentView === "products" && (
                  <>
                    {/* Table Container */}
                    <Box 
  position="relative" 
  flex="1"
  overflow="hidden"
  display="flex"
  flexDirection="column"
>
  {/* Single Scrollable Table Container */}
  <Box
    flex="1"
    overflow="auto"
    css={{
      '&::-webkit-scrollbar': {
        width: '6px',
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
    <Table variant="simple" size="sm">
      {/* Fixed Header */}
      <Thead>
        <Tr bg={`${customColor}10`}>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            #
          </Th>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            Name
          </Th>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            Category
          </Th>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            Price
          </Th>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            Stock
          </Th>
          <Th 
            color="gray.700" 
            borderColor={`${customColor}30`} 
            fontSize="xs" 
            py={2} 
            px={3}
            position="sticky"
            top={0}
            bg={`${customColor}10`}
            zIndex={1}
          >
            Actions
          </Th>
        </Tr>
      </Thead>

      {/* Scrollable Body */}
      <Tbody>
        {currentProducts.length > 0 ? (
          currentProducts.map((prod, idx) => (
            <Tr 
              key={prod._id || idx}
              bg="white"
              _hover={{ bg: `${customColor}05` }}
              borderBottom="1px"
              borderColor={`${customColor}20`}
              height="45px"
            >
              <Td borderColor={`${customColor}20`} fontSize="sm" py={2} px={3}>
                {indexOfFirstItem + idx + 1}
              </Td>
              <Td borderColor={`${customColor}20`} fontWeight="medium" fontSize="sm" py={2} px={3}>
                <Text noOfLines={1} maxW="150px">
                  {prod.name}
                </Text>
              </Td>
              <Td borderColor={`${customColor}20`} fontSize="sm" py={2} px={3}>
                <Text noOfLines={1} maxW="120px">
                  {prod.category?.name || 
                   categories.find(c => c._id === prod.category)?.name || 
                   "N/A"}
                </Text>
              </Td>
              <Td borderColor={`${customColor}20`} fontSize="sm" py={2} px={3}>
                ₹{prod.price || prod.variants?.[0]?.price || "-"}
              </Td>
              <Td borderColor={`${customColor}20`} fontSize="sm" py={2} px={3}>
                {prod.stock || prod.variants?.[0]?.stock || "-"}
              </Td>
              <Td borderColor={`${customColor}20`} fontSize="sm" py={2} px={3}>
                <Flex gap={1}>
                  <IconButton
                                   aria-label="Edit product"
                                   icon={<FaEdit />}
                                   bg="white"
                                   color={customColor}
                                   border="1px"
                                   borderColor={customColor}
                                   _hover={{ bg: customColor, color: "white" }}
                                   size="sm"
                    onClick={() => handleEditProduct(prod)}
                    
                  />
               
                  <IconButton
                                    aria-label="Delete product"
                                    icon={<FaTrash />}
                                    bg="white"
                                    color="red.500"
                                    border="1px"
                                    borderColor="red.500"
                                    _hover={{ bg: "red.500", color: "white" }}
                                    size="sm"
                   
                    onClick={() => handleDeleteProduct(prod._id)}
                    
                  />
                </Flex>
              </Td>
            </Tr>
          ))
        ) : (
          <Tr>
            <Td colSpan={6} textAlign="center" py={6}>
              <Text fontSize="sm">No products found</Text>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  </Box>
</Box>

                    {/* Fixed Pagination Controls */}
                    <Box 
                      flexShrink={0} 
                      p="16px"
                      pt="12px"
                      borderTop="1px solid"
                      borderColor={`${customColor}20`}
                      bg="white"
                    >
                      <Flex
                        justify="space-between"
                        align={{ base: "stretch", md: "center" }}
                        direction={{ base: "column", md: "row" }}
                        gap={3}
                      >
                        <Text fontSize="xs" color="gray.600" alignSelf="center">
                          Showing {indexOfFirstItem + 1} to{" "}
                          {Math.min(indexOfLastItem, filteredProducts.length)} of{" "}
                          {filteredProducts.length} products
                        </Text>
                        <Flex align="center" gap={1} justify="center" flexWrap="wrap">
                          <Button
                            size="xs"
                            onClick={handlePrevPage}
                            isDisabled={currentPage === 1}
                            leftIcon={<FaChevronLeft />}
                            bg="white"
                            color={customColor}
                            border="1px"
                            borderColor={customColor}
                            _hover={{ bg: customColor, color: "white" }}
                            _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                            fontSize="xs"
                            px={2}
                          >
                            Prev
                          </Button>

                          {/* Page Numbers */}
                          <Flex gap={1} flexWrap="wrap" justify="center">
                            {Array.from({ length: totalProductPages }, (_, i) => i + 1).map(page => (
                              <Button
                                key={page}
                                size="xs"
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
                                minW="32px"
                                h="32px"
                                fontSize="xs"
                              >
                                {page}
                              </Button>
                            ))}
                          </Flex>

                          <Button
                            size="xs"
                            onClick={handleNextPage}
                            isDisabled={currentPage === totalProductPages}
                            rightIcon={<FaChevronRight />}
                            bg="white"
                            color={customColor}
                            border="1px"
                            borderColor={customColor}
                            _hover={{ bg: customColor, color: "white" }}
                            _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                            fontSize="xs"
                            px={2}
                          >
                            Next
                          </Button>
                        </Flex>
                      </Flex>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </CardBody>
        </Card>
      </Box>
    </Flex>
  );
}