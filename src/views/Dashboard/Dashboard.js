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
  uploadImage,
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
  Heading,
  Text,
  useToast,
  Icon,
  Button,
  Box,
  Input,
  FormControl,
  FormLabel,
  SimpleGrid,
  Badge,
  Image,
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import {
  FaUsers,
  FaArrowLeft,
  FaEye,
  FaEdit,
  FaPlusCircle,
  FaTrash,
} from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdCategory } from "react-icons/md";

export default function DashboardManagement() {
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

  // Custom colors
  const customColor = "#7b2cbf";
  const customHoverColor = "#5a189a";

  // ✅ Fetch current user
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

  // ✅ Fetch categories and products
  const fetchData = useCallback(async () => {
    try {
      const categoryData = await getAllCategories();
      setCategories(categoryData.categories || []);

      const productData = await getAllProducts();
      setProducts(productData.data || []);
    } catch (err) {
      toast({
        title: "Fetch Error",
        description: err.message || "Failed to load dashboard data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!currentUser) return null;

  const handleBack = () => {
    setCurrentView("categories");
    setSelectedCategory(null);
    setSelectedProduct(null);
    setNewCategory(initialCategory);
    setNewProduct(initialProduct);
  };

  // --- Category Handlers ---
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
        description: `"${data.category.name}" added successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setCategories((prev) => [...prev, data.category]);
      handleBack();
    } catch (err) {
      toast({
        title: "Error Creating Category",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    } catch (err) {
      toast({
        title: "Error Updating Category",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Product Handlers ---
  const handleSubmitProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      return toast({
        title: "Validation Error",
        description: "Name, Price, and Stock are required.",
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
      let imageUrls = [];
      if (newProduct.imgFiles.length > 0) {
        imageUrls = await Promise.all(newProduct.imgFiles.map((file) => uploadImage(file)));
      }

      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description?.trim() || "",
        category: selectedCategory._id,
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
        images: imageUrls,
      };

      if (selectedProduct) {
        await updateProducts(selectedProduct._id, productData);
        toast({
          title: "Product Updated",
          description: `"${productData.name}" updated successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createProducts(productData);
        toast({
          title: "Product Created",
          description: `"${productData.name}" added successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      await fetchData();
      handleBack();
    } catch (err) {
      toast({
        title: selectedProduct ? "Error Updating Product" : "Error Creating Product",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewProduct((prev) => ({
      ...prev,
      imgFiles: files,
    }));
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setSelectedCategory(categories.find((c) => c._id === product.category?._id));
    setNewProduct({
      name: product.name,
      price: product.variants?.[0]?.price || "",
      stock: product.variants?.[0]?.stock || "",
      color: product.variants?.[0]?.color || "",
      size: product.variants?.[0]?.size || "",
      description: product.description || "",
      imgFiles: [],
    });
    setCurrentView("addProduct");
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProducts(productId);
      toast({
        title: "Product Deleted",
        description: "Product deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchData();
    } catch (err) {
      toast({
        title: "Delete Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex direction="column" pt={{ base: "100px", md: "75px" }} px={{ base: 2, md: 6 }}>
      {/* Dashboard Cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="24px" mb="24px">
        <Card
          onClick={() => setCurrentView("categories")}
          cursor="pointer"
          border="1px"
          borderColor={customColor}
          _hover={{ bg: `${customColor}10`, transform: "translateY(-2px)", shadow: "lg" }}
        >
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel color="gray.600" fontWeight="bold">All Categories</StatLabel>
              <StatNumber color={textColor}>{categories.length}</StatNumber>
            </Stat>
            <Icon as={MdCategory} w={6} h={6} color={customColor} />
          </Flex>
        </Card>

        <Card
          onClick={() => setCurrentView("products")}
          cursor="pointer"
          border="1px"
          borderColor={customColor}
          _hover={{ bg: `${customColor}10`, transform: "translateY(-2px)", shadow: "lg" }}
        >
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel color="gray.600" fontWeight="bold">All Products</StatLabel>
              <StatNumber color={textColor}>{products.length}</StatNumber>
            </Stat>
            <Icon as={IoCheckmarkDoneCircleSharp} w={6} h={6} color={customColor} />
          </Flex>
        </Card>

        <Card
          onClick={() => setCurrentView("sales")}
          cursor="pointer"
          border="1px"
          borderColor={customColor}
          _hover={{ bg: `${customColor}10`, transform: "translateY(-2px)", shadow: "lg" }}
        >
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel color="gray.600" fontWeight="bold">Total Sales</StatLabel>
              <StatNumber color={textColor}>₹ 10,000</StatNumber>
            </Stat>
            <Icon as={FaUsers} w={6} h={6} color={customColor} />
          </Flex>
        </Card>
      </Grid>

      {/* Responsive Box wrapper for tables */}
      <Box overflowX="auto">
        {/* Categories Table */}
        {currentView === "categories" && (
          <Card p={5} shadow="xl">
            <Flex justify="space-between" align="center" mb={4} flexWrap="wrap">
              <Heading size="md" color="gray.700">🏷️ Categories Details</Heading>
              <Button
                leftIcon={<FaPlusCircle />}
                bg={customColor}
                _hover={{ bg: customHoverColor }}
                color="white"
                mt={{ base: 2, md: 0 }}
                onClick={() => setCurrentView("addCategory")}
              >
                Add Category
              </Button>
            </Flex>

            <Table variant="simple" bg="white" size="sm">
              <Thead bg={`${customColor}20`}>
                <Tr>
                  <Th>ID</Th>
                  <Th>Name</Th>
                  <Th>Description</Th>
                  <Th>Status</Th>
                  <Th>Add Product</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {categories.map((cat, idx) => (
                  <Tr key={cat._id || idx} _hover={{ bg: `${customColor}10` }}>
                    <Td>{idx + 1}</Td>
                    <Td fontWeight="bold">{cat.name}</Td>
                    <Td>{cat.description || "-"}</Td>
                    <Td>
                      <Badge
                        bg={`${customColor}20`}
                        color={customColor}
                        border="1px"
                        borderColor={customColor}
                      >
                        Active
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        bg="white"
                        color={customColor}
                        border="1px"
                        borderColor={customColor}
                        _hover={{ bg: customColor, color: "white" }}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setCurrentView("addProduct");
                        }}
                      >
                        + Add Product
                      </Button>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        mr={2}
                        bg="white"
                        color={customColor}
                        border="1px"
                        borderColor={customColor}
                        _hover={{ bg: customColor, color: "white" }}
                        leftIcon={<FaEye />}
                        onClick={() => { setSelectedCategory(cat); setCurrentView("viewCategory"); }}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        bg={`${customColor}20`}
                        color={customColor}
                        _hover={{ bg: customColor, color: "white" }}
                        leftIcon={<FaEdit />}
                        onClick={() => { setSelectedCategory(cat); setNewCategory({ name: cat.name, description: cat.description || "" }); setCurrentView("editCategory"); }}
                      >
                        Edit
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        )}
      </Box>

      {/* Products Table */}
      {currentView === "products" && (
        <Box overflowX="auto">
          <Card p={5} shadow="xl">
            <Flex justify="space-between" align="center" mb={4} flexWrap="wrap">
              <Heading size="md" color="gray.700">🛒 All Products</Heading>
              <Button
                leftIcon={<FaPlusCircle />}
                bg={customColor}
                _hover={{ bg: customHoverColor }}
                color="white"
                mt={{ base: 2, md: 0 }}
                onClick={() => {
                  setSelectedCategory(categories[0]);
                  setCurrentView("addProduct");
                }}
              >
                Add Product
              </Button>
            </Flex>

            <Table variant="simple" bg="white" size="sm">
              <Thead bg={`${customColor}20`}>
                <Tr>
                  <Th>#</Th>
                  <Th>Name</Th>
                  <Th>Category</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <Th>Images</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {products.length > 0 ? (
                  products.map((prod, idx) => (
                    <Tr key={prod._id || idx} _hover={{ bg: `${customColor}10` }}>
                      <Td>{idx + 1}</Td>
                      <Td>{prod.name}</Td>
                      <Td>{prod.category?.name || "N/A"}</Td>
                      <Td>₹{prod.variants?.[0]?.price || "-"}</Td>
                      <Td>{prod.variants?.[0]?.stock || "-"}</Td>
                      <Td>
                        {prod.images?.[0] ? <Image src={prod.images[0]} boxSize="50px" objectFit="cover" /> : "-"}
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          bg="white"
                          color={customColor}
                          border="1px"
                          borderColor={customColor}
                          _hover={{ bg: customColor, color: "white" }}
                          mr={2}
                          leftIcon={<FaEdit />}
                          onClick={() => handleEditProduct(prod)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          bg="white"
                          color="red.500"
                          border="1px"
                          borderColor="red.500"
                          _hover={{ bg: "red.500", color: "white" }}
                          leftIcon={<FaTrash />}
                          onClick={() => handleDeleteProduct(prod._id)}
                        >
                          Delete
                        </Button>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} textAlign="center">No products found</Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Card>
        </Box>
      )}

      {/* Sales Panel */}
      {currentView === "sales" && (
        <Card p={6} shadow="xl" textAlign="center" bg="white">
          <Heading size="md" mb={4} color="gray.700">💰 Total Sales Summary</Heading>
          <Text color="gray.600" fontSize="lg">Coming soon — sales analytics will be displayed here.</Text>
        </Card>
      )}

      {/* Add/Edit Category */}
      {(currentView === "addCategory" || currentView === "editCategory") && (
        <Card p={6} shadow="xl" bg="white" mt={4}>
          <Flex mb={4} align="center">
            <Button
              variant="ghost"
              onClick={handleBack}
              leftIcon={<FaArrowLeft />}
              color={customColor}
            >
              Back
            </Button>
            <Heading size="md" ml={4} color="gray.700">
              {currentView === "addCategory" ? "Add Category" : `Edit Category "${selectedCategory?.name}"`}
            </Heading>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
              />
            </FormControl>
          </SimpleGrid>

          <Flex justify="flex-end" mt={4}>
            <Button
              bg={customColor}
              _hover={{ bg: customHoverColor }}
              color="white"
              mr={3}
              onClick={currentView === "addCategory" ? handleSubmitCategory : handleUpdateCategory}
              isLoading={isSubmitting}
            >
              Save
            </Button>
            <Button colorScheme="gray" onClick={handleBack} border="1px" borderColor="gray.300">
              Cancel
            </Button>
          </Flex>
        </Card>
      )}

      {/* Add/Edit Product */}
      {currentView === "addProduct" && selectedCategory && (
        <Card p={6} shadow="xl" bg="white" mt={4}>
          <Flex mb={4} align="center">
            <Button
              variant="ghost"
              onClick={handleBack}
              leftIcon={<FaArrowLeft />}
              color={customColor}
            >
              Back
            </Button>
            <Heading size="md" ml={4} color="gray.700">
              {selectedProduct ? `Edit Product "${selectedProduct.name}"` : `Add Product to "${selectedCategory.name}"`}
            </Heading>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Price</FormLabel>
              <Input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Stock</FormLabel>
              <Input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Color</FormLabel>
              <Input
                value={newProduct.color}
                onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Size</FormLabel>
              <Input
                value={newProduct.size}
                onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Images</FormLabel>
              <Input
                type="file"
                multiple
                onChange={handleImageChange}
                borderColor={`${customColor}50`}
                _hover={{ borderColor: customColor }}
              />
            </FormControl>
          </SimpleGrid>

          <Flex justify="flex-end" mt={4}>
            <Button
              bg={customColor}
              _hover={{ bg: customHoverColor }}
              color="white"
              mr={3}
              onClick={handleSubmitProduct}
              isLoading={isSubmitting}
            >
              Save
            </Button>
            <Button colorScheme="gray" onClick={handleBack} border="1px" borderColor="gray.300">
              Cancel
            </Button>
          </Flex>
        </Card>
      )}
    </Flex>
  );
}
