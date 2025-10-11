import {
    Box,
    Button,
    Flex,
    Input,
    Text,
    Textarea,
    Grid,
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
    HStack,
    Spinner,
    Alert,
    AlertIcon,
    Divider,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import React, { useState, useEffect } from "react";
import axiosInstance, { adminAxiosInstance } from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

// Base URL for images now includes the '/api' prefix
const IMAGE_BASE_URL = "https://boutique-ecommerce-1.onrender.com/api";

function AddProductForm() {
    // --- STATE MANAGEMENT ---
    const [size, setSize] = useState("");
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [editProductId, setEditProductId] = useState(null);
    const [productImages, setProductImages] = useState([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [status, setStatus] = useState("active");

    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);

    // --- ROLE STATE (Used for conditional rendering and function checks) ---
    const [userRole, setUserRole] = useState(null); 

    // Category Modal State
    const [categoryName, setCategoryName] = useState("");
    const {
        isOpen: isProductOpen,
        onOpen: onProductOpen,
        onClose: onProductClose,
    } = useDisclosure();

    const categoryModalDisclosure = useDisclosure();
    const {
        isOpen: isCategoryOpen,
        onOpen: onCategoryOpen,
        onClose: onCategoryClose
    } = categoryModalDisclosure;

    // --- HOOKS ---
    const toast = useToast();
    const navigate = useNavigate();
    const bgCard = useColorModeValue("white", "gray.700");

    // --- ACCESS CHECK HELPER ---
    // This checks the userRole state against the required roles.
    const isAllowed = (requiredRoles) => {
        const normalizedRole = userRole?.toLowerCase() || ""; 
        return requiredRoles.includes(normalizedRole);
    };
    
    // ------------------ DATA FETCH ------------------

    const fetchData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                // adminAxiosInstance automatically includes the adminToken
                adminAxiosInstance.get("/api/products/all"),
                adminAxiosInstance.get("/api/categories/all"),
            ]);
            setProducts(productsRes.data.data || []);
            setCategories(categoriesRes.data.data || []);
        } catch (err) {
            console.error("Fetch Data Error:", err);
            toast({
                title: "Load Error",
                description: "Failed to load products/categories.",
                status: "error",
            });
        } finally {
            setIsDataLoading(false);
        }
    };

    // ------------------ INITIAL AUTHORIZATION CHECK ------------------
    useEffect(() => {
        // Read token and role from localStorage
        const token = localStorage.getItem("adminToken");
        const role = localStorage.getItem("userRole");
        
        const normalizedRole = role?.toLowerCase().replace(/\s/g, '') || null;
        
        // Critical: Redirect if no token or role is not admin/superadmin
        if (!token || (normalizedRole !== "admin" && normalizedRole !== "superadmin")) {
            toast({ title: "Auth Required", description: "Please login as Admin.", status: "error" });
            navigate("/admin/login");
            return; 
        }

        setUserRole(normalizedRole);

        fetchData();
    }, [navigate, toast]); 

    // ------------------ HANDLERS ------------------

    const getFullImageUrl = (path) => {
        if (path?.startsWith("http")) return path;
        // Using the corrected IMAGE_BASE_URL
        if (path?.startsWith("uploads/")) return `${IMAGE_BASE_URL}/${path}`;
        return "https://via.placeholder.com/150?text=No+Image"; 
    };

    const handleImageChange = async (e) => {
        if (!isAllowed(["admin", "superadmin"])) {
            toast({ title: "Unauthorized", description: "You don't have permission to upload images.", status: "error" });
            e.target.value = null;
            return;
        }

        if (isLoading || productImages.length >= 5) return;
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            // API call uses adminAxiosInstance
            const res = await adminAxiosInstance.post(`/api/products/upload`, formData);
            const uploadedUrl = res.data.data?.imageUrl;

            if (!uploadedUrl) {
                toast({ title: "Upload Failed", status: "warning" });
                return;
            }

            setProductImages((prev) => [uploadedUrl, ...prev].slice(0, 5));
            toast({ title: "Upload Successful ✅", status: "success" });
        } catch (err) {
            console.error("Failed to upload image", err);
            toast({ title: "Upload Error", description: "Image upload failed." });
        } finally {
            setIsLoading(false);
            e.target.value = null;
        }
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setSize("");
        setPrice("");
        setStock("");
        setProductImages([]);
        setEditProductId(null);
        setSelectedCategoryId("");
        setStatus("active");
        onProductClose();
    };

    const validateProductFields = () => {
        if (!selectedCategoryId) return "Select a category.";
        if (!name || name.length < 3) return "Name must be at least 3 chars.";
        if (!size) return "Select a size variant.";
        if (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) <= 0)
            return "Price must be a positive number.";
        if (!/^\d+$/.test(stock) || Number(stock) < 0)
            return "Stock must be a non-negative integer.";
        if (!productImages.length) return "Upload at least one image.";
        return null;
    };

    const handleSubmitProduct = async () => {
        // Authorization check
        if (!isAllowed(["admin", "superadmin"])) { 
            toast({ title: "Unauthorized", description: "You don't have permission to modify products.", status: "error" });
            return;
        }

        if (isLoading) return;
        const error = validateProductFields();
        if (error) {
            toast({ title: "Error", description: error, status: "error" });
            return;
        }

        setIsLoading(true);
        const productData = {
            name: name.trim(),
            description: description.trim(),
            category: selectedCategoryId,
            images: productImages,
            status: status,
            variants: [
                {
                    size,
                    price: Number(price),
                    stock: Number(stock),
                    sku: `${name.substring(0, 4).toUpperCase()}_${size}_${Math.floor(
                        Math.random() * 9000
                    )}`,
                },
            ],
        };

        try {
            if (editProductId) {
                // API call uses adminAxiosInstance
                await adminAxiosInstance.put(`/api/products/update/${editProductId}`, productData);
                toast({ title: "Product Updated 🎉", status: "success" });
            } else {
                // API call uses adminAxiosInstance
                await adminAxiosInstance.post(`/api/products/create`, productData);
                toast({ title: "Product Added 🚀", status: "success" });
            }
            await fetchData();
        } catch (err) {
            console.error("Failed to submit product", err);
            toast({ title: "Submission Error", status: "error" });
        } finally {
            setIsLoading(false);
            resetForm();
        }
    };

    const handleSubmitCategory = async () => {
        // Authorization check
        if (!isAllowed(["admin", "superadmin"])) { 
            toast({ title: "Unauthorized", description: "You don't have permission to add categories.", status: "error" });
            return;
        }

        if (isLoading || !categoryName) return;

        setIsLoading(true);
        try {
            // API call uses adminAxiosInstance
            await adminAxiosInstance.post(`/api/categories/create`, { name: categoryName });
            await fetchData();
            toast({ title: "Category Added ✨", status: "success" });
        } catch (err) {
            toast({ title: "Category Error", status: "error" });
        } finally {
            setIsLoading(false);
            setCategoryName("");
            onCategoryClose();
        }
    };

    const handleEditProduct = (product) => {
        // Authorization check
        if (!isAllowed(["admin", "superadmin"])) { 
            toast({ title: "Unauthorized", description: "You don't have permission to edit products.", status: "error" });
            return;
        }

        resetForm();
        setName(product.name);
        setDescription(product.description);
        setStatus(product.status || "active");
        const variant = product.variants?.[0];
        if (variant) {
            setSize(variant.size);
            setPrice(String(variant.price || ""));
            setStock(String(variant.stock || ""));
        }
        setProductImages(product.images || []);
        setSelectedCategoryId(product.category?._id || product.category);
        setEditProductId(product._id);
        onProductOpen();
    };

    const handleDeleteProduct = async (productId, productName) => {
        // Authorization check
        if (!isAllowed(["admin", "superadmin"])) { 
            toast({ title: "Unauthorized", description: "You don't have permission to delete products.", status: "error" });
            return;
        }

        if (isLoading) return;
        if (!window.confirm(`Are you sure you want to delete ${productName}?`)) return;

        setIsLoading(true);
        try {
            // API call uses adminAxiosInstance
            await adminAxiosInstance.delete(`/api/products/delete/${productId}`);
            await fetchData();
            toast({ title: "Product Deleted 🗑️", status: "info" });
        } catch (err) {
            toast({ title: "Deletion Error", status: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleIncreaseStock = async (productId, currentStock, variantIndex = 0) => {
        // Authorization check
        if (!isAllowed(["admin", "superadmin"])) {
            toast({ title: "Unauthorized", description: "You don't have permission to modify stock.", status: "error" });
            return;
        }

        const increaseAmount = 5; 

        if (isLoading) return;

        if (!window.confirm(`Add ${increaseAmount} units to stock for this product? Current: ${currentStock}`)) return;

        setIsLoading(true);
        try {
            // API call uses adminAxiosInstance
            await adminAxiosInstance.put(`/api/products/stock/increase`, { 
                productId: productId, 
                variantIndex: variantIndex, 
                increaseBy: increaseAmount
            });
            await fetchData();
            toast({ title: "Stock Increased 📈", status: "success" });
        } catch (err) {
            console.error("Stock Increase Error:", err);
            toast({ title: "Stock Error", description: "Failed to increase stock.", status: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------ EARLY RETURN FOR LOADING STATES ------------------
    if (isDataLoading) {
        return (
            <Flex h="100vh" justify="center" align="center">
                <Spinner size="xl" color="teal.500" />
                <Text ml="4">Loading Inventory...</Text>
            </Flex>
        );
    }

    // ------------------ RENDER LOGIC ------------------

    const renderProductItem = (p) => {
        const variant = p.variants?.[0];
        const stockBadge =
            variant?.stock === 0 ? "red" : variant?.stock <= 5 ? "orange" : "green";

        const isAdmin = isAllowed(["admin", "superadmin"]);

        return (
            <Box
                key={p._id}
                bg={bgCard}
                p="4"
                borderRadius="xl"
                shadow="lg"
                transition="all 0.3s"
                _hover={{ shadow: "2xl" }}
            >
                <Stack spacing="3">
                    <Flex justify="space-between" align="start">
                        <Text fontWeight="extrabold" fontSize="lg" noOfLines={1}>
                            {p.name}
                        </Text>
                        <Badge colorScheme="purple" textTransform="capitalize">
                            {p.category?.name || "N/A"}
                        </Badge>
                    </Flex>
                    <Box h="150px" bg="gray.100" borderRadius="md" overflow="hidden">
                        <img
                            src={getFullImageUrl(p.images?.[0])}
                            alt={p.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </Box>
                    <HStack justify="space-between">
                        <Text fontWeight="bold" color="teal.600">
                            ₹{Number(variant?.price || 0).toFixed(2)}
                        </Text>
                        <Badge colorScheme={stockBadge}>Stock: {variant?.stock || 0}</Badge>
                    </HStack>

                    {/* Only show management buttons if user is admin or superadmin */}
                    {isAdmin && (
                        <Stack>
                            <HStack>
                                <Button
                                    size="sm"
                                    colorScheme="blue"
                                    onClick={() => handleEditProduct(p)}
                                    flex="1"
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    colorScheme="green"
                                    onClick={() => handleIncreaseStock(p._id, variant?.stock || 0)}
                                    flex="1"
                                    isLoading={isLoading}
                                    isDisabled={isLoading}
                                >
                                    + Stock (5)
                                </Button>
                            </HStack>
                            <Button
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleDeleteProduct(p._id, p.name)}
                                isDisabled={isLoading}
                            >
                                Delete Product
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Box>
        );
    };

    return (
        <Box p="4">
            {/* HEADER */}
            <Flex justify="space-between" align="center" mb="6">
                <Text fontSize="2xl" fontWeight="bold">
                    🛍️ Product Management
                </Text>
                <Button
                    colorScheme="teal"
                    leftIcon={<AddIcon />}
                    onClick={onProductOpen}
                    // Disable button if not authorized
                    isDisabled={isLoading || !isAllowed(["admin", "superadmin"])} 
                >
                    Add Product
                </Button>
            </Flex>

            {/* Display Role Information */}
            <Alert status="info" mb="6" borderRadius="md">
                <AlertIcon />
                Your current role is: **{userRole?.toUpperCase() || "USER"}**. Product modification requires **ADMIN** or **SUPERADMIN** access.
            </Alert>

            <Divider mb="6" />

            {/* PRODUCTS GRID (Simplified) */}
            <Text fontSize="xl" fontWeight="semibold" mb="4">
                Current Inventory
            </Text>
            <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap="6">
                {products.length === 0 ? (
                    <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        No products found.
                    </Alert>
                ) : (
                    products.map(renderProductItem)
                )}
            </Grid>

            {/* ---------------- PRODUCT MODAL ---------------- */}
            <Modal
                isOpen={isProductOpen}
                onClose={resetForm}
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {editProductId ? "Edit Product" : "Add New Product"}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb="6">
                        <Stack spacing="4">
                            <FormControl isRequired>
                                <FormLabel>Name</FormLabel>
                                <Input value={name} onChange={(e) => setName(e.target.value)} />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                />
                            </FormControl>

                            <HStack>
                                <FormControl isRequired>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        placeholder="Select"
                                        value={selectedCategoryId}
                                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    >
                                        {categories.map((c) => (
                                            <option key={c._id} value={c._id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button
                                    mt="8"
                                    colorScheme="blue"
                                    onClick={onCategoryOpen}
                                    leftIcon={<AddIcon />}
                                    flexShrink={0}
                                    // Disable button if not authorized
                                    isDisabled={!isAllowed(["admin", "superadmin"])}
                                >
                                    New
                                </Button>
                            </HStack>

                            <FormControl isRequired>
                                <FormLabel>Size Variant (Select One)</FormLabel>
                                <HStack wrap="wrap">
                                    {["S", "M", "L", "XL"].map((s) => (
                                        <Button
                                            key={s}
                                            size="sm"
                                            colorScheme={size === s ? "teal" : "gray"}
                                            onClick={() => setSize(s)}
                                        >
                                            {s}
                                        </Button>
                                    ))}
                                </HStack>
                            </FormControl>

                            <HStack>
                                <FormControl isRequired>
                                    <FormLabel>Price (₹)</FormLabel>
                                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel>Stock</FormLabel>
                                    <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
                                </FormControl>
                            </HStack>

                            {editProductId && (
                                <FormControl>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </Select>
                                </FormControl>
                            )}

                            {/* SIMPLIFIED Image Upload */}
                            <FormControl isRequired>
                                <FormLabel>Image Upload ({productImages.length}/5)</FormLabel>
                                <Input
                                    type="file"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    p="1"
                                    // Disable if loading, max images reached, or not authorized
                                    disabled={isLoading || productImages.length >= 5 || !isAllowed(["admin", "superadmin"])}
                                />
                                {productImages.length > 0 && (
                                    <Flex wrap="wrap" mt="3" gap="2">
                                        {productImages.map((img, idx) => (
                                            <Badge
                                                key={idx}
                                                colorScheme={idx === 0 ? "teal" : "gray"}
                                                variant="solid"
                                            >
                                                {idx === 0 ? "Primary" : `Img ${idx + 1}`}
                                            </Badge>
                                        ))}
                                    </Flex>
                                )}
                            </FormControl>
                        </Stack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={resetForm}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="teal"
                            onClick={handleSubmitProduct}
                            isLoading={isLoading}
                            // Disable button if not authorized
                            isDisabled={!isAllowed(["admin", "superadmin"])}
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
                    <ModalBody>
                        <FormControl isRequired>
                            <FormLabel>Category Name</FormLabel>
                            <Input
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                            />
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onCategoryClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleSubmitCategory}
                            isLoading={isLoading}
                            // Disable button if not authorized
                            isDisabled={!isAllowed(["admin", "superadmin"])}
                        >
                            Add Category
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default AddProductForm;