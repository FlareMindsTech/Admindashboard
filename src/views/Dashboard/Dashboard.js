import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCategories, createCategories } from "../utils/axiosInstance";
// import { getAllProducts, createProduct } from "../utils/axiosInstance"; // <-- commented out

// Chakra imports
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
} from "@chakra-ui/react";

// Custom components
import Card from "components/Card/Card.js";

// Icons
import { FaUsers, FaArrowLeft } from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdCategory } from "react-icons/md";

export default function Dashboard() {
  const textColor = useColorModeValue("gray.700", "white");
  const toast = useToast();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Panel states
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    color: "",
    size: "",
    variants: "",
    description: "",
    imgUrls: [],
    imgFiles: [],
  });

  // Fetch current user
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || (storedUser.role !== "admin" && storedUser.role !== "super admin")) {
      toast({
        title: "Access Denied",
        description: "Only admin or super admin users can access this page.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      navigate("/auth/signin");
      return;
    }
    setCurrentUser(storedUser);
  }, [navigate, toast]);

  // Fetch categories and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryData = await getAllCategories();
        setCategories(categoryData.categories || []);

        // const productData = await getAllProducts(); // <-- commented out
        // setProducts(productData.products || []); // <-- commented out
      } catch (err) {
        console.error(err);
        toast({
          title: "Fetch Error",
          description: err.message || "Failed to load data",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchData();
  }, [toast]);

  if (!currentUser) return null;

  // Handlers
  const handleBack = () => {
    setIsAddCategoryOpen(false);
    setIsAddProductOpen(false);
    setSelectedCategory(null);
    setNewCategory({ name: "", description: "" });
    setNewProduct({
      name: "",
      price: "",
      stock: "",
      color: "",
      size: "",
      variants: "",
      description: "",
      imgUrls: [],
      imgFiles: [],
    });
  };

  const handleSubmitCategory = async () => {
    if (!newCategory.name.trim()) {
      return toast({
        title: "Validation Error",
        description: "Category name is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    try {
      const data = await createCategories(newCategory);
      toast({
        title: "Category Created",
        description: `Category "${data.category.name}" created successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setCategories((prev) => [...prev, data.category]);
      handleBack();
    } catch (err) {
      console.error("Error creating category:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create category",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddProductClick = (category) => {
    setSelectedCategory(category);
    setIsAddProductOpen(true);
  };

  const handleSubmitProduct = async () => {
    // const payload = { ...newProduct, categoryId: selectedCategory._id }; // commented
    // const data = await createProduct(payload); // commented
  };

  return (
    <Flex flexDirection="column" pt={{ base: "100px", md: "75px" }}>
      <Text fontSize="2xl" fontWeight="bold" color={textColor} mb={4}>
        Welcome, {currentUser.name} 👋
      </Text>

      {/* Dashboard Summary Cards */}
      <Grid templateColumns={{ sm: "1fr", md: "1fr 1fr 1fr" }} gap="24px" mb="24px">
        <Card minH="83px">
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel fontSize="sm" color="gray.400" fontWeight="bold">
                All Categories
              </StatLabel>
              <StatNumber fontSize="lg" color={textColor}>
                {categories.length}
              </StatNumber>
            </Stat>
            <Icon as={MdCategory} h={6} w={6} color="teal.400" />
          </Flex>
        </Card>
        <Card minH="83px">
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel fontSize="sm" color="gray.400" fontWeight="bold">
                All Products
              </StatLabel>
              <StatNumber fontSize="lg" color={textColor}>
                {products.length}
              </StatNumber>
            </Stat>
            <Icon as={IoCheckmarkDoneCircleSharp} h={6} w={6} color="green.400" />
          </Flex>
        </Card>
        <Card minH="83px">
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel fontSize="sm" color="gray.400" fontWeight="bold">
                Total Sales
              </StatLabel>
              <StatNumber fontSize="lg" color={textColor}>
                10
              </StatNumber>
            </Stat>
            <Icon as={FaUsers} h={6} w={6} color="blue.400" />
          </Flex>
        </Card>
      </Grid>

      {/* Conditional Panels */}
      {isAddCategoryOpen ? (
        <Card p={5} shadow="xl">
          <Flex mb={4} align="center">
            <Button variant="ghost" onClick={handleBack} leftIcon={<FaArrowLeft />}>
              Back
            </Button>
            <Heading size="md" ml={4}>
              Create New Category
            </Heading>
          </Flex>
          <FormControl mb={3}>
            <FormLabel>Name</FormLabel>
            <Input
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Enter category name"
            />
          </FormControl>
          <FormControl mb={3}>
            <FormLabel>Description</FormLabel>
            <Input
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="Enter category description"
            />
          </FormControl>
          <Flex mt={4}>
            <Button colorScheme="blue" mr={3} onClick={handleSubmitCategory}>
              Submit
            </Button>
            <Button onClick={handleBack}>Cancel</Button>
          </Flex>
        </Card>
      ) : isAddProductOpen ? (
        <Card p={5} shadow="xl">
          <Flex mb={4} align="center">
            <Button variant="ghost" onClick={handleBack} leftIcon={<FaArrowLeft />}>
              Back
            </Button>
            <Heading size="md" ml={4}>
              Add Product to {selectedCategory?.name || "Category"}
            </Heading>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Product Name</FormLabel>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Enter product name"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Price</FormLabel>
              <Input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="Enter product price"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Stock</FormLabel>
              <Input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                placeholder="Enter stock quantity"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Color</FormLabel>
              <Input
                value={newProduct.color}
                onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                placeholder="Enter product color"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Size</FormLabel>
              <Input
                value={newProduct.size}
                onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                placeholder="Enter product size"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Variants</FormLabel>
              <Input
                value={newProduct.variants}
                onChange={(e) => setNewProduct({ ...newProduct, variants: e.target.value })}
                placeholder="Enter product variants (comma separated)"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Enter product description"
              />
            </FormControl>
          </SimpleGrid>

          {/* Images Section */}
          <Box mt={4}>
            <FormLabel>Images (1-5)</FormLabel>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {Array.from({ length: 2 }).map((_, idx) => (
                <Input
                  key={idx}
                  type="text"
                  placeholder={`Image URL ${idx + 1} (optional)`}
                  value={newProduct.imgUrls?.[idx] || ""}
                  onChange={(e) => {
                    const urls = [...(newProduct.imgUrls || [])];
                    urls[idx] = e.target.value;
                    setNewProduct({ ...newProduct, imgUrls: urls });
                  }}
                />
              ))}
              <Input type="file" accept="image/*" multiple disabled />
            </SimpleGrid>
            <Text fontSize="sm" color="gray.500" mt={1}>
              You can provide 1-5 images via URLs or file uploads.
            </Text>
          </Box>

          <Flex mt={4} justify="flex-start">
            <Button colorScheme="blue" mr={3} disabled>
              Submit
            </Button>
            <Button onClick={handleBack}>Cancel</Button>
          </Flex>
        </Card>
      ) : (
        <Card p={5} shadow="xl">
          <Flex justify="space-between" align="center">
            <Heading size="md" mb={4}>
              🏷️ Categories Details
            </Heading>
            <Button colorScheme="teal" mb={4} onClick={() => setIsAddCategoryOpen(true)}>
              + Add Category
            </Button>
          </Flex>
          <Table variant="striped" colorScheme="green">
            <Thead bg="green.100">
              <Tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Description</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {categories.map((cat, idx) => (
                <Tr key={cat._id || idx}>
                  <Td>{idx + 1}</Td>
                  <Td>{cat.name}</Td>
                  <Td>{cat.description || "-"}</Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleAddProductClick(cat)}
                    >
                      + Add Products
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}
    </Flex>
  );
}
