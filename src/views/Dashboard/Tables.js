import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  Textarea,
  Image,
  Grid,
  GridItem,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  useToast,
  Badge,
  FormControl,
  FormLabel,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  Divider,
  HStack,
  Spinner,
} from "@chakra-ui/react";
import { DeleteIcon, LinkIcon, CloseIcon, AddIcon } from "@chakra-ui/icons";
import React, { useState, useEffect } from "react";
// --- CRITICAL CHANGE: IMPORT THE CUSTOM AXIOS INSTANCE ---
import axiosInstance from "../utils/axiosInstance"; 
// ---------------------------------------------------------
import { useNavigate } from "react-router-dom";

// --- CRITICAL FIX: DEFINE BASE_URL FOR IMAGE HANDLING ---
const BASE_URL = "http://localhost:7000"; // <--- ADJUST THIS TO YOUR ACTUAL BACKEND SERVER ADDRESS 
// ---------------------------------------------------------


function AddProductForm() {
  // --- STATE MANAGEMENT ---
  const [size, setSize] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [editProductId, setEditProductId] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("active");

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // --- MODAL DISCLOSURES ---
  const {
    isOpen: isProductOpen,
    onOpen: onProductOpen,
    onClose: onProductClose,
  } = useDisclosure();
  const {
    isOpen: isCategoryOpen,
    onOpen: onCategoryOpen,
    onClose: onCategoryClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [productToDelete, setProductToDelete] = useState(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  // --- HOOKS ---
  const bgCard = useColorModeValue("white", "gray.700");
  const bgProductDetails = useColorModeValue("gray.50", "gray.800");
  const toast = useToast();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false); 
  
  // ------------------ ADMIN VALIDATION & TOKEN FETCH ------------------
  useEffect(() => {
    const userString = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token) {
      toast({
        title: "Authentication Error 🔒",
        description: "No authentication token found. Please sign in.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      navigate("/auth/signin");
      return;
    }

    const user = userString ? JSON.parse(userString) : null;

    if (!user || (user.role !== "admin" && user.role !== "super admin")) {
      toast({
        title: "Access Denied 🔒",
        description: "Only admins or super admins can manage products.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      navigate("/auth/signin");
      return;
    }

    setCurrentUser(user);
    setIsAuthChecked(true); 
  }, [navigate, toast]);

  // ------------------ FETCH DATA FUNCTIONS ------------------
  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get(`/products/all`); 
      setProducts(res.data.data || []);
    } catch (err) {
      console.error("Fetch Products Error:", err);
      toast({
        title: "Error fetching products",
        description: err.response?.data?.message || "Could not load products list. Check API/Auth/Server Status.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get(`/categories/all`); 
      setCategories(res.data.data || []);
    } catch (err) {
      console.error("Fetch Categories Error:", err);
      toast({
        title: "Error fetching categories",
        description: err.response?.data?.message || "Could not load categories list. Check API/Auth/Server Status.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  // ------------------ MAIN DATA FETCH EFFECT ------------------
  useEffect(() => {
    if (isAuthChecked) {
      const loadData = async () => {
        setIsDataLoading(true);
        await Promise.all([fetchCategories(), fetchProducts()]);
        setIsDataLoading(false);
      };
      loadData();
    }
  }, [isAuthChecked]);

  // ------------------ EARLY RETURN FOR LOADING STATES ------------------
  if (!isAuthChecked || !currentUser || isDataLoading) {
    return (
      <Flex h="100vh" justify="center" align="center">
        <Spinner size="xl" color="teal.500" thickness="4px" />
        <Text ml="4" fontSize="xl">Loading Inventory...</Text>
      </Flex>
    );
  }

  // ------------------ IMAGE HANDLERS ------------------
  const getFullImageUrl = (path) => {
    if (path.startsWith("http")) return path;
    if (path.startsWith("uploads/")) return `${BASE_URL}/${path}`;
    return `${BASE_URL}/uploads/products/${path.split('/').pop()}`;
  };

  const handleImageChange = async (e) => {
    if (isLoading || productImages.length >= 5) return;

    const files = Array.from(e.target.files).slice(0, 5 - productImages.length);
    if (!files.length) return;
    setIsLoading(true);

    try {
      const uploadPromises = files.map((file) => {
        const formData = new FormData();
        formData.append("file", file);

        return axiosInstance.post(`/products/upload`, formData);
      });

      const results = await Promise.all(uploadPromises);
      const uploadedUrls = results
        .filter((res) => res.data.success && res.data.data?.imageUrl)
        .map((res) => res.data.data.imageUrl);

      if (!uploadedUrls.length) {
        toast({ title: "Upload Failed", description: "No images were uploaded successfully.", status: "warning" });
        return;
      }

      setProductImages((prev) => [...prev, ...uploadedUrls].slice(0, 5)); 
      toast({ title: "Upload Successful ✅", description: `${uploadedUrls.length} image(s) uploaded.`, status: "success" });
    } catch (err) {
      console.error("Failed to upload images", err.response?.data || err.message);
      toast({
        title: "Upload Error",
        description: err.response?.data?.message || "Failed to upload images. Check file size/type and network.",
        status: "error"
      });
    } finally {
      setIsLoading(false);
      e.target.value = null; 
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim() || productImages.length >= 5) {
      toast({ title: "Input Error", description: "Please enter a valid image URL or max images reached.", status: "warning" });
      return;
    }
    setProductImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (imgToRemove) => {
    setProductImages((prev) => prev.filter((img) => img !== imgToRemove));
  };

  const handleSetPrimaryImage = (imgToSet) => {
    const filteredImages = productImages.filter((img) => img !== imgToSet);
    setProductImages([imgToSet, ...filteredImages]);
  };

  // ------------------ FORM VALIDATION ------------------
  const validateProductFields = () => {
    if (!selectedCategoryId) return "Please select a category.";
    if (!name || name.length < 3)
      return "Product name must be at least 3 characters.";
    if (!size) return "Please select a size variant.";
    if (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) <= 0)
      return "Price must be a valid positive number.";
    if (mrp && !/^\d+(\.\d{1,2})?$/.test(mrp))
      return "MRP must be a valid number.";
    if (!/^\d+$/.test(stock) || Number(stock) < 0)
      return "Stock must be a non-negative integer.";
    if (!productImages.length) return "Please upload at least one image.";
    return null;
  };

  // ------------------ ADD / UPDATE PRODUCT ------------------
  const resetForm = () => {
    setName("");
    setDescription("");
    setSize("");
    setPrice("");
    setMrp("");
    setStock("");
    setProductImages([]);
    setEditProductId(null);
    setSelectedCategoryId("");
    setNewImageUrl("");
    setStatus("active");
    onProductClose();
  };

  const handleSubmitProduct = async () => {
    if (isLoading) {
      toast({ title: "Wait", description: "Please wait for the current action to complete.", status: "info" });
      return;
    }

    const error = validateProductFields();
    if (error) {
      toast({ title: "Validation Error", description: error, status: "error" });
      return;
    }

    setIsLoading(true);

    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, "_").toUpperCase();

    const productData = {
      name: name.trim(),
      description: description.trim(),
      category: selectedCategoryId,
      images: productImages, 
      status: status,
      variants: [
        {
          size,
          color: "Default",
          price: Number(price),
          mrp: mrp ? Number(mrp) : 0,
          stock: Number(stock),
          sku: `${sanitizedName.substring(0, 4)}_${size.toUpperCase()}_${new Date().getTime() % 10000}`, 
        },
      ],
    };

    try {
      if (editProductId) {
        await axiosInstance.put(
          `/products/update/${editProductId}`,
          productData
        );
        toast({ title: "Product Updated 🎉", description: `Product "${name}" has been updated.`, status: "success" });
      } else {
        await axiosInstance.post(
          `/products/create`,
          productData
        );
        toast({ title: "Product Added 🚀", description: `New product "${name}" has been created.`, status: "success" });
      }
      await fetchProducts(); 
    } catch (err) {
      console.error("Failed to submit product", err.response?.data || err.message);
      toast({
        title: "Submission Error",
        description:
          err.response?.data?.message ||
          `Error ${editProductId ? "updating" : "adding"} product.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      resetForm();
    }
  };

  // ------------------ CATEGORY HANDLER ------------------
  const handleSubmitCategory = async () => {
    if (isLoading) return;

    if (!categoryName) {
      toast({ title: "Category Name Required", description: "Please enter a name for the new category.", status: "warning" });
      return;
    }

    setIsLoading(true);

    try {
      const res = await axiosInstance.post(
        `/categories/create`,
        {
          name: categoryName,
          description: categoryDescription,
          status: "active",
        }
      );
      const categoryId = res.data.data?._id || res.data.category?._id;
      if (!categoryId) throw new Error("Invalid response from server");

      setSelectedCategoryId(categoryId);
      fetchCategories();
      toast({ title: "Category Added ✨", description: `Category "${categoryName}" added and selected.`, status: "success" });
    } catch (err) {
      console.error("Failed to add category", err.response?.data || err.message);
      toast({
        title: "Category Error",
        description: err.response?.data?.message || "Error adding category. Check if category already exists.",
        status: "error",
      });
    } finally {
      setIsLoading(false);
    }

    setCategoryName("");
    setCategoryDescription("");
    onCategoryClose();
  };

  const handleEditProduct = (product) => {
    resetForm();
    setName(product.name);
    setDescription(product.description);
    setStatus(product.status || "active");

    const variant = product.variants?.[0];
    if (variant) {
      setSize(variant.size);
      setPrice(String(variant.price || ""));
      setMrp(String(variant.mrp || ""));
      setStock(String(variant.stock || ""));
    }

    setProductImages(product.images || []);
    setSelectedCategoryId(product.category?._id || product.category);
    setEditProductId(product._id);
    onProductOpen();
  };

  // ------------------ DELETE HANDLER ------------------
  const openDeleteModal = (product) => {
    setProductToDelete(product);
    onDeleteOpen();
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete || isLoading) {
      onDeleteClose();
      return;
    }

    setIsLoading(true);

    try {
      await axiosInstance.delete(
        `/products/delete/${productToDelete._id}`
      );
      await fetchProducts(); 
      toast({ title: "Product Deleted 🗑️", description: `Product "${productToDelete.name}" has been removed.`, status: "info" });
    } catch (err) {
      console.error("Failed to delete product", err.response?.data || err.message);
      toast({
        title: "Deletion Error",
        description: err.response?.data?.message || "Failed to delete the product. Check your permissions.",
        status: "error"
      });
    } finally {
      setIsLoading(false);
      onDeleteClose();
      setProductToDelete(null);
    }
  };

  // ------------------ RENDER LOGIC ------------------

  return (
    <Box p={{ base: "4", md: "8" }} minH="100vh" >
      {/* HEADER SECTION */}
      <Flex
        justify="space-between"
        align="center"
        mt="4" // Adjusted margin for mobile
        mb="6" // Adjusted margin for mobile
        p="4"
        bg={useColorModeValue("white", "gray.800")}
        borderRadius="lg"
        shadow="md"
        direction={{ base: "column", md: "row" }} // Stack on mobile
      >
        <Text 
          fontSize={{ base: "xl", md: "3xl" }} // Responsive font size
          fontWeight="extrabold" 
          color="#82278A"
          mb={{ base: "3", md: "0" }} // Margin below text on mobile
        >
          🛍️ Product Management Dashboard
        </Text>
        <Button
          p="4"
          colorScheme="teal"
          leftIcon={<AddIcon />}
          size={{ base: "sm", md: "md" }} // Responsive button size
          onClick={() => {
            resetForm();
            onProductOpen();
          }}
          isLoading={isLoading}
          w={{ base: "full", md: "auto" }} // Full width button on mobile
        >
          Add New Product
        </Button>
      </Flex>

      <Divider mb="8" borderColor="gray.300" />

      {/* --- Products Grid --- */}
      <Box>
        <Text fontSize="2xl" fontWeight="semibold" mb="6" color={useColorModeValue("gray.700", "white")}>
          Current Inventory
        </Text>
        <Grid
          templateColumns={{
            base: "repeat(1, 1fr)",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          }}
          gap="6"
        >
          {products.length === 0 ? (
            <Alert status="info" gridColumn={{ base: "span 1", sm: "span 2", md: "span 3", lg: "span 4" }} borderRadius="md" variant="left-accent">
              <AlertIcon />
              No products found. Start by adding a new product!
            </Alert>
          ) : (
            products.map((p) => {
              const variant = p.variants?.[0];
              const isLowStock = variant?.stock <= 5 && variant?.stock > 0;
              const isOutOfStock = variant?.stock === 0;

              return (
                <Box
                  key={p._id}
                  bg={bgCard}
                  borderRadius="xl"
                  shadow="lg"
                  overflow="hidden"
                  border={isOutOfStock ? "2px solid" : "none"}
                  borderColor={isOutOfStock ? "red.400" : "transparent"}
                  transition="all 0.3s"
                  _hover={{ shadow: "2xl", transform: "translateY(-3px)" }}
                >
                  {/* Product Image */}
                  <Box h="220px" w="100%" overflow="hidden" borderBottom="1px solid" borderColor="gray.200">
                    <Image
                      src={getFullImageUrl(p.images?.[0] || "placeholder.jpg")}
                      alt={p.name}
                      h="100%"
                      w="100%"
                      objectFit="cover"
                      transition="transform 0.5s"
                      _hover={{ transform: "scale(1.05)" }}
                    />
                  </Box>
                  {/* Product Details */}
                  <Box p="4" pb="6">
                    <Flex justify="space-between" align="start" mb="2">
                      <Text fontWeight="extrabold" fontSize="lg" noOfLines={1} color={useColorModeValue("gray.800", "white")}>
                        {p.name}
                      </Text>
                      {p.category?.name && (
                        <Badge colorScheme="purple" variant="solid" textTransform="capitalize">
                          {p.category.name}
                        </Badge>
                      )}
                    </Flex>

                    <Text fontSize="sm" color="gray.500" noOfLines={2} mb="3">
                      {p.description || "No description provided."}
                    </Text>

                    <Flex align="center" gap="2" mb="3" wrap="wrap">
                      {variant?.size && (
                        <Badge colorScheme="blue" variant="outline" borderRadius="full" px="3">
                          {variant.size}
                        </Badge>
                      )}
                      <Text fontSize="lg" fontWeight="bold" color="teal.600">
                        ₹{variant?.price ? Number(variant.price).toFixed(2) : "0.00"}
                      </Text>
                      {variant?.mrp > variant?.price && (
                        <Text fontSize="sm" color="gray.500" as="del" ml="1">
                          ₹{Number(variant.mrp).toFixed(2)}
                        </Text>
                      )}
                    </Flex>

                    {/* Stock Indicator */}
                    <Text fontSize="sm" mt="1">
                      Stock:{" "}
                      <Text
                        as="span"
                        fontWeight="bold"
                        color={isOutOfStock ? "red.500" : isLowStock ? "orange.500" : "green.500"}
                      >
                        {variant?.stock || 0}
                      </Text>
                      {isOutOfStock && <Badge ml="2" colorScheme="red">SOLD OUT</Badge>}
                      {isLowStock && !isOutOfStock && <Badge ml="2" colorScheme="orange">LOW STOCK</Badge>}
                    </Text>


                    <Stack mt="5" direction="row" spacing="3">
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => handleEditProduct(p)}
                        flex="1"
                        isDisabled={isLoading}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        leftIcon={<DeleteIcon />}
                        variant="solid"
                        onClick={() => openDeleteModal(p)}
                        flex="1"
                        isDisabled={isLoading}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              );
            })
          )}
        </Grid>
      </Box>

      {/* ---------------- PRODUCT MODAL ---------------- */}
      <Modal isOpen={isProductOpen} onClose={resetForm} size={{ base: "full", md: "5xl" }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent borderRadius={{ base: "none", md: "xl" }}>
          <ModalHeader
            bg="#82278A"
            color="white"
            borderTopRadius={{ base: "none", md: "xl" }}
            pb="3"
            pt="6"
          >
            {editProductId ? "Edit Product" : "Add New Product"}
          </ModalHeader>
          <ModalCloseButton color="white" top="12px" />
          <ModalBody pb="6" pt="6">
            <Grid templateColumns={{ base: "1fr", md: "3fr 2fr" }} gap="10">
              {/* --- Product Details (Left Side) --- */}
              <GridItem>
                <Stack spacing="5">
                  <Text fontSize="xl" fontWeight="semibold" color="#82278A">Product Information</Text>
                  <Divider />
                  <FormControl isRequired>
                    <FormLabel>Product Name</FormLabel>
                    <Input
                      placeholder="e.g., Slim-Fit Denim Jeans"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      size="lg"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      placeholder="Detailed product description (e.g., material, features)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      resize="vertical"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Category</FormLabel>
                    <Flex gap="3" direction={{ base: "column", sm: "row" }}>
                      <Select
                        placeholder="Select category"
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        size="lg"
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                      <Button
                        size="lg"
                        colorScheme="blue"
                        onClick={onCategoryOpen}
                        leftIcon={<AddIcon />}
                        flexShrink={0}
                        isDisabled={isLoading}
                        w={{ base: "full", sm: "auto" }}
                      >
                        New Category
                      </Button>
                    </Flex>
                  </FormControl>

                  {/* Status Dropdown - Added for editing */}
                  {editProductId && (
                    <FormControl isRequired>
                        <FormLabel>Product Status</FormLabel>
                        <Select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            size="lg"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="draft">Draft</option>
                        </Select>
                    </FormControl>
                  )}


                  <FormControl isRequired>
                    <FormLabel>Size Variant (Only one supported by current form)</FormLabel>
                    <Flex gap="2" wrap="wrap">
                      {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                        <Button
                          key={s}
                          size="md"
                          colorScheme={size === s ? "teal" : "gray"}
                          variant={size === s ? "solid" : "outline"}
                          onClick={() => setSize(s)}
                          borderRadius="full"
                        >
                          {s}
                        </Button>
                      ))}
                    </Flex>
                  </FormControl>

                  <Text fontSize="xl" fontWeight="semibold" color="#82278A" mt="4">Pricing & Stock</Text>
                  <Divider />

                  <Grid templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }} gap="4">
                    <FormControl isRequired>
                      <FormLabel>Price (₹)</FormLabel>
                      <Input
                        placeholder="1299.00"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>MRP (₹)</FormLabel>
                      <Input
                        placeholder="1999.00 (Optional)"
                        type="number"
                        value={mrp}
                        onChange={(e) => setMrp(e.target.value)}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Stock Quantity</FormLabel>
                      <Input
                        placeholder="50"
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                      />
                    </FormControl>
                  </Grid>
                </Stack>
              </GridItem>

              {/* --- Image Upload (Right Side) --- */}
              <GridItem>
                <Box p="5" bg={bgProductDetails} borderRadius="xl" shadow="inner">
                  <FormLabel fontWeight="bold" fontSize="lg" mb="4" color="#82278A">
                    Product Images ({productImages.length}/5)
                  </FormLabel>

                  {/* Image Previews */}
                  <Flex gap="3" wrap="wrap" mb="5" justify={{ base: "center", md: "flex-start" }}>
                    {productImages.map((img, idx) => (
                      <Box
                        key={idx}
                        w="80px"
                        h="80px"
                        position="relative"
                        border={
                          idx === 0
                            ? "4px solid var(--chakra-colors-teal-500)"
                            : "2px solid var(--chakra-colors-gray-400)"
                        }
                        borderRadius="lg"
                        overflow="hidden"
                        shadow="md"
                        onClick={() => handleSetPrimaryImage(img)}
                        cursor="pointer"
                      >
                        <Image
                          src={getFullImageUrl(img)}
                          alt={`Product Image ${idx + 1}`}
                          w="100%"
                          h="100%"
                          objectFit="cover"
                        />
                        {/* Primary Label/Remove Button */}
                        <Tooltip label={idx === 0 ? "Primary Image" : "Make Primary"} hasArrow>
                          <Badge
                            position="absolute"
                            top="0"
                            left="0"
                            m="1"
                            colorScheme={idx === 0 ? "teal" : "gray"}
                            fontSize="2xs"
                            px="2"
                            pointerEvents="none"
                          >
                            {idx === 0 ? "PRIMARY" : `IMG ${idx + 1}`}
                          </Badge>
                        </Tooltip>

                        <IconButton
                          aria-label="Remove image"
                          icon={<CloseIcon />}
                          size="xs"
                          colorScheme="red"
                          position="absolute"
                          top="-5px"
                          right="-5px"
                          borderRadius="full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(img);
                          }}
                        />
                      </Box>
                    ))}
                  </Flex>

                  {/* Upload via File Input */}
                  <FormControl mb="4">
                    <FormLabel 
                      htmlFor="file-upload" 
                      cursor="pointer" 
                      border="2px dashed" 
                      borderColor="gray.400" 
                      p="4" 
                      borderRadius="md" 
                      textAlign="center" 
                      _hover={{ borderColor: "teal.500" }}
                    >
                      {isLoading ? (
                        <HStack justify="center"><Spinner size="sm" /> <Text>Uploading...</Text></HStack>
                      ) : (
                        `Click to upload images (Max ${5 - productImages.length} more)`
                      )}
                    </FormLabel>
                    <Input
                      type="file"
                      id="file-upload"
                      onChange={handleImageChange}
                      accept="image/*"
                      multiple
                      display="none"
                      isDisabled={productImages.length >= 5 || isLoading}
                    />
                  </FormControl>

                  {/* Upload via URL Input */}
                  <HStack mb="4">
                    <Input
                        placeholder="Paste image URL here"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        isDisabled={productImages.length >= 5 || isLoading}
                    />
                    <Button 
                        onClick={handleAddImageUrl} 
                        colorScheme="teal" 
                        leftIcon={<LinkIcon />}
                        isDisabled={productImages.length >= 5 || !newImageUrl.trim() || isLoading}
                        flexShrink={0}
                    >
                        Add URL
                    </Button>
                  </HStack>
                </Box>
              </GridItem>
            </Grid>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={resetForm} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleSubmitProduct}
              isLoading={isLoading}
              loadingText={editProductId ? "Updating..." : "Adding..."}
            >
              {editProductId ? "Save Changes" : "Create Product"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ---------------- CATEGORY MODAL ---------------- */}
      <Modal isOpen={isCategoryOpen} onClose={onCategoryClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Category</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Category Name</FormLabel>
                <Input
                  placeholder="e.g., Men's Clothing, Electronics"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Brief description of the category"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onCategoryClose} variant="ghost" mr={3} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmitCategory}
              isLoading={isLoading}
            >
              Add Category
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ---------------- DELETE CONFIRMATION MODAL ---------------- */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete the product:
              <Text as="span" fontWeight="bold" ml="1">
                {productToDelete?.name}?
              </Text>
            </Text>
            <Alert status="warning" mt="4" borderRadius="md">
              <AlertIcon />
              This action is irreversible.
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDeleteProduct} isLoading={isLoading}>
              Delete Product
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default AddProductForm;