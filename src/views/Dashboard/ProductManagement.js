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

import Card from "components/Card/Card.js";
import {
  FaUsers,
  FaArrowLeft,
  FaEye,
  FaEdit,
  FaPlusCircle,
  FaTrash,
  FaSearch,
  FaCheckCircle,
} from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdCategory } from "react-icons/md";

export default function ProductManagement() {
  const textColor = useColorModeValue("gray.700", "white");
  const toast = useToast();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentView, setCurrentView] = useState("categories");
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

  if (!currentUser) return null;

  const handleBack = () => {
    setCurrentView("categories");
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
        images: newProduct.imgFiles, // Using 'images' instead of 'imgFiles' as it's more standard
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        color: newProduct.color || "default",
        size: newProduct.size || "default",
        // Include variants if your backend expects them
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

      console.log("Product API Response:", response); // Debug log
      await fetchData();
      handleBack();
    } catch (err) {
      console.error("Product submission error:", err); // Debug log
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
    
    // Use images instead of imgFiles if that's what the backend returns
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

  // Loading component for tables
  const TableLoader = ({ columns = 6 }) => (
    <Tr>
      <Td colSpan={columns} textAlign="center" py={8}>
        <Center>
          <Spinner size="lg" color="blue.500" mr={4} />
          <Text>Loading data...</Text>
        </Center>
      </Td>
    </Tr>
  );

  return (
    <Flex direction="column" pt={{ base: "100px", md: "75px" }}>
      {/* Dashboard Summary */}
      <Grid templateColumns={{ sm: "1fr", md: "1fr 1fr 1fr" }} gap="24px" mb="24px">
        <Card onClick={() => setCurrentView("categories")} cursor="pointer" _hover={{ boxShadow: "xl" }}>
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel color="gray.400" fontWeight="bold">All Categories</StatLabel>
              <StatNumber color={textColor}>
                {isLoadingCategories ? <Spinner size="sm" /> : categories.length}
              </StatNumber>
            </Stat>
            <Icon as={MdCategory} w={6} h={6} color="teal.400" />
          </Flex>
        </Card>
        <Card onClick={() => setCurrentView("products")} cursor="pointer" _hover={{ boxShadow: "xl" }}>
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel color="gray.400" fontWeight="bold">All Products</StatLabel>
              <StatNumber color={textColor}>
                {isLoadingProducts ? <Spinner size="sm" /> : products.length}
              </StatNumber>
            </Stat>
            <Icon as={IoCheckmarkDoneCircleSharp} w={6} h={6} color="green.400" />
          </Flex>
        </Card>
        <Card onClick={() => setCurrentView("sales")} cursor="pointer" _hover={{ boxShadow: "xl" }}>
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel color="gray.400" fontWeight="bold">Total Sales</StatLabel>
              <StatNumber color={textColor}>₹ 10,000</StatNumber>
            </Stat>
            <Icon as={FaUsers} w={6} h={6} color="blue.400" />
          </Flex>
        </Card>
      </Grid>

      {/* Category Table */}
      {currentView === "categories" && (
        <Card p={5} shadow="xl">
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "center" }} gap={4} mb={4} flexWrap="wrap">
            <Heading size="md" textAlign={{ base: "center", md: "left" }}>🏷️ Categories</Heading>
            <Flex align="center" bg={useColorModeValue("gray.100", "gray.700")} px={3} py={2} borderRadius="md" w={{ base: "100%", md: "300px" }} boxShadow="sm">
              <Icon as={FaSearch} color="gray.500" mr={2} />
              <Input variant="unstyled" placeholder="Search category..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
            </Flex>
            <Button 
              leftIcon={<FaPlusCircle />} 
              colorScheme="teal" 
              w={{ base: "100%", sm: "auto" }} 
              onClick={() => setCurrentView("addCategory")}
              isLoading={isLoadingCategories}
            >
              Add Category
            </Button>
          </Flex>

          <Table variant="striped" colorScheme="green">
            <Thead bg="green.100">
              <Tr>
                <Th>#</Th>
                <Th>Name</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Add Product</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoadingCategories ? (
                <TableLoader columns={6} />
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((cat, idx) => (
                  <Tr key={cat._id || idx}>
                    <Td>{idx + 1}</Td>
                    <Td fontWeight="bold">{cat.name}</Td>
                    <Td>{cat.description || "-"}</Td>
                    <Td><Badge colorScheme="green">{cat.status}</Badge></Td>
                    <Td>
                      <Button 
                        size="sm" 
                        colorScheme="blue" 
                        onClick={() => { setSelectedCategory(cat); setCurrentView("addProduct"); }}
                        isLoading={isLoadingData}
                      >
                        + Add Product
                      </Button>
                    </Td>
                    <Td>
                      <Button size="sm" colorScheme="orange" leftIcon={<FaEdit />} onClick={() => handleEditCategory(cat)}>Edit</Button>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8}>
                    <Text>No categories found</Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* View Category Modal */}
      <Modal isOpen={isViewModalOpen} onClose={closeModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Category Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedCategory ? (
              <Box p={6} borderRadius="lg" bg={useColorModeValue("white", "gray.800")} boxShadow="lg">
                <Flex align="center" mb={4} justify="space-between">
                  <Flex align="center">
                    <MdCategory size={28} color="#319795" />
                    <Text fontSize="2xl" fontWeight="bold" ml={3} color={useColorModeValue("gray.700", "white")}>
                      {selectedCategory.name}
                    </Text>
                  </Flex>
                  <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
                    Active
                  </Badge>
                </Flex>
                
                <Text fontSize="sm" color="gray.500" mb={1}>Category Name</Text>
                <Text mb={3} fontSize="md" color={useColorModeValue("gray.700", "gray.100")}>
                  {selectedCategory.name}
                </Text>
                
                <Text fontSize="sm" color="gray.500" mb={1}>Description</Text>
                <Text mb={3} fontSize="md" color={useColorModeValue("gray.600", "gray.300")}>
                  {selectedCategory.description || "No description available."}
                </Text>
                
                <Text fontSize="sm" color="gray.500" mb={1}>Status</Text>
                <Flex align="center">
                  <FaCheckCircle size={20} color="#48BB78" />
                  <Badge colorScheme="green" ml={2}>{selectedCategory.status}</Badge>
                </Flex>
              </Box>
            ) : (
              <Text>No category selected</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={closeModal}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Product Table */}
      {currentView === "products" && (
        <Card p={5} shadow="xl">
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "center" }} gap={4} mb={4} flexWrap="wrap">
            <Heading size="md" textAlign={{ base: "center", md: "left" }}>🛒 Products</Heading>
            <Flex align={{ base: "stretch", md: "center" }} gap={3} flexWrap="wrap" w={{ base: "100%", md: "auto" }} justify={{ base: "center", md: "flex-end" }}>
              <Flex align="center" bg={useColorModeValue("gray.100", "gray.700")} px={3} py={2} borderRadius="md" boxShadow="sm" w={{ base: "100%", md: "250px" }}>
                <Icon as={FaSearch} color="gray.500" mr={2} />
                <Input variant="unstyled" placeholder="Search product..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
              </Flex>
              <Select 
                placeholder="Filter by category" 
                value={productCategoryFilter} 
                onChange={(e) => setProductCategoryFilter(e.target.value)} 
                w={{ base: "100%", md: "220px" }} 
                bg={useColorModeValue("white", "gray.800")} 
                boxShadow="sm"
                isDisabled={isLoadingProducts}
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </Select>
              <Button 
                leftIcon={<FaPlusCircle />} 
                colorScheme="teal" 
                onClick={() => { setSelectedCategory(null); setCurrentView("addProduct"); }}
                isLoading={isLoadingData}
              >
                Add Product
              </Button>
            </Flex>
          </Flex>

          <Table variant="simple" colorScheme="blue" mt={4}>
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Stock</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoadingProducts ? (
                <TableLoader columns={6} />
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((prod, idx) => (
                  <Tr key={prod._id || idx}>
                    <Td>{idx + 1}</Td>
                    <Td fontWeight="bold">{prod.name}</Td>
                    <Td>
                      {prod.category?.name || 
                       categories.find(c => c._id === prod.category)?.name || 
                       "N/A"}
                    </Td>
                    <Td>₹{prod.price || prod.variants?.[0]?.price || "-"}</Td>
                    <Td>{prod.stock || prod.variants?.[0]?.stock || "-"}</Td>
                    <Td>
                      <Button 
                        size="sm" 
                        colorScheme="green" 
                        mr={2} 
                        leftIcon={<FaEdit />} 
                        onClick={() => handleEditProduct(prod)}
                        isLoading={isLoadingData}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        colorScheme="red" 
                        leftIcon={<FaTrash />} 
                        onClick={() => handleDeleteProduct(prod._id)}
                        isLoading={isLoadingProducts}
                      >
                        Delete
                      </Button>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8}>
                    <Text>No products found</Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Category Form */}
      {(currentView === "addCategory" || (currentView === "editCategory" && selectedCategory)) && (
        <Card p={6} shadow="xl" mt={4}>
          <Flex mb={4} align="center">
            <Button variant="ghost" onClick={handleBack} leftIcon={<FaArrowLeft />}>Back</Button>
            <Heading size="md" ml={4}>{currentView === "addCategory" ? "Add Category" : "Edit Category"}</Heading>
          </Flex>
          <FormControl mb={3}>
            <FormLabel>Name *</FormLabel>
            <Input 
              value={newCategory.name} 
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} 
              placeholder="Enter category name"
            />
          </FormControl>
          <FormControl mb={3}>
            <FormLabel>Description</FormLabel>
            <Textarea 
              value={newCategory.description} 
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} 
              placeholder="Enter category description"
              rows={3}
            />
          </FormControl>
          <Flex justify="flex-end" mt={4} gap={3}>
            <Button colorScheme="gray" onClick={handleResetCategory}>Reset</Button>
            <Button 
              colorScheme="blue" 
              onClick={currentView === "addCategory" ? handleSubmitCategory : handleUpdateCategory} 
              isLoading={isSubmitting || isLoadingCategories}
            >
              {currentView === "addCategory" ? "Create Category" : "Update Category"}
            </Button>
          </Flex>
        </Card>
      )}

      {/* Add/Edit Product Form */}
      {currentView === "addProduct" && (
        <Card p={6} shadow="xl" mt={4}>
          <Flex mb={4} align="center">
            <Button variant="ghost" onClick={handleBack} leftIcon={<FaArrowLeft />}>
              Back
            </Button>
            <Heading size="md" ml={4}>
              {selectedProduct ? "Edit Product" : "Add Product"}
              {selectedCategory && ` to ${selectedCategory.name}`}
            </Heading>
          </Flex>

          {/* Category Selection */}
          {!selectedCategory && (
            <FormControl mb={4}>
              <FormLabel>Category *</FormLabel>
              <Select
                placeholder="Select category"
                value={selectedCategory?._id || ""}
                onChange={(e) => {
                  const category = categories.find(c => c._id === e.target.value);
                  setSelectedCategory(category);
                }}
                isDisabled={isLoadingCategories}
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </Select>
              {isLoadingCategories && (
                <Flex align="center" mt={2}>
                  <Spinner size="sm" mr={2} />
                  <Text fontSize="sm" color="gray.500">Loading categories...</Text>
                </Flex>
              )}
            </FormControl>
          )}

          {/* 2-column grid for inputs */}
          <Grid templateColumns={["1fr", "1fr 1fr"]} gap={6} mb={4}>
            <FormControl isRequired>
              <FormLabel>Product Name *</FormLabel>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Enter product name"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Price *</FormLabel>
              <Input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="Enter price"
                min="0"
                step="0.01"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Stock *</FormLabel>
              <Input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                placeholder="Enter stock quantity"
                min="0"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Color</FormLabel>
              <Input
                value={newProduct.color}
                onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                placeholder="Enter color"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Size</FormLabel>
              <Input
                value={newProduct.size}
                onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                placeholder="Enter size"
              />
            </FormControl>
          </Grid>

          <FormControl mb={4}>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              placeholder="Enter product description"
              rows={3}
            />
          </FormControl>

          {/* Image URLs field */}
          <FormControl mb={4}>
            <FormLabel>Image URLs (comma-separated)</FormLabel>
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
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              Separate multiple image URLs with commas
            </Text>

            {/* Preview image URLs */}
            {newProduct.imgFiles.length > 0 && (
              <Box mt={3}>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Image Previews:</Text>
                <Flex gap={3} flexWrap="wrap">
                  {newProduct.imgFiles.map((url, idx) => (
                    <Box
                      key={idx}
                      w="80px"
                      h="80px"
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="md"
                      overflow="hidden"
                      position="relative"
                      _hover={{ transform: "scale(1.05)", transition: "0.2s" }}
                    >
                      <Image
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        objectFit="cover"
                        w="100%"
                        h="100%"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/80x80?text=Error";
                        }}
                      />
                    </Box>
                  ))}
                </Flex>
              </Box>
            )}
          </FormControl>

          {/* Action buttons */}
          <Flex justify="flex-end" mt={6} gap={3}>
            <Button colorScheme="gray" onClick={handleResetProduct}>
              Reset
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmitProduct}
              isLoading={isSubmitting || isLoadingProducts}
              isDisabled={!selectedCategory}
            >
              {selectedProduct ? "Update Product" : "Create Product"}
            </Button>
          </Flex>
        </Card>
      )}
    </Flex>
  );
}