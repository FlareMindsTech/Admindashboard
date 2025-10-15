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
} from "@chakra-ui/react";

import Card from "components/Card/Card.js";
import { FaUsers, FaArrowLeft, FaEye, FaEdit, FaPlusCircle, FaTrash } from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdCategory } from "react-icons/md";
import { Image } from "@chakra-ui/react";


export default function DashboardManagement() {
  const textColor = useColorModeValue("gray.700", "white");
  const toast = useToast();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentView, setCurrentView] = useState("categories"); // default view
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

  // ✅ Fetch categories + products
  const fetchData = useCallback(async () => {
    try {
      const categoryData = await getAllCategories();
      setCategories(categoryData.categories || []);

      const productData = await getAllProducts();
      console.log("Fetched products:", productData.data);
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

  // ✅ Category Submit
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

  // ✅ Update Category
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
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Product Submit (Add/Edit)
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

    // ✅ Upload new images if any, else keep existing
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
      // ✅ Update existing product
      await updateProducts(selectedProduct._id, productData);
      toast({
        title: "Product Updated",
        description: `"${productData.name}" updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      // ✅ Create new product
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

//image upload handler
const handleImageChange = (e) => {
  const files = Array.from(e.target.files); // Convert FileList to Array
  setNewProduct((prev) => ({
    ...prev,
    imgFiles: files,
  }));
};

  // ✅ Edit Product
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

  // ✅ Delete Product
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
    <Flex direction="column" pt={{ base: "100px", md: "75px" }}>
      {/* Dashboard Summary Cards */}
      <Grid templateColumns={{ sm: "1fr", md: "1fr 1fr 1fr" }} gap="24px" mb="24px">
        <Card onClick={() => setCurrentView("categories")} cursor="pointer" _hover={{ boxShadow: "xl" }}>
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel color="gray.400" fontWeight="bold">All Categories</StatLabel>
              <StatNumber color={textColor}>{categories.length}</StatNumber>
            </Stat>
            <Icon as={MdCategory} w={6} h={6} color="teal.400" />
          </Flex>
        </Card>

        <Card onClick={() => setCurrentView("products")} cursor="pointer" _hover={{ boxShadow: "xl" }}>
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel color="gray.400" fontWeight="bold">All Products</StatLabel>
              <StatNumber color={textColor}>{products.length}</StatNumber>
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

      {/* Categories Table */}
      {currentView === "categories" && (
        <Card p={5} shadow="xl">
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">🏷️ Categories Details</Heading>
            <Button leftIcon={<FaPlusCircle />} colorScheme="teal" onClick={() => setCurrentView("addCategory")}>
              Add Category
            </Button>
          </Flex>

          <Table variant="striped" colorScheme="green">
            <Thead bg="green.100">
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
                <Tr key={cat._id || idx}>
                  <Td>{idx + 1}</Td>
                  <Td fontWeight="bold">{cat.name}</Td>
                  <Td>{cat.description || "-"}</Td>
                  <Td><Badge colorScheme="green">Active</Badge></Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCurrentView("addProduct");
                      }}
                    >
                      + Add Product
                    </Button>
                  </Td>
                  <Td>
                    <Button size="sm" mr={2} colorScheme="teal" leftIcon={<FaEye />} onClick={() => { setSelectedCategory(cat); setCurrentView("viewCategory"); }}>
                      View
                    </Button>
                    <Button size="sm" colorScheme="orange" leftIcon={<FaEdit />} onClick={() => { setSelectedCategory(cat); setNewCategory({ name: cat.name, description: cat.description || "" }); setCurrentView("editCategory"); }}>
                      Edit
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Products Table */}
      {currentView === "products" && (
        <Card p={5} shadow="xl">
          <Heading size="md" mb={4}>🛒 All Products</Heading>
          <Table variant="simple" colorScheme="blue">
            <Thead>
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
              {Array.isArray(products) && products.length > 0 ? (
                products.map((prod, idx) => (
                  <Tr key={prod._id || idx}>
                    <Td>{idx + 1}</Td>
                    <Td>{prod.name}</Td>
                    <Td>{prod.category?.name || "N/A"}</Td>
                    <Td>₹{prod.variants?.[0]?.price || "-"}</Td>
                    <Td>{prod.variants?.[0]?.stock || "-"}</Td>
                    <Td>{prod.images?.[0] ? <Image src={prod.images[0]} boxSize="50px" objectFit="cover" /> : "-"}</Td>
                    <Td>
                      <Button size="sm" colorScheme="green" mr={2} leftIcon={<FaEdit />} onClick={() => handleEditProduct(prod)}>Edit</Button>
                      <Button size="sm" colorScheme="red" leftIcon={<FaTrash />} onClick={() => handleDeleteProduct(prod._id)}>Delete</Button>
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
      )}

      {/* Sales Panel */}
      {currentView === "sales" && (
        <Card p={6} shadow="xl" textAlign="center">
          <Heading size="md" mb={4}>💰 Total Sales Summary</Heading>
          <Text color="gray.600" fontSize="lg">Coming soon — sales analytics will be displayed here.</Text>
        </Card>
      )}

      {/* Add/Edit Category & Add Product Panels */}
      {currentView === "addCategory" && (
        <Card p={6} shadow="xl">
          <Flex mb={4} align="center">
            <Button variant="ghost" onClick={handleBack} leftIcon={<FaArrowLeft />}>Back</Button>
            <Heading size="md" ml={4}>Add Category</Heading>
          </Flex>
          <FormControl mb={3}>
            <FormLabel>Name</FormLabel>
            <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}/>
          </FormControl>
          <FormControl mb={3}>
            <FormLabel>Description</FormLabel>
            <Input value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}/>
          </FormControl>
          <Flex justify="flex-end" mt={4}>
            <Button colorScheme="blue" mr={3} onClick={handleSubmitCategory} isLoading={isSubmitting}>Save</Button>
            <Button colorScheme="gray" onClick={handleBack}>Cancel</Button>
          </Flex>
        </Card>
      )}

      {currentView === "editCategory" && selectedCategory && (
        <Card p={6} shadow="xl">
          <Flex mb={4} align="center">
            <Button variant="ghost" onClick={handleBack} leftIcon={<FaArrowLeft />}>Back</Button>
            <Heading size="md" ml={4}>Edit Category</Heading>
          </Flex>
          <FormControl mb={3}>
            <FormLabel>Name</FormLabel>
            <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}/>
          </FormControl>
          <FormControl mb={3}>
            <FormLabel>Description</FormLabel>
            <Input value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}/>
          </FormControl>
          <Flex justify="flex-end" mt={4}>
            <Button colorScheme="blue" mr={3} onClick={handleUpdateCategory} isLoading={isSubmitting}>Save</Button>
            <Button colorScheme="gray" onClick={handleBack}>Cancel</Button>
          </Flex>
        </Card>
      )}

      {currentView === "viewCategory" && selectedCategory && (
        <Card p={6} shadow="xl">
          <Flex mb={4} align="center">
            <Button variant="ghost" onClick={handleBack} leftIcon={<FaArrowLeft />}>Back</Button>
            <Heading size="md" ml={4}>View Category Details</Heading>
          </Flex>
          <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
            <Text fontWeight="bold">Name:</Text>
            <Text mb={2}>{selectedCategory.name}</Text>
            <Text fontWeight="bold">Description:</Text>
            <Text mb={2}>{selectedCategory.description || "No description"}</Text>
            <Badge colorScheme="green">Active</Badge>
          </Box>
        </Card>
      )}

      {currentView === "addProduct" && selectedCategory && (
        <Card p={8} shadow="2xl">
          <Flex mb={4} align="center">
            <Button variant="ghost" onClick={handleBack} leftIcon={<FaArrowLeft />}>Back</Button>
            <Heading size="md" ml={4}>{selectedProduct ? `Edit Product "${selectedProduct.name}"` : `Add Product for "${selectedCategory.name}"`}</Heading>
          </Flex>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}/>
            </FormControl>
            <FormControl>
              <FormLabel>Price</FormLabel>
              <Input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}/>
            </FormControl>
            <FormControl>
              <FormLabel>Stock</FormLabel>
              <Input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}/>
            </FormControl>
            <FormControl>
              <FormLabel>Color</FormLabel>
              <Input value={newProduct.color} onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}/>
            </FormControl>
            <FormControl>
              <FormLabel>Size</FormLabel>
              <Input value={newProduct.size} onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}/>
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}/>
            </FormControl>
            <FormControl>
  <FormLabel>Upload Images</FormLabel>
  <Input
    type="file"
    multiple
    accept="image/*" // Accept all image formats
    onChange={handleImageChange}
  />
  {newProduct.imgFiles && newProduct.imgFiles.length > 0 && (
    <Flex mt={2} gap={2} wrap="wrap">
      {newProduct.imgFiles.map((file, idx) => (
        <Box key={idx} boxSize="70px" border="1px solid #ccc" borderRadius="md" overflow="hidden">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      ))}
    </Flex>
  )}
</FormControl>

          </SimpleGrid>
          <Flex justify="flex-end" mt={4}>
            <Button colorScheme="blue" mr={3} onClick={handleSubmitProduct} isLoading={isSubmitting}>Save</Button>
            <Button colorScheme="gray" onClick={handleBack}>Cancel</Button>
          </Flex>
        </Card>
      )}
    </Flex>
  );
}
