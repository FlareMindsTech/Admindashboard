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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select,
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

   // Reset form
  const handleResetCategory = () => setNewCategory(initialCategory);
  const handleResetProduct = () => setNewProduct(initialProduct);
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
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Product Submit (Add/Edit)
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

    const productData = {
      name: newProduct.name.trim(),
      description: newProduct.description?.trim() || "",
      category: selectedCategory._id,
      imgFiles: newProduct.imgFiles, // <-- Added for images
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

// Edit Product handler (prefill imgFiles)
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
    imgFiles: product.imgFiles || [], // <-- Prefill existing images
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
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredProducts = products.filter(
    (prod) =>
      prod.name.toLowerCase().includes(productSearch.toLowerCase()) &&
      (productCategoryFilter ? prod.category?._id === productCategoryFilter : true)
  );

  return (
    <Flex direction="column" pt={{ base: "100px", md: "75px" }}>
      {/* Dashboard Summary */}
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

      {/* Category Table */}
      {currentView === "categories" && (
        <Card p={5} shadow="xl">
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "center" }} gap={4} mb={4} flexWrap="wrap">
            <Heading size="md" textAlign={{ base: "center", md: "left" }}>🏷️ Categories</Heading>
            <Flex align="center" bg={useColorModeValue("gray.100", "gray.700")} px={3} py={2} borderRadius="md" w={{ base: "100%", md: "300px" }} boxShadow="sm">
              <Icon as={FaSearch} color="gray.500" mr={2} />
              <Input variant="unstyled" placeholder="Search category..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
            </Flex>
            <Button leftIcon={<FaPlusCircle />} colorScheme="teal" w={{ base: "100%", sm: "auto" }} onClick={() => setCurrentView("addCategory")}>Add Category</Button>
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
              {filteredCategories.map((cat, idx) => (
                <Tr key={cat._id || idx}>
                  <Td>{idx + 1}</Td>
                  <Td fontWeight="bold">{cat.name}</Td>
                  <Td>{cat.description || "-"}</Td>
                  <Td><Badge colorScheme="green">Active</Badge></Td>
                  <Td>
                    <Button size="sm" colorScheme="blue" onClick={() => { setSelectedCategory(cat); setCurrentView("addProduct"); }}>
                      + Add Product
                    </Button>
                  </Td>
                  <Td>
                    <Button size="sm" mr={2} colorScheme="teal" leftIcon={<FaEye />} onClick={() => handleViewCategory(cat)}>View</Button>
                    <Button size="sm" colorScheme="orange" leftIcon={<FaEdit />} onClick={() => handleEditCategory(cat)}>Edit</Button>
                  </Td>
                </Tr>
              ))}
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
          <Box
          p={6}
          borderRadius="xxl"
          bg={useColorModeValue("white", "gray.800")}
          boxShadow="lg"
          minW={{ base: "250px", md: "400px" }}
        >
          {/* Header */}
          <Flex align="center" mb={5} justify="space-between">
            <Flex align="center">
              <MdCategory size={28} color="#319795" />
              <Text fontSize="2xl" fontWeight="bold" ml={3} color={useColorModeValue("gray.700", "white")}>
                {selectedCategory.name}
              </Text>
            </Flex>
            <Badge
              colorScheme={selectedCategory.status === "Active" ? "green" : "red"}
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
            >
              {selectedCategory.status || "Active"}
            </Badge>
          </Flex>
        
          {/* Labels and Description */}
          <Flex direction="column" mb={3}>
            <Text fontSize="sm" color="gray.500" mb={1}>Category Name</Text>
            <Flex align="center" mb={3}>
          
              <Text ml={2} fontSize="md" color={useColorModeValue("gray.700", "gray.100")}>
                {selectedCategory.name}
              </Text>
            </Flex>
        
            <Text fontSize="sm" color="gray.500" mb={1}>Description</Text>
            <Flex align="start" mb={3}>
        
              <Text ml={2} fontSize="md" color={useColorModeValue("gray.600", "gray.300")}>
                {selectedCategory.description || "No description available."}
              </Text>
            </Flex>
        
            <Text fontSize="sm" color="gray.500" mb={1}>Status</Text>
            <Flex align="center">
              <FaCheckCircle size={20} color="#48BB78" />
              <Badge colorScheme={selectedCategory.status === "Active" ? "green" : "red"} ml={2}>
                {selectedCategory.status || "Active"}
              </Badge>
            </Flex>
          </Flex>
        
          {/* Footer Actions */}
          <Flex mt={4} justify="flex-start" gap={4}>
            <Flex align="center" bg={useColorModeValue("gray.100", "gray.700")} p={2} borderRadius="md" cursor="pointer">
              <FaPlusCircle color="#3182CE" />
              <Text ml={2} fontSize="sm">Add Product</Text>
            </Flex>
            <Flex align="center" bg={useColorModeValue("gray.100", "gray.700")} p={2} borderRadius="md" cursor="pointer">
              <FaEdit color="#DD6B20" />
              <Text ml={2} fontSize="sm">Edit Category</Text>
            </Flex>
          </Flex>
        </Box>
        
      ) : (
        <Text>No category selected</Text>
      )}
    </ModalBody>
    <ModalFooter>
      <Button colorScheme="blue" mr={3} onClick={closeModal}>
        Close
      </Button>
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
              <Select placeholder="Filter by category" value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)} w={{ base: "100%", md: "220px" }} bg={useColorModeValue("white", "gray.800")} boxShadow="sm">
                {categories.map((cat) => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
              </Select>
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
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((prod, idx) => (
                    <Tr key={prod._id || idx}>
                      <Td>{idx + 1}</Td>
                      <Td>{prod.name}</Td>
                      <Td>{prod.category?.name || "N/A"}</Td>
                      <Td>₹{prod.variants?.[0]?.price || "-"}</Td>
                      <Td>{prod.variants?.[0]?.stock || "-"}</Td>
                      <Td>
                        <Button size="sm" colorScheme="green" mr={2} leftIcon={<FaEdit />} onClick={() => handleEditProduct(prod)}>Edit</Button>
                        <Button size="sm" colorScheme="red" leftIcon={<FaTrash />} onClick={() => handleDeleteProduct(prod._id)}>Delete</Button>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr><Td colSpan={7} textAlign="center">No products found</Td></Tr>
                )}
              </Tbody>
            </Table>
          </Flex>
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
            <FormLabel>Name</FormLabel>
            <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
          </FormControl>
          <FormControl mb={3}>
            <FormLabel>Description</FormLabel>
            <Input value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} />
          </FormControl>
          <Flex justify="flex-end" mt={4}>
            <Button colorScheme="blue" mr={3} onClick={currentView === "addCategory" ? handleSubmitCategory : handleUpdateCategory} isLoading={isSubmitting}>Save</Button>
             <Button colorScheme="gray" onClick={handleResetCategory}>Reset</Button>
          </Flex>
        </Card>
      )}

      {/* Add/Edit Product Form */}
      {currentView === "addProduct" && selectedCategory && (
  <Card p={6} shadow="xl" mt={4}>
    <Flex mb={4} align="center">
      <Button variant="ghost" onClick={handleBack} leftIcon={<FaArrowLeft />}>Back</Button>
      <Heading size="md" ml={4}>
        {selectedProduct ? "Edit Product" : `Add Product to ${selectedCategory.name}`}
      </Heading>
    </Flex>

    <FormControl mb={3}>
      <FormLabel>Name</FormLabel>
      <Input
        value={newProduct.name}
        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
      />
    </FormControl>

    <FormControl mb={3}>
      <FormLabel>Price</FormLabel>
      <Input
        type="number"
        value={newProduct.price}
        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
      />
    </FormControl>

    <FormControl mb={3}>
      <FormLabel>Stock</FormLabel>
      <Input
        type="number"
        value={newProduct.stock}
        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
      />
    </FormControl>

    <FormControl mb={3}>
      <FormLabel>Color</FormLabel>
      <Input
        value={newProduct.color}
        onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
      />
    </FormControl>

    <FormControl mb={3}>
      <FormLabel>Size</FormLabel>
      <Input
        value={newProduct.size}
        onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
      />
    </FormControl>

    <FormControl mb={3}>
      <FormLabel>Description</FormLabel>
      <Input
        value={newProduct.description}
        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
      />
    </FormControl>

    <FormControl mb={3}>
      <FormLabel>Images</FormLabel>
      <Input
        type="file"
        multiple
        onChange={(e) => {
          const filesArray = Array.from(e.target.files);
          setNewProduct({ ...newProduct, imgFiles: filesArray });
        }}
      />
      {/* Preview selected images */}
      <Flex mt={2} gap={2} flexWrap="wrap">
        {newProduct.imgFiles.map((file, idx) => (
          <Box key={idx} w="70px" h="70px" border="1px solid gray" borderRadius="md" overflow="hidden">
            <Image
              src={typeof file === "string" ? file : URL.createObjectURL(file)}
              alt={`Preview ${idx}`}
              objectFit="cover"
              w="100%"
              h="100%"
            />
          </Box>
        ))}
      </Flex>
    </FormControl>

    <Flex justify="flex-end" mt={4}>
      <Button colorScheme="blue" mr={3} onClick={handleSubmitProduct} isLoading={isSubmitting}>
        Save
      </Button>
      <Button
        colorScheme="gray"
        onClick={() => setNewProduct(initialProduct)}
      >
        Reset
      </Button>
    </Flex>
  </Card>
)}

    </Flex>
  );
}
