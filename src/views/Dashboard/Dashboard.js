import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCategories, getAllProducts } from "../utils/axiosInstance";
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
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Image,
  Spinner,
  SimpleGrid,
  Tag,
  Stack,
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import {
  FaUsers,
  FaEye,
  FaCheckCircle,
  FaPlusCircle,
  FaEdit,
  FaRupeeSign,
  FaBox,
  FaPalette,
  FaRuler,
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ✅ Validate Admin Access
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (
      !storedUser ||
      (storedUser.role !== "admin" && storedUser.role !== "super admin")
    ) {
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

  // ✅ Fetch Categories
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const categoryData = await getAllCategories();
      setCategories(categoryData.categories || []);
    } catch (err) {
      toast({
        title: "Fetch Error",
        description: err.message || "Failed to load categories.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingCategories(false);
    }
  }, [toast]);

  // ✅ Fetch Products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const productData = await getAllProducts();
      console.log("Fetched products:", productData.data);
      setProducts(productData.data || []);
    } catch (err) {
      toast({
        title: "Fetch Error",
        description: err.message || "Failed to load products.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  if (!currentUser) return null;

  // ✅ View Modal Controls
  const handleViewCategory = (cat) => {
    setSelectedCategory(cat);
    setIsViewModalOpen(true);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
    setIsProductModalOpen(false);
    setSelectedCategory(null);
    setSelectedProduct(null);
  };

  return (
    <Flex direction="column" pt={{ base: "100px", md: "75px" }}>
      {/* Dashboard Summary */}
      <Grid
        templateColumns={{ sm: "1fr", md: "1fr 1fr 1fr" }}
        gap="24px"
        mb="24px"
      >
        <Card
          onClick={() => setCurrentView("categories")}
          cursor="pointer"
          _hover={{ boxShadow: "xl" }}
        >
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel color="gray.400" fontWeight="bold">
                All Categories
              </StatLabel>
              <StatNumber color={textColor}>{categories.length}</StatNumber>
            </Stat>
            <Icon as={MdCategory} w={6} h={6} color="teal.400" />
          </Flex>
        </Card>

        <Card
          onClick={() => setCurrentView("products")}
          cursor="pointer"
          _hover={{ boxShadow: "xl" }}
        >
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel color="gray.400" fontWeight="bold">
                All Products
              </StatLabel>
              <StatNumber color={textColor}>{products.length}</StatNumber>
            </Stat>
            <Icon
              as={IoCheckmarkDoneCircleSharp}
              w={6}
              h={6}
              color="green.400"
            />
          </Flex>
        </Card>

        <Card cursor="pointer" _hover={{ boxShadow: "xl" }}>
          <Flex align="center" justify="space-between" p={4}>
            <Stat>
              <StatLabel color="gray.400" fontWeight="bold">
                Total Sales
              </StatLabel>
              <StatNumber color={textColor}>₹ 10,000</StatNumber>
            </Stat>
            <Icon as={FaUsers} w={6} h={6} color="blue.400" />
          </Flex>
        </Card>
      </Grid>

      {/* ✅ Categories Table */}
      {currentView === "categories" && (
        <Card p={5} shadow="xl">
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">🏷️ Categories Details</Heading>
          </Flex>

          {loadingCategories ? (
            <Flex justify="center" py={10}>
              <Spinner size="lg" color="teal.400" />
            </Flex>
          ) : (
            <Table variant="striped" colorScheme="green">
              <Thead bg="green.100">
                <Tr>
                  <Th>ID</Th>
                  <Th>Name</Th>
                  <Th>Description</Th>
                  <Th>Status</Th>
                  <Th>View</Th>
                </Tr>
              </Thead>
              <Tbody>
                {categories.length > 0 ? (
                  categories.map((cat, idx) => (
                    <Tr key={cat._id || idx}>
                      <Td>{idx + 1}</Td>
                      <Td fontWeight="bold">{cat.name}</Td>
                      <Td>{cat.description || "-"}</Td>
                      <Td>
                        <Badge colorScheme="green">Active</Badge>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          colorScheme="teal"
                          leftIcon={<FaEye />}
                          onClick={() => handleViewCategory(cat)}
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={5} textAlign="center">
                      No categories found
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ✅ Products Table */}
      {currentView === "products" && (
        <Card p={5} shadow="xl">
          <Heading size="md" mb={4}>
            🛒 All Products
          </Heading>

          {loadingProducts ? (
            <Flex justify="center" py={10}>
              <Spinner size="lg" color="blue.400" />
            </Flex>
          ) : (
            <Table variant="simple" colorScheme="blue">
              <Thead>
                <Tr>
                  <Th>#</Th>
                  <Th>Name</Th>
                  <Th>Category</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Array.isArray(products) && products.length > 0 ? (
                  products.map((prod, idx) => (
                    <Tr key={prod._id || idx}>
                      <Td>{idx + 1}</Td>
                      <Td fontWeight="bold">{prod.name}</Td>
                      <Td>{prod.category?.name || "N/A"}</Td>
                      <Td>₹{prod.variants?.[0]?.price || prod.price || "-"}</Td>
                      <Td>{prod.variants?.[0]?.stock || prod.stock || "-"}</Td>
                      <Td>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          leftIcon={<FaEye />}
                          onClick={() => handleViewProduct(prod)}
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={6} textAlign="center">
                      No products found
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ✅ Modal Popup for Category View */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={closeModal}
        size="xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Category Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedCategory && (
              <Box
                p={6}
                borderRadius="xxl"
                bg={useColorModeValue("white", "gray.800")}
                boxShadow="lg"
                minW={{ base: "250px", md: "400px" }}
              >
                <Flex align="center" mb={5} justify="space-between">
                  <Flex align="center">
                    <MdCategory size={28} color="#319795" />
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      ml={3}
                      color={useColorModeValue("gray.700", "white")}
                    >
                      {selectedCategory.name}
                    </Text>
                  </Flex>
                  <Badge
                    colorScheme={
                      selectedCategory.status === "Active" ? "green" : "red"
                    }
                    fontSize="sm"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {selectedCategory.status || "Active"}
                  </Badge>
                </Flex>

                <Flex direction="column" mb={3}>
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Category Name
                  </Text>
                  <Text
                    ml={2}
                    fontSize="md"
                    color={useColorModeValue("gray.700", "gray.100")}
                    mb={3}
                  >
                    {selectedCategory.name}
                  </Text>

                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Description
                  </Text>
                  <Text
                    ml={2}
                    fontSize="md"
                    color={useColorModeValue("gray.600", "gray.300")}
                    mb={3}
                  >
                    {selectedCategory.description || "No description available."}
                  </Text>

                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Status
                  </Text>
                  <Flex align="center">
                    <FaCheckCircle size={20} color="#48BB78" />
                    <Badge
                      colorScheme={
                        selectedCategory.status === "Active" ? "green" : "red"
                      }
                      ml={2}
                    >
                      {selectedCategory.status || "Active"}
                    </Badge>
                  </Flex>
                </Flex>

                
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={closeModal} colorScheme="blue">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ✅ Modal Popup for Product View */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={closeModal}
        size="2xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Product Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProduct && (
              <Box
                p={6}
                borderRadius="lg"
                bg={useColorModeValue("white", "gray.800")}
                boxShadow="lg"
              >
                {/* Product Header */}
                <Flex align="center" mb={6} justify="space-between">
                  <Flex align="center">
                    <IoCheckmarkDoneCircleSharp size={28} color="#3182CE" />
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      ml={3}
                      color={useColorModeValue("gray.700", "white")}
                    >
                      {selectedProduct.name}
                    </Text>
                  </Flex>
                  <Badge
                    colorScheme={
                      selectedProduct.status === "Active" ? "green" : 
                      selectedProduct.status === "Out of Stock" ? "red" : "blue"
                    }
                    fontSize="sm"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {selectedProduct.status || "Active"}
                  </Badge>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {/* Product Images */}
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      Product Images
                    </Text>
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <Flex gap={3} flexWrap="wrap">
                        {selectedProduct.images.slice(0, 3).map((img, idx) => (
                          <Box
                            key={idx}
                            w="100px"
                            h="100px"
                            border="1px solid"
                            borderColor="gray.300"
                            borderRadius="md"
                            overflow="hidden"
                          >
                            <Image
                              src={img}
                              alt={`Product ${idx + 1}`}
                              objectFit="cover"
                              w="100%"
                              h="100%"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/100x100?text=Image";
                              }}
                            />
                          </Box>
                        ))}
                      </Flex>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        No images available
                      </Text>
                    )}
                  </Box>

                  {/* Product Details */}
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      Basic Information
                    </Text>
                    <Stack spacing={3}>
                      <Flex align="center">
                        <FaRupeeSign size={16} color="#319795" />
                        <Text ml={2} fontSize="md" fontWeight="medium">
                          Price: ₹{selectedProduct.variants?.[0]?.price || selectedProduct.price || "N/A"}
                        </Text>
                      </Flex>
                      <Flex align="center">
                        <FaBox size={16} color="#3182CE" />
                        <Text ml={2} fontSize="md" fontWeight="medium">
                          Stock: {selectedProduct.variants?.[0]?.stock || selectedProduct.stock || "N/A"}
                        </Text>
                      </Flex>
                      <Flex align="center">
                        <MdCategory size={16} color="#805AD5" />
                        <Text ml={2} fontSize="md" fontWeight="medium">
                          Category: {selectedProduct.category?.name || "N/A"}
                        </Text>
                      </Flex>
                    </Stack>
                  </Box>
                </SimpleGrid>

                {/* Variants Information */}
                {(selectedProduct.variants && selectedProduct.variants.length > 0) && (
                  <Box mt={6}>
                    <Text fontSize="sm" color="gray.500" mb={3}>
                      Product Variants
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                      {selectedProduct.variants.map((variant, idx) => (
                        <Box
                          key={idx}
                          p={3}
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="md"
                          bg={useColorModeValue("gray.50", "gray.700")}
                        >
                          <Flex justify="space-between" align="center" mb={2}>
                            <Text fontSize="sm" fontWeight="bold">
                              Variant {idx + 1}
                            </Text>
                            <Tag size="sm" colorScheme="blue">
                              {variant.sku || "No SKU"}
                            </Tag>
                          </Flex>
                          <Stack spacing={1}>
                            <Flex align="center">
                              <FaPalette size={12} color="#D69E2E" />
                              <Text ml={2} fontSize="sm">
                                Color: {variant.color || "N/A"}
                              </Text>
                            </Flex>
                            <Flex align="center">
                              <FaRuler size={12} color="#38A169" />
                              <Text ml={2} fontSize="sm">
                                Size: {variant.size || "N/A"}
                              </Text>
                            </Flex>
                            <Flex align="center">
                              <FaRupeeSign size={12} color="#319795" />
                              <Text ml={2} fontSize="sm">
                                Price: ₹{variant.price || "N/A"}
                              </Text>
                            </Flex>
                            <Flex align="center">
                              <FaBox size={12} color="#3182CE" />
                              <Text ml={2} fontSize="sm">
                                Stock: {variant.stock || "N/A"}
                              </Text>
                            </Flex>
                          </Stack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {/* Product Description */}
                <Box mt={6}>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Description
                  </Text>
                  <Text
                    fontSize="md"
                    color={useColorModeValue("gray.600", "gray.300")}
                    p={3}
                    bg={useColorModeValue("gray.50", "gray.700")}
                    borderRadius="md"
                  >
                    {selectedProduct.description || "No description available."}
                  </Text>
                </Box>

              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={closeModal} colorScheme="blue">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}