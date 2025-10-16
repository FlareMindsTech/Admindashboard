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
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import { FaUsers, FaEye } from "react-icons/fa";
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // "category" or "product"

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

  // ✅ Fetch Categories + Products
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

  // ✅ View Modal Controls
  const handleViewCategory = (cat) => {
    setSelectedItem(cat);
    setModalType("category");
    setIsViewModalOpen(true);
  };

  const handleViewProduct = (prod) => {
    setSelectedItem(prod);
    setModalType("product");
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedItem(null);
    setModalType(null);
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
            <Icon as={IoCheckmarkDoneCircleSharp} w={6} h={6} color="green.400" />
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
        </Card>
      )}

      {/* ✅ Products Table */}
      {currentView === "products" && (
        <Card p={5} shadow="xl">
          <Heading size="md" mb={4}>
            🛒 All Products
          </Heading>
          <Table variant="simple" colorScheme="blue">
            <Thead>
              <Tr>
                <Th>S.No</Th>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Stock</Th>
                <Th>Colors</Th>
                <Th>Action</Th>
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
                    <Td>{prod.variants?.[0]?.color || "-"}</Td>
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="teal"
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
                  <Td colSpan={7} textAlign="center">
                    No products found
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ✅ Shared Modal for Category / Product */}
      <Modal isOpen={isViewModalOpen} onClose={closeModal} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {modalType === "category" ? "Category Details" : "Product Details"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedItem && modalType === "category" && (
              <Box>
                <Text fontWeight="bold">Name:</Text>
                <Text mb={2}>{selectedItem.name}</Text>
                <Text fontWeight="bold">Description:</Text>
                <Text mb={2}>
                  {selectedItem.description || "No description available."}
                </Text>
                <Badge colorScheme="green">Active</Badge>
              </Box>
            )}

            {selectedItem && modalType === "product" && (
              <Box>
                <Text fontWeight="bold">Name:</Text>
                <Text mb={2}>{selectedItem.name}</Text>
                <Text fontWeight="bold">Category:</Text>
                <Text mb={2}>
                  {selectedItem.category?.name || "No category"}
                </Text>
                <Text fontWeight="bold">Price:</Text>
                <Text mb={2}>
                  ₹{selectedItem.variants?.[0]?.price || "N/A"}
                </Text>
                <Text fontWeight="bold">Stock:</Text>
                <Text mb={2}>{selectedItem.variants?.[0]?.stock || "N/A"}</Text>
                <Text fontWeight="bold">Color :</Text>
                <Text mb={2}>{selectedItem.variants?.[0]?.color || "N/A"}</Text>
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

      {/* Sales Panel */}
      {currentView === "sales" && (
        <Card p={6} shadow="xl" textAlign="center">
          <Heading size="md" mb={4}>
            💰 Total Sales Summary
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Coming soon — sales analytics will be displayed here.
          </Text>
        </Card>
      )}
    </Flex>
  );
}
