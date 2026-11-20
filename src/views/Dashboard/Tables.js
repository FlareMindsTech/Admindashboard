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
import { BASE_URL } from "../../config";
// ---------------------------------------------------------
import { useNavigate } from "react-router-dom";

// const BASE_URL = "https://electromart-e-com-backend.onrender.com"; // Removed hardcoded URL
// ---------------------------------------------------------


function AddProductForm() {
  // --- STATE MANAGEMENT ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [editProductId, setEditProductId] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Product Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("Available"); // Default to Backend Enum

  // Variant Fields (Electronics Schema)
  const [color, setColor] = useState("Black");
  const [ram, setRam] = useState("8");
  const [storage, setStorage] = useState("128");

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // --- ENUMS (MATCHING BACKEND PRODUCT.JS) ---
  const COLORS = ["Red", "Blue", "Green", "Black", "White", "Yellow", "Pink", "Gray", "Maroon", "Purple"];
  const RAM_OPTIONS = [4, 6, 8, 12, 16, 24, 32, 64];
  const STORAGE_OPTIONS = [64, 128, 256, 512, 1024, 2048];
  const STATUS_OPTIONS = ["Available", "Out of Stock", "Discontinued"];

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
    if (!path) return "placeholder.jpg";
    if (typeof path === 'string') {
        if (path.startsWith("http")) return path;
        if (path.startsWith("blob:")) return path; // Handle local preview URLs
        if (path.startsWith("uploads/")) return `${BASE_URL}/${path}`;
        return `${BASE_URL}/uploads/products/${path.split('/').pop()}`;
    }
    return "placeholder.jpg";
  };

  const handleImageChange = (e) => {
    if (productImages.length >= 5) return;

    const files = Array.from(e.target.files).slice(0, 5 - productImages.length);
    if (!files.length) return;

    // Create local previews
    const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
    }));

    setProductImages((prev) => [...prev, ...newImages].slice(0, 5));
    e.target.value = null;
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
    
    // Validate Enums
    if (!COLORS.includes(color)) return "Invalid color selected.";
    if (!RAM_OPTIONS.includes(Number(ram))) return "Invalid RAM selected.";
    if (!STORAGE_OPTIONS.includes(Number(storage))) return "Invalid storage selected.";
    if (!STATUS_OPTIONS.includes(status)) return "Invalid status selected.";

    if (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) <= 0)
      return "Price must be a valid positive number.";
    if (!/^\d+$/.test(stock) || Number(stock) < 0)
      return "Stock must be a non-negative integer.";
    if (!productImages.length) return "Please upload at least one image.";
    return null;
  };

  // ------------------ ADD / UPDATE PRODUCT ------------------
  const resetForm = () => {
    setName("");
    setDescription("");
    setColor("Black");
    setRam("8");
    setStorage("128");
    setPrice("");
    setStock("");
    setProductImages([]);
    setEditProductId(null);
    setSelectedCategoryId("");
    setNewImageUrl("");
    setStatus("Available");
    onProductClose();
  };

  // ... (keeping submit logic same as partially replaced above)

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

    // Prepare metadata payload
    const productData = {
      name: name.trim(),
      description: description.trim(),
      category: selectedCategoryId,
      status: status,
      // Images will be handled separately for new products
      images: editProductId ? productImages.filter(img => typeof img === 'string' || img.url) : [], 
      variants: [
        {
          color: color,
          ram: Number(ram),
          storage: Number(storage),
          price: Number(price),
          stock: Number(stock),
          // Generate SKU: NAME_COLOR_RAM_STORAGE_TIMESTAMP
          sku: `${sanitizedName.substring(0, 4)}_${color.toUpperCase()}_${ram}G_${storage}G_${new Date().getTime() % 10000}`,
          emiEligible: false 
        },
      ],
    };

    try {
      let productId = editProductId;

      if (editProductId) {
        // UPDATE EXISTING PRODUCT
        await axiosInstance.put(
          `/products/update/${editProductId}`,
          productData
        );
        toast({ title: "Product Updated 🎉", description: `Product "${name}" has been updated.`, status: "success" });
      } else {
        // CREATE NEW PRODUCT
        const res = await axiosInstance.post(
          `/products/create`,
          productData
        );
        productId = res.data.data._id;
        toast({ title: "Product Created", description: `Product "${name}" created. Uploading images...`, status: "info" });
      }

      // UPLOAD IMAGES
      // Filter for new file objects (they have a 'file' property)
      const filesToUpload = productImages.filter(img => img.file);
      
      if (filesToUpload.length > 0 && productId) {
          const uploadPromises = filesToUpload.map((imgObj) => {
            const formData = new FormData();
            formData.append("file", imgObj.file);
            formData.append("productId", productId); // Backend requires this!

            return axiosInstance.post(`/products/upload`, formData);
          });

          await Promise.all(uploadPromises);
          toast({ title: "Images Uploaded 📸", description: "All images linked successfully.", status: "success" });
      }

      await fetchProducts(); 
      resetForm();
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
    // Don't call resetForm() here as it closes the modal in my implementation above! 
    // Actually resetForm closes values but we want to OPEN.
    // Let's just set values directly.
    
    setName(product.name);
    setDescription(product.description || "");
    setStatus(product.status || "Available");

    const variant = product.variants?.[0];
    if (variant) {
      setColor(variant.color || "Black");
      setRam(String(variant.ram || "8"));
      setStorage(String(variant.storage || "128"));
      setPrice(String(variant.price || ""));
      setStock(String(variant.stock || "0"));
    } else {
        // Default values if no variant found
        setColor("Black");
        setRam("8");
        setStorage("128");
        setPrice("");
        setStock("");
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
          color="#0ea5e9" // ElectroMart Blue
          mb={{ base: "3", md: "0" }} // Margin below text on mobile
        >
          Inventory Management
        </Text>
        <Button
          p="4"
          colorScheme="blue" // Updated to match ElectroMart
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
                  <FormControl isRequired>
                      <FormLabel>Product Status</FormLabel>
                      <Select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          size="lg"
                      >
                          {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                          ))}
                      </Select>
                  </FormControl>

                  <Text fontSize="xl" fontWeight="semibold" color="#0ea5e9" mt="4">Variant Details</Text>
                  <Divider />

                  <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} gap="4">
                    <FormControl isRequired>
                        <FormLabel>Color</FormLabel>
                        <Select value={color} onChange={(e) => setColor(e.target.value)}>
                            {COLORS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel>RAM (GB)</FormLabel>
                        <Select value={ram} onChange={(e) => setRam(e.target.value)}>
                            {RAM_OPTIONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel>Storage (GB)</FormLabel>
                        <Select value={storage} onChange={(e) => setStorage(e.target.value)}>
                            {STORAGE_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </Select>
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

                  <FormControl isRequired>
                      <FormLabel>Price (₹)</FormLabel>
                      <Input
                        placeholder="1299.00"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                  </FormControl>
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