import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllCategories,
  createCategories,
  getAllProducts,
  createProducts, // uses updated createProducts
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
  Image,
} from "@chakra-ui/react";

import Card from "components/Card/Card.js";
import { FaUsers, FaArrowLeft } from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdCategory } from "react-icons/md";

// Helper to upload images (used by createProducts internally)
const uploadImage = async (file) => {
  try {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${process.env.REACT_APP_BASE_URL}/upload`, {
      method: "POST",
      headers: { token },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Image upload failed: ${errorText}`);
    }

    const data = await res.json();
    console.log("✅ Image uploaded:", data.url);
    return data.url;
  } catch (err) {
    console.error("❌ Error uploading image:", err.message);
    throw err;
  }
};

export default function Dashboard() {
  const textColor = useColorModeValue("gray.700", "white");
  const toast = useToast();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
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

  // Fetch categories + products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryData = await getAllCategories();
        console.log("Fetched categories:", categoryData);
        setCategories(categoryData.categories || []);

        const productData = await getAllProducts();
        console.log("Fetched products:", productData);
        setProducts(productData || []);
      } catch (err) {
        console.error("❌ Fetch error:", err);
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

  const handleBack = () => {
    setIsAddCategoryOpen(false);
    setIsAddProductOpen(false);
    setSelectedCategory(null);
    setNewCategory(initialCategory);
    setNewProduct(initialProduct);
  };

  const handleResetCategory = () => setNewCategory(initialCategory);
  const handleResetProduct = () => setNewProduct(initialProduct);

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
      setIsSubmitting(true);
      const data = await createCategories(newCategory);
      console.log("Category created:", data);
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
    } finally {
      setIsSubmitting(false);
    }
  };

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
      description: "Please select a category first",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }

  try {
    setIsSubmitting(true);

    // 1️⃣ Upload images
    let imageUrls = [];
    if (newProduct.imgFiles.length > 0) {
      imageUrls = await Promise.all(newProduct.imgFiles.map((file) => uploadImage(file)));
    }

    // 2️⃣ Prepare product payload
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
          sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
      ],
      images: imageUrls,
    };

    // 3️⃣ Create product via API
    const response = await createProducts(productData);

    toast({
      title: "Product Created",
      description: `Product "${response?.name || productData.name}" created successfully`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    // 4️⃣ Refresh products
    const updatedProducts = await getAllProducts();
    setProducts(updatedProducts || []);

    handleBack();
  } catch (err) {
    console.error("❌ Error creating product:", err);
    toast({
      title: "Error",
      description: err.message || "Failed to create product",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const handleAddProductClick = (category) => {
    console.log("Selected category:", category);
    setSelectedCategory(category);
    setIsAddProductOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    console.log("Selected image files:", files);
    setNewProduct({ ...newProduct, imgFiles: files });
  };

  return (
    <Flex flexDirection="column" pt={{ base: "100px", md: "75px" }}>
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
            <Button
              variant="ghost"
              onClick={handleBack}
              leftIcon={<FaArrowLeft />}
              isDisabled={isSubmitting}
            >
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
              onChange={(e) =>
                setNewCategory({ ...newCategory, description: e.target.value })
              }
              placeholder="Enter category description"
            />
          </FormControl>

          <Flex mt={4}>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleSubmitCategory}
              isLoading={isSubmitting}
            >
              Submit
            </Button>
            <Button colorScheme="red" onClick={handleResetCategory} isDisabled={isSubmitting}>
              Reset
            </Button>
          </Flex>
        </Card>
      ) : isAddProductOpen ? (
        <Card p={8} shadow="2xl" borderRadius="2xl" bg="white" _dark={{ bg: "gray.800" }}>
          <Flex mb={6} align="center" borderBottom="1px" borderColor="gray.200" pb={3}>
            <Button
              variant="ghost"
              onClick={handleBack}
              leftIcon={<FaArrowLeft />}
              colorScheme="blue"
            >
              Back
            </Button>
            <Heading size="md" ml={4}>
              Add Product to{" "}
              <Text as="span" color="blue.500">
                {selectedCategory?.name || "Category"}
              </Text>
            </Heading>
          </Flex>

          <Box mb={6}>
            <Heading size="sm" color="gray.600" mb={3}>
              Basic Details
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
              <FormControl isRequired>
                <FormLabel fontWeight="semibold">Product Name</FormLabel>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="semibold">Description</FormLabel>
                <Input
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  placeholder="Enter product description"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold">Price (₹)</FormLabel>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="e.g. 999.00"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold">Stock Quantity</FormLabel>
                <Input
                  type="number"
                  min="0"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  placeholder="e.g. 100"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="semibold">Color</FormLabel>
                <Input
                  value={newProduct.color}
                  onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                  placeholder="e.g. Red, Blue"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="semibold">Size</FormLabel>
                <Input
                  value={newProduct.size}
                  onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                  placeholder="e.g. M, L, XL"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="semibold">Product Images</FormLabel>
                <Input type="file" multiple accept="image/*" onChange={handleImageChange} />
                <Flex mt={2} wrap="wrap">
                  {newProduct.imgFiles.map((file, idx) => (
                    <Image
                      key={idx}
                      src={URL.createObjectURL(file)}
                      boxSize="70px"
                      objectFit="cover"
                      mr={2}
                      mb={2}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                    />
                  ))}
                </Flex>
              </FormControl>
            </SimpleGrid>
          </Box>

          <Flex mt={6}>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleSubmitProduct}
              isLoading={isSubmitting}
            >
              Submit
            </Button>
            <Button colorScheme="gray" onClick={handleResetProduct} isDisabled={isSubmitting}>
              Reset
            </Button>
          </Flex>
        </Card>
      ) : (
        // Category Table
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
                    <Button size="sm" colorScheme="blue" onClick={() => handleAddProductClick(cat)}>
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
