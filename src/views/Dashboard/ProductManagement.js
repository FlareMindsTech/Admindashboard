//ProductManagement
// Chakra imports
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllCategories,
  createCategories,
  getAllProducts,
  createProducts,
  updateCategories,
  deleteCategory,
  updateProducts,
  deleteProducts,
  uploadProductImage,
  deleteProductImage,
  getAllOrders,
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
  Badge,
  Heading,
  Text,
  useToast,
  Icon,
  Button,
  IconButton,
  Box,
  Input,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select,
  Image,
  Textarea,
  Spinner,
  Center,
  SimpleGrid,
} from "@chakra-ui/react";

// Import ApexCharts
import ReactApexChart from 'react-apexcharts';

// Import your custom Card components
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";

import {
  FaUsers,
  FaArrowLeft,
  FaEye,
  FaEdit,
  FaPlusCircle,
  FaTrash,
  FaSearch,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaChartLine,
} from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdCategory, MdInventory, MdWarning } from "react-icons/md";

export default function ProductManagement() {
  const textColor = useColorModeValue("gray.700", "white");
  const toast = useToast();
  const navigate = useNavigate();

  // Custom color theme
  const customColor = "#7b2cbf";
  const customHoverColor = "#5a189a";

  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentView, setCurrentView] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewModalType, setViewModalType] = useState("");
  
  // Loading states
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const initialCategory = { name: "", description: "" };
  const initialProduct = {
    name: "",
    price: "",
    stock: "",
    color: "",
    size: "",
    description: "",
    images: [],
  };

  const [newCategory, setNewCategory] = useState(initialCategory);
  const [newProduct, setNewProduct] = useState(initialProduct);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // Filtered data
  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(categorySearch.toLowerCase()) ||
    cat.description?.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredProducts = products.filter(
    (prod) =>
      prod.name?.toLowerCase().includes(productSearch.toLowerCase()) &&
      (productCategoryFilter ? 
        (prod.category?._id === productCategoryFilter || prod.category === productCategoryFilter) 
        : true)
  );

  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  
  const totalCategoryPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Function to calculate available stock for a product
  const calculateAvailableStock = useCallback((product) => {
    if (!product || !orders.length) {
      return product?.stock || product?.variants?.[0]?.stock || 0;
    }

    const totalOrderedQuantity = orders.reduce((total, order) => {
      const validStatus = order.status && 
        (order.status.toLowerCase() === 'confirmed' || 
         order.status.toLowerCase() === 'completed' || 
         order.status.toLowerCase() === 'delivered' ||
         order.status.toLowerCase() === 'pending');

      if (!validStatus) return total;

      let orderedQty = 0;
      const items = order.items || order.orderItems || order.products || order.orderProducts || [];
      
      items.forEach(item => {
        const itemProductId = item.productId?._id || item.productId || item.product?._id || item.product;
        const itemName = item.name || item.productId?.name || item.product?.name;
        
        if (itemProductId === product._id || itemName === product.name) {
          orderedQty += item.quantity || item.qty || 0;
        }
      });

      return total + orderedQty;
    }, 0);

    const totalStock = product.stock || product.variants?.[0]?.stock || 0;
    const availableStock = Math.max(0, totalStock - totalOrderedQuantity);

    return availableStock;
  }, [orders]);

  // Function to get low stock products
  const getLowStockProducts = useCallback(() => {
    return products.filter(product => {
      const availableStock = calculateAvailableStock(product);
      return availableStock <= 10 && availableStock > 0;
    });
  }, [products, calculateAvailableStock]);

  // Function to get out of stock products
  const getOutOfStockProducts = useCallback(() => {
    return products.filter(product => {
      const availableStock = calculateAvailableStock(product);
      return availableStock <= 0;
    });
  }, [products, calculateAvailableStock]);

  // Function to get in stock products
  const getInStockProducts = useCallback(() => {
    return products.filter(product => {
      const availableStock = calculateAvailableStock(product);
      return availableStock > 10;
    });
  }, [products, calculateAvailableStock]);

  // Calculate total available stock across all products
  const calculateTotalAvailableStock = useCallback(() => {
    return products.reduce((total, product) => {
      return total + calculateAvailableStock(product);
    }, 0);
  }, [products, calculateAvailableStock]);

  // Prepare stock chart data
  const prepareStockChartData = useCallback(() => {
    const stockProducts = [...products]
      .filter(product => {
        const availableStock = calculateAvailableStock(product);
        return availableStock > 0; // Only show products with available stock
      })
      .sort((a, b) => {
        const stockA = calculateAvailableStock(a);
        const stockB = calculateAvailableStock(b);
        return stockB - stockA; // Sort by available stock descending
      })
      .slice(0, 10); // Show top 10 products

    const categories = stockProducts.map(product => 
      product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name
    );
    
    const availableStockData = stockProducts.map(product => calculateAvailableStock(product));
    const totalStockData = stockProducts.map(product => product.stock || product.variants?.[0]?.stock || 0);

    return {
      series: [
        {
          name: 'Available Stock',
          data: availableStockData,
          color: customColor
        },
        {
          name: 'Total Stock',
          data: totalStockData,
          color: '#4CAF50'
        }
      ],
      options: {
        chart: {
          type: 'line',
          height: 350,
          toolbar: {
            show: true
          }
        },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        markers: {
          size: 5
        },
        xaxis: {
          categories: categories,
          labels: {
            style: {
              colors: textColor,
              fontSize: '12px'
            },
            rotate: -45
          }
        },
        yaxis: {
          title: {
            text: 'Stock Quantity',
            style: {
              color: textColor
            }
          },
          labels: {
            style: {
              colors: textColor
            }
          }
        },
        title: {
          text: 'Available vs Total Stock by Product',
          align: 'center',
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: textColor
          }
        },
        legend: {
          position: 'top',
          horizontalAlign: 'center',
          labels: {
            colors: textColor
          }
        },
        grid: {
          borderColor: useColorModeValue('#e0e0e0', '#424242')
        },
        tooltip: {
          theme: useColorModeValue('light', 'dark')
        }
      }
    };
  }, [products, calculateAvailableStock, textColor]);

  // Prepare stock alert chart data
  const prepareStockAlertChartData = useCallback(() => {
    const alertProducts = [...getOutOfStockProducts(), ...getLowStockProducts()]
      .slice(0, 10); // Show top 10 alert products

    const categories = alertProducts.map(product => 
      product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name
    );
    
    const availableStockData = alertProducts.map(product => calculateAvailableStock(product));
    const totalStockData = alertProducts.map(product => product.stock || product.variants?.[0]?.stock || 0);

    return {
      series: [
        {
          name: 'Available Stock',
          data: availableStockData,
          color: '#FF6B6B'
        },
        {
          name: 'Total Stock',
          data: totalStockData,
          color: '#4CAF50'
        }
      ],
      options: {
        chart: {
          type: 'line',
          height: 350,
          toolbar: {
            show: true
          }
        },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        markers: {
          size: 5
        },
        xaxis: {
          categories: categories,
          labels: {
            style: {
              colors: textColor,
              fontSize: '12px'
            },
            rotate: -45
          }
        },
        yaxis: {
          title: {
            text: 'Stock Quantity',
            style: {
              color: textColor
            }
          },
          labels: {
            style: {
              colors: textColor
            }
          }
        },
        title: {
          text: 'Stock Alerts - Low and Out of Stock Products',
          align: 'center',
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: textColor
          }
        },
        legend: {
          position: 'top',
          horizontalAlign: 'center',
          labels: {
            colors: textColor
          }
        },
        grid: {
          borderColor: useColorModeValue('#e0e0e0', '#424242')
        },
        tooltip: {
          theme: useColorModeValue('light', 'dark')
        }
      }
    };
  }, [getOutOfStockProducts, getLowStockProducts, calculateAvailableStock, textColor]);

  // Search handler functions
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (currentView === "categories") {
      setCategorySearch(value);
    } else if (currentView === "products") {
      setProductSearch(value);
    }
    
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCategorySearch("");
    setProductSearch("");
    setCurrentPage(1);
  };

  // Image upload handler
  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsSubmitting(true);
      
      if (selectedProduct) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const result = await uploadProductImage(selectedProduct._id, file);
          
          if (result.data && result.data.images) {
            setNewProduct(prev => ({
              ...prev,
              images: result.data.images
            }));
          }
        }
        toast({
          title: "Images Uploaded",
          description: "Product images uploaded successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        const newImages = Array.from(files).map(file => ({
          file: file,
          preview: URL.createObjectURL(file),
          isNew: true
        }));
        
        setNewProduct(prev => ({
          ...prev,
          images: [...(prev.images || []), ...newImages]
        }));
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload images",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      event.target.value = "";
    }
  };

  // Image removal handler
  const handleRemoveImage = async (publicIdOrIndex) => {
    try {
      if (selectedProduct && typeof publicIdOrIndex === 'string') {
        await deleteProductImage(selectedProduct._id, publicIdOrIndex);
        
        setNewProduct(prev => ({
          ...prev,
          images: prev.images.filter(img => img.public_id !== publicIdOrIndex)
        }));
        
        toast({
          title: "Image Removed",
          description: "Image deleted successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        setNewProduct(prev => ({
          ...prev,
          images: prev.images.filter((_, index) => index !== publicIdOrIndex)
        }));
      }
    } catch (error) {
      toast({
        title: "Delete Error",
        description: error.message || "Failed to delete image",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (currentView === "categories" && currentPage < totalCategoryPages) {
      setCurrentPage(currentPage + 1);
    } else if (currentView === "products" && currentPage < totalProductPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // View handlers for category and product
  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setViewModalType("category");
    setIsViewModalOpen(true);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setViewModalType("product");
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedCategory(null);
    setSelectedProduct(null);
    setViewModalType("");
  };

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

  // Fetch categories + products + orders
  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setIsLoadingCategories(true);
      setIsLoadingProducts(true);
      setIsLoadingOrders(true);

      const [categoryData, productData, ordersData] = await Promise.all([
        getAllCategories(),
        getAllProducts(),
        getAllOrders()
      ]);

      setCategories(categoryData.categories || categoryData.data || []);
      setProducts(productData.products || productData.data || []);
      
      let ordersArray = [];
      if (Array.isArray(ordersData)) {
        ordersArray = ordersData;
      } else if (ordersData && Array.isArray(ordersData.orders)) {
        ordersArray = ordersData.orders;
      } else if (ordersData && Array.isArray(ordersData.data)) {
        ordersArray = ordersData.data;
      } else {
        const maybeArray = Object.values(ordersData || {}).find((v) => Array.isArray(v));
        if (Array.isArray(maybeArray)) {
          ordersArray = maybeArray;
        }
      }
      setOrders(ordersArray);
      
    } catch (err) {
      toast({
        title: "Fetch Error",
        description: err.message || "Failed to load dashboard data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingData(false);
      setIsLoadingCategories(false);
      setIsLoadingProducts(false);
      setIsLoadingOrders(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  // Reset pagination when view changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
    setCategorySearch("");
    setProductSearch("");
  }, [currentView]);

  if (!currentUser) return null;

  const handleBack = () => {
    setCurrentView("categories");
    setSelectedCategory(null);
    setSelectedProduct(null);
    setNewCategory(initialCategory);
    setNewProduct(initialProduct);
  };

  // Reset form
  const handleResetCategory = () => setNewCategory(initialCategory);
  const handleResetProduct = () => setNewProduct(initialProduct);

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
        description: `"${data.category?.name || data.data?.name}" added successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchData();
      handleBack();
    } catch (err) {
      toast({
        title: "Error Creating Category",
        description: err.message || "Failed to create category",
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
        description: error.message || "Failed to update category",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (category) => {
    setItemToDelete(category);
    setDeleteType("category");
    setIsDeleteModalOpen(true);
  };

  // Delete Product Handler
  const handleDeleteProduct = async (product) => {
    setItemToDelete(product);
    setDeleteType("product");
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      
      if (deleteType === "category") {
        const productsInCategory = products.filter(
          p => p.category?._id === itemToDelete._id || p.category === itemToDelete._id
        );
        
        if (productsInCategory.length > 0) {
          toast({
            title: "Cannot Delete Category",
            description: `This category has ${productsInCategory.length} product(s). Please remove or reassign them first.`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        await deleteCategory(itemToDelete._id);
        toast({
          title: "Category Deleted",
          description: `"${itemToDelete.name}" has been deleted successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else if (deleteType === "product") {
        await deleteProducts(itemToDelete._id);
        toast({
          title: "Product Deleted",
          description: `"${itemToDelete.name}" has been deleted successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      await fetchData();
      closeDeleteModal();
    } catch (err) {
      toast({
        title: `Error Deleting ${deleteType === "category" ? "Category" : "Product"}`,
        description: err.message || `Failed to delete ${deleteType}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Close Delete Modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
    setDeleteType("");
    setIsDeleting(false);
  };

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
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        color: newProduct.color || "default",
        size: newProduct.size || "default",
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

      let response;
      if (selectedProduct) {
        response = await updateProducts(selectedProduct._id, productData);
        
        if (newProduct.images && newProduct.images.some(img => img.isNew)) {
          for (const img of newProduct.images) {
            if (img.isNew && img.file) {
              await uploadProductImage(selectedProduct._id, img.file);
            }
          }
        }
        
        toast({
          title: "Product Updated",
          description: `"${productData.name}" updated successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        response = await createProducts(productData);
        
        if (newProduct.images && newProduct.images.length > 0) {
          const createdProduct = response.data || response.product;
          for (const img of newProduct.images) {
            if (img.file) {
              await uploadProductImage(createdProduct._id, img.file);
            }
          }
        }
        
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
      console.error("Product submission error:", err);
      toast({
        title: selectedProduct ? "Error Updating Product" : "Error Creating Product",
        description: err.message || "Failed to save product",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Product handler
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setSelectedCategory(categories.find((c) => c._id === product.category?._id || c._id === product.category));
    
    const productImages = product.images || [];
    
    setNewProduct({
      name: product.name,
      price: product.variants?.[0]?.price || "",
      stock: product.variants?.[0]?.stock || "",
      color: product.variants?.[0]?.color || "",
      size: product.variants?.[0]?.size || "",
      description: product.description || "",
      images: productImages,
    });
    setCurrentView("addProduct");
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setNewCategory({ name: category.name, description: category.description || "" });
    setCurrentView("editCategory");
  };

  // Loading component for tables
  const TableLoader = ({ columns = 6 }) => (
    <Tr>
      <Td colSpan={columns} textAlign="center" py={4}>
        <Center>
          <Spinner size="md" color={customColor} mr={3} />
          <Text fontSize="sm">Loading data...</Text>
        </Center>
      </Td>
    </Tr>
  );

  // Custom IconBox component
  const IconBox = ({ children, ...rest }) => (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="12px"
      {...rest}
    >
      {children}
    </Box>
  );

  // Stock status badge component
  const StockStatusBadge = ({ product }) => {
    const availableStock = calculateAvailableStock(product);
    const totalStock = product.stock || product.variants?.[0]?.stock || 0;
    
    if (availableStock <= 0) {
      return (
        <Badge colorScheme="red" fontSize="xs" px={2} py={1}>
          <Flex align="center" gap={1}>
            <FaExclamationTriangle size={10} />
            Out of Stock
          </Flex>
        </Badge>
      );
    } else if (availableStock <= 10) {
      return (
        <Badge colorScheme="orange" fontSize="xs" px={2} py={1}>
          <Flex align="center" gap={1}>
            <MdWarning size={12} />
            Low Stock ({availableStock})
          </Flex>
        </Badge>
      );
    } else {
      return (
        <Badge colorScheme="green" fontSize="xs" px={2} py={1}>
          In Stock ({availableStock})
        </Badge>
      );
    }
  };

  // Global scrollbar styles for mobile
  const globalScrollbarStyles = {
    '&::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'transparent',
      borderRadius: '3px',
      transition: 'background 0.3s ease',
    },
    '&:hover::-webkit-scrollbar-thumb': {
      background: '#cbd5e1',
    },
    '&:hover::-webkit-scrollbar-thumb:hover': {
      background: '#94a3b8',
    },
  };

  // Prepare chart data
  const stockChartData = prepareStockChartData();
  const stockAlertChartData = prepareStockAlertChartData();

  // Render Form Views (Add/Edit Category/Product)
  if (currentView === "addCategory" || currentView === "editCategory" || currentView === "addProduct") {
    return (
      <Flex 
        flexDirection="column" 
        pt={{ base: "120px", md: "75px" }} 
        height="100vh" 
        overflow="hidden"
        css={globalScrollbarStyles}
      >
        <Card 
          bg="white" 
          shadow="xl" 
          height="100%" 
          display="flex" 
          flexDirection="column"
          overflow="hidden"
        >
          <CardHeader bg="white" flexShrink={0}>
            <Flex align="center" mb={4}>
              <Button
                variant="ghost"
                leftIcon={<FaArrowLeft />}
                onClick={handleBack}
                mr={4}
                color={customColor}
                _hover={{ bg: `${customColor}10` }}
                size="sm"
              >
                Back
              </Button>
              <Heading size="md" color="gray.700">
                {currentView === "addCategory" && "Add New Category"}
                {currentView === "editCategory" && "Edit Category"}
                {currentView === "addProduct" && (selectedProduct ? "Edit Product" : "Add New Product")}
              </Heading>
            </Flex>
          </CardHeader>
          <CardBody 
            bg="white" 
            flex="1" 
            overflow="auto"
            css={globalScrollbarStyles}
          >
            {/* Category Form */}
            {(currentView === "addCategory" || currentView === "editCategory") && (
              <Box p={4}>
                <FormControl mb="20px">
                  <FormLabel htmlFor="name" color="gray.700" fontSize="sm">Name *</FormLabel>
                  <Input
                    id="name"
                    placeholder="Enter category name"
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    value={newCategory.name}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                    size="sm"
                  />
                </FormControl>
                <FormControl mb="20px">
                  <FormLabel htmlFor="description" color="gray.700" fontSize="sm">Description</FormLabel>
                  <Textarea
                    id="description"
                    placeholder="Enter category description"
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    value={newCategory.description}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                    rows={2}
                    size="sm"
                  />
                </FormControl>
                <Flex justify="flex-end" mt={4} flexShrink={0}>
                  <Button 
                    variant="outline" 
                    mr={3} 
                    onClick={handleResetCategory}
                    border="1px"
                    borderColor="gray.300"
                    size="sm"
                  >
                    Reset
                  </Button>
                  <Button
                    bg={customColor}
                    _hover={{ bg: customHoverColor }}
                    color="white"
                    onClick={currentView === "addCategory" ? handleSubmitCategory : handleUpdateCategory}
                    isLoading={isSubmitting}
                    size="sm"
                  >
                    {currentView === "addCategory" ? "Create Category" : "Update Category"}
                  </Button>
                </Flex>
              </Box>
            )}

            {/* Product Form */}
            {currentView === "addProduct" && (
              <Box 
                flex="1" 
                display="flex" 
                flexDirection="column" 
                overflow="hidden"
                bg="transparent"
              >
                {/* Scrollable Form Container */}
                <Box
                  flex="1"
                  overflowY="auto"
                  overflowX="hidden"
                  css={globalScrollbarStyles}
                  pr={2}
                >
                  <Box p={4}>
                    {!selectedCategory && (
                      <FormControl mb="20px">
                        <FormLabel htmlFor="category" color="gray.700" fontSize="sm">Category *</FormLabel>
                        <Select
                          id="category"
                          placeholder="Select category"
                          value={selectedCategory?._id || ""}
                          onChange={(e) => {
                            const category = categories.find(c => c._id === e.target.value);
                            setSelectedCategory(category);
                          }}
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          size="sm"
                        >
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    <Grid templateColumns={["1fr", "1fr 1fr"]} gap={4} mb={4}>
                      <FormControl isRequired>
                        <FormLabel color="gray.700" fontSize="sm">Product Name *</FormLabel>
                        <Input
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          placeholder="Enter product name"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          size="sm"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel color="gray.700" fontSize="sm">Price *</FormLabel>
                        <Input
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          placeholder="Enter price"
                          min="0"
                          step="0.01"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          size="sm"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel color="gray.700" fontSize="sm">Stock *</FormLabel>
                        <Input
                          type="number"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                          placeholder="Enter stock quantity"
                          min="0"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          size="sm"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color="gray.700" fontSize="sm">Color</FormLabel>
                        <Select
                          value={newProduct.color}
                          onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          size="sm"
                        >
                          <option value="">Select Color</option>
                          <option value="Red">Red</option>
                          <option value="Blue">Blue</option>
                          <option value="Green">Green</option>
                          <option value="Black">Black</option>
                          <option value="White">White</option>
                          <option value="Yellow">Yellow</option>
                          <option value="Pink">Pink</option>
                          <option value="Gray">Gray</option>
                          <option value="Maroon">Maroon</option>
                          <option value="Purple">Purple</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel color="gray.700" fontSize="sm">Size</FormLabel>
                        <Select
                          value={newProduct.size}
                          onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          size="sm"
                        >
                          <option value="">Select Size</option>
                          <option value="XS">XS</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                        </Select>
                      </FormControl>
                    </Grid>

                    <FormControl mb="20px">
                      <FormLabel color="gray.700" fontSize="sm">Description</FormLabel>
                      <Textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        placeholder="Enter product description"
                        rows={3}
                        borderColor={`${customColor}50`}
                        _hover={{ borderColor: customColor }}
                        _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                        bg="white"
                        size="sm"
                      />
                    </FormControl>

                    {/* Image Upload Section */}
                    <FormControl mb="20px">
                      <FormLabel color="gray.700" fontSize="sm">Product Images</FormLabel>
                      
                      {/* Image Upload Input */}
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        borderColor={`${customColor}50`}
                        _hover={{ borderColor: customColor }}
                        _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                        bg="white"
                        size="sm"
                        mb={3}
                      />
                      <Text fontSize="xs" color="gray.500">
                        Upload product images (multiple images supported)
                      </Text>

                      {/* Display Current Images */}
                      {newProduct.images && newProduct.images.length > 0 && (
                        <Box mt={3}>
                          <Text fontSize="sm" color="gray.700" mb={2}>
                            Current Images:
                          </Text>
                          <Flex wrap="wrap" gap={3}>
                            {newProduct.images.map((img, index) => (
                              <Box 
                                key={img.public_id || index} 
                                position="relative" 
                                border="1px" 
                                borderColor="gray.200" 
                                borderRadius="md" 
                                p={1}
                              >
                                <Image
                                  src={img.url || img.preview || img}
                                  alt={`Product image ${index + 1}`}
                                  boxSize="50px"
                                  objectFit="cover"
                                  borderRadius="md"
                                />
                                <IconButton
                                  aria-label="Remove image"
                                  icon={<FaTrash />}
                                  size="xs"
                                  colorScheme="red"
                                  position="absolute"
                                  top={-1}
                                  right={-1}
                                  onClick={() => handleRemoveImage(img.public_id || index)}
                                />
                              </Box>
                            ))}
                          </Flex>
                        </Box>
                      )}
                    </FormControl>
                  </Box>
                </Box>

                {/* Fixed Footer with Buttons */}
                <Box 
                  flexShrink={0} 
                  p={4} 
                  borderTop="1px solid" 
                  borderColor={`${customColor}20`}
                  bg="transparent"
                >
                  <Flex justify="flex-end">
                    <Button 
                      variant="outline" 
                      mr={3} 
                      onClick={handleResetProduct}
                      border="1px"
                      borderColor="gray.300"
                      size="sm"
                    >
                      Reset
                    </Button>
                    <Button
                      bg={customColor}
                      _hover={{ bg: customHoverColor }}
                      color="white"
                      onClick={handleSubmitProduct}
                      isLoading={isSubmitting}
                      isDisabled={!selectedCategory}
                      size="sm"
                    >
                      {selectedProduct ? "Update Product" : "Create Product"}
                    </Button>
                  </Flex>
                </Box>
              </Box>
            )}
          </CardBody>
        </Card>
      </Flex>
    );
  }

  // Main Dashboard View with Fixed Layout
  return (
    <Flex 
      flexDirection="column" 
      pt={{ base: "120px", md: "45px" }} 
      height="100vh" 
      overflow="hidden"
      css={globalScrollbarStyles}
      
    >
      {/* Fixed Statistics Cards */}
      <Box
   flexShrink={0}
  p={{ base: 1, md: 4 }} 
  pb={0}
  mt={{ base: 0, md: 0 }}
>
  <Grid
    templateColumns={{ base: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }}
    gap={{ base: "10px", md: "15px" }} 
    mb={{ base: "15px", md: "20px" }}
  >
    {/* All Categories Card */}
    <Card
      minH={{ base: "65px", md: "75px" }} 
      cursor="pointer"
      onClick={() => setCurrentView("categories")}
      border={currentView === "categories" ? "2px solid" : "1px solid"}
      borderColor={currentView === "categories" ? customColor : `${customColor}30`}
      transition="all 0.2s ease-in-out"
      bg="white"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${customColor}15, transparent)`,
        opacity: 0,
        transition: "opacity 0.2s ease-in-out",
      }}
      _hover={{
        transform: { base: "none", md: "translateY(-2px)" }, 
        shadow: { base: "none", md: "lg" },
        _before: {
          opacity: 1,
        },
        borderColor: customColor,
      }}
    >
      <CardBody position="relative" zIndex={1} p={{ base: 2, md: 4 }}> {/* Reduced padding on mobile */}
        <Flex flexDirection="row" align="center" justify="center" w="100%">
          <Stat me="auto">
            <StatLabel
              fontSize={{ base: "2xs", md: "xs" }} 
              color="gray.600"
              fontWeight="bold"
              pb="1px"
            >
              All Categories
            </StatLabel>
            <Flex>
              <StatNumber fontSize={{ base: "sm", md: "md" }} color={textColor}> {/* Smaller font on mobile */}
                {isLoadingCategories ? <Spinner size="xs" /> : categories.length}
              </StatNumber>
            </Flex>
          </Stat>
          <IconBox 
            as="box" 
            h={{ base: "30px", md: "35px" }} 
            w={{ base: "30px", md: "35px" }} 
            bg={customColor}
            transition="all 0.2s ease-in-out"
          >
            <Icon
              as={MdCategory}
              h={{ base: "14px", md: "18px" }}
              w={{ base: "14px", md: "18px" }} 
              color="white"
            />
          </IconBox>
        </Flex>
      </CardBody>
    </Card>

    {/* All Products Card */}
    <Card
      minH={{ base: "65px", md: "75px" }}
      cursor="pointer"
      onClick={() => setCurrentView("products")}
      border={currentView === "products" ? "2px solid" : "1px solid"}
      borderColor={currentView === "products" ? customColor : `${customColor}30`}
      transition="all 0.2s ease-in-out"
      bg="white"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${customColor}15, transparent)`,
        opacity: 0,
        transition: "opacity 0.2s ease-in-out",
      }}
      _hover={{
        transform: { base: "none", md: "translateY(-2px)" }, 
        shadow: { base: "none", md: "lg" },
        _before: {
          opacity: 1,
        },
        borderColor: customColor,
      }}
    >
      <CardBody position="relative" zIndex={1} p={{ base: 2, md: 4 }}> 
        <Flex flexDirection="row" align="center" justify="center" w="100%">
          <Stat me="auto">
            <StatLabel
              fontSize={{ base: "2xs", md: "xs" }} 
              color="gray.600"
              fontWeight="bold"
              pb="1px"
            >
              All Products
            </StatLabel>
            <Flex>
              <StatNumber fontSize={{ base: "sm", md: "md" }} color={textColor}> 
                {isLoadingProducts ? <Spinner size="xs" /> : products.length}
              </StatNumber>
            </Flex>
          </Stat>
          <IconBox 
            as="box" 
            h={{ base: "30px", md: "35px" }} 
            w={{ base: "30px", md: "35px" }}
            bg={customColor}
            transition="all 0.2s ease-in-out"
          >
            <Icon
              as={IoCheckmarkDoneCircleSharp}
              h={{ base: "14px", md: "18px" }}
              w={{ base: "14px", md: "18px" }}
              color="white"
            />
          </IconBox>
        </Flex>
      </CardBody>
    </Card>

    {/* Available Stock Card */}
    <Card
      minH={{ base: "65px", md: "75px" }} // Reduced height on mobile
      cursor="pointer"
      onClick={() => setCurrentView("stockAnalysis")}
      border={currentView === "stockAnalysis" ? "2px solid" : "1px solid"}
      borderColor={currentView === "stockAnalysis" ? customColor : `${customColor}30`}
      transition="all 0.2s ease-in-out"
      bg="white"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${customColor}15, transparent)`,
        opacity: 0,
        transition: "opacity 0.2s ease-in-out",
      }}
      _hover={{
        transform: { base: "none", md: "translateY(-2px)" }, 
        shadow: { base: "none", md: "lg" },
        _before: {
          opacity: 1,
        },
        borderColor: customColor,
      }}
    >
      <CardBody position="relative" zIndex={1} p={{ base: 2, md: 4 }}>
        <Flex flexDirection="row" align="center" justify="center" w="100%">
          <Stat me="auto">
            <StatLabel
              fontSize={{ base: "2xs", md: "xs" }} 
              color="gray.600"
              fontWeight="bold"
              pb="1px"
            >
              Available Stock
            </StatLabel>
            <Flex>
              <StatNumber fontSize={{ base: "sm", md: "md" }} color={textColor}> 
                {isLoadingProducts || isLoadingOrders ? <Spinner size="xs" /> : 
                  calculateTotalAvailableStock().toLocaleString()
                }
              </StatNumber>
            </Flex>
            <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.500" mt={{ base: 0.5, md: 1 }}> 
              {getLowStockProducts().length} low stock
            </Text>
          </Stat>
          <IconBox 
            as="box" 
            h={{ base: "30px", md: "35px" }} 
            w={{ base: "30px", md: "35px" }} 
            bg={customColor}
            transition="all 0.2s ease-in-out"
          >
            <Icon
              as={FaChartLine}
              h={{ base: "14px", md: "18px" }} 
              w={{ base: "14px", md: "18px" }} 
              color="white"
            />
          </IconBox>
        </Flex>
      </CardBody>
    </Card>

    {/* Stock Alerts Card */}
    <Card
      minH={{ base: "65px", md: "75px" }}
      cursor="pointer"
      onClick={() => setCurrentView("stockAlerts")}
      border={currentView === "stockAlerts" ? "2px solid" : "1px solid"}
      borderColor={currentView === "stockAlerts" ? customColor : `${customColor}30`}
      transition="all 0.2s ease-in-out"
      bg="white"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${customColor}15, transparent)`,
        opacity: 0,
        transition: "opacity 0.2s ease-in-out",
      }}
      _hover={{
        transform: { base: "none", md: "translateY(-2px)" }, 
        shadow: { base: "none", md: "lg" },
        _before: {
          opacity: 1,
        },
        borderColor: customColor,
      }}
    >
      <CardBody position="relative" zIndex={1} p={{ base: 2, md: 4 }}> 
        <Flex flexDirection="row" align="center" justify="center" w="100%">
          <Stat me="auto">
            <StatLabel
              fontSize={{ base: "2xs", md: "xs" }} 
              color="gray.600"
              fontWeight="bold"
              pb="1px"
            >
              Stock Alerts
            </StatLabel>
            <Flex>
              <StatNumber fontSize={{ base: "sm", md: "md" }} color={textColor}> 
                {isLoadingProducts || isLoadingOrders ? <Spinner size="xs" /> : 
                  getOutOfStockProducts().length
                }
              </StatNumber>
            </Flex>
            <Text fontSize={{ base: "2xs", md: "xs" }} color="red.500" mt={{ base: 0.5, md: 1 }}> 
              {getOutOfStockProducts().length} out of stock
            </Text>
          </Stat>
          <IconBox 
            as="box" 
            h={{ base: "30px", md: "35px" }} 
            w={{ base: "30px", md: "35px" }} 
            bg="red.500"
            transition="all 0.2s ease-in-out"
          >
            <Icon
              as={FaExclamationTriangle}
              h={{ base: "12px", md: "14px" }} 
              w={{ base: "12px", md: "14px" }} 
              color="white"
            />
          </IconBox>
        </Flex>
      </CardBody>
    </Card>
  </Grid>
</Box>

      {/* Scrollable Table Container */}
      <Box 
        flex="1" 
        display="flex" 
        flexDirection="column" 
        p={4}
        pt={0}
        overflow="hidden"
      >
        <Card 
          shadow="lg" 
          bg="white" 
          display="flex" 
          flexDirection="column"
          height="100%"
          minH="0"
          overflow="hidden"
        >
          {/* Fixed Table Header */}
          <CardHeader 
            p="16px" 
            pb="12px"
            bg="white" 
            flexShrink={0}
            borderBottom="1px solid"
            borderColor={`${customColor}20`}
          >
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
              {/* Title */}
              <Heading size="sm" flexShrink={0} color="gray.700">
                {currentView === "categories" && "🏷️ Categories"}
                {currentView === "products" && "🛒 Products"}
                {currentView === "stockAnalysis" && "📊 Stock Analysis"}
                {currentView === "stockAlerts" && "⚠️ Stock Alerts"}
              </Heading>

              {/* Search Bar - Only show for categories and products */}
              {(currentView === "categories" || currentView === "products") && (
                <Flex align="center" flex="1" maxW="350px" minW="200px">
                  <Input
                    placeholder={
                      currentView === "categories" 
                        ? "Search categories..." 
                        : "Search products..."
                    }
                    value={searchTerm}
                    onChange={handleSearchChange}
                    size="sm"
                    mr={2}
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                    fontSize="sm"
                  />
                  <Icon as={FaSearch} color="gray.400" boxSize={3} />
                  {searchTerm && (
                    <Button 
                      size="sm" 
                      ml={2} 
                      onClick={handleClearSearch}
                      bg="white"
                      color={customColor}
                      border="1px"
                      borderColor={customColor}
                      _hover={{ bg: customColor, color: "white" }}
                      fontSize="xs"
                      px={2}
                    >
                      Clear
                    </Button>
                  )}
                </Flex>
              )}

              {/* Add Button - Only show for categories and products */}
              {(currentView === "categories" || currentView === "products") && (
                <Button
                  bg={customColor}
                  _hover={{ bg: customHoverColor }}
                  color="white"
                  onClick={() => {
                    if (currentView === "categories") {
                      setCurrentView("addCategory");
                    } else {
                      setSelectedCategory(null);
                      setSelectedProduct(null);
                      setNewProduct(initialProduct);
                      setCurrentView("addProduct");
                    }
                  }}
                  fontSize="sm"
                  borderRadius="6px"
                  flexShrink={0}
                  leftIcon={<FaPlusCircle />}
                  size="sm"
                  px={3}
                >
                  {currentView === "categories" ? "Add Category" : "Add Product"}
                </Button>
              )}
            </Flex>
          </CardHeader>
          
          {/* Scrollable Table Content Area */}
          <CardBody 
            bg="white" 
            flex="1" 
            display="flex" 
            flexDirection="column" 
            p={0} 
            overflow="hidden"
          >
            {isLoadingData ? (
              <Flex justify="center" align="center" py={6} flex="1">
                <Spinner size="lg" color={customColor} />
                <Text ml={3} fontSize="sm">Loading data...</Text>
              </Flex>
            ) : (
              <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
                {/* Categories Table */}
                {currentView === "categories" && (
                  <>
                    {/* Table Container */}
                    <Box 
                      flex="1"
                      display="flex"
                      flexDirection="column"
                      overflow="hidden"
                    >
                      {/* Scrollable Table Area */}
                      <Box
                        flex="1"
                        overflow="auto"
                        css={globalScrollbarStyles}
                      >
                        <Table variant="simple" size="md" bg="transparent">
                          {/* Fixed Header */}
                          <Thead>
                            <Tr>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                #
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Name
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Description
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Status
                              </Th>
                              
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Actions
                              </Th>
                            </Tr>
                          </Thead>

                          {/* Scrollable Body */}
                          <Tbody bg="transparent">
                            {currentCategories.length > 0 ? (
                              currentCategories.map((cat, idx) => (
                                <Tr 
                                  key={cat._id || idx}
                                  bg="transparent"
                                  _hover={{ bg: `${customColor}10` }}
                                  borderBottom="1px"
                                  borderColor={`${customColor}20`}
                                  height="60px"
                                >
                                  <Td borderColor={`${customColor}20`} fontSize="sm" py={3}>
                                    {indexOfFirstItem + idx + 1}
                                  </Td>
                                  <Td borderColor={`${customColor}20`} fontWeight="medium" fontSize="sm" py={3}>
                                    {cat.name}
                                  </Td>
                                  <Td borderColor={`${customColor}20`} fontSize="sm" py={3}>
                                    <Text noOfLines={1} maxW="200px">
                                      {cat.description || "-"}
                                    </Text>
                                  </Td>
                                  <Td borderColor={`${customColor}20`} fontSize="sm" py={3}>
                                    <Badge
                                      bg="#9d4edd"
                                      color="white"
                                      px={3}
                                      py={1}
                                      borderRadius="full"
                                      fontSize="sm"
                                      fontWeight="bold"
                                    >
                                      {cat.status || "Active"}
                                    </Badge>
                                  </Td>
                                 
                           
<Td borderColor={`${customColor}20`} fontSize="sm" py={3}>
  <Flex gap={2}>
    <IconButton
      aria-label="View category"
      icon={<FaEye />}
      bg="white"
      color="blue.500"
      border="1px"
      borderColor="blue.500"
      _hover={{ bg: "blue.500", color: "white" }}
      size="sm"
      onClick={() => handleViewCategory(cat)}
    />
    <IconButton
      aria-label="Edit category"
      icon={<FaEdit />}
      bg="white"
      color={customColor}
      border="1px"
      borderColor={customColor}
      _hover={{ bg: customColor, color: "white" }}
      size="sm"
      onClick={() => handleEditCategory(cat)}
    />
    {/* Add Delete Button for Categories */}
    <IconButton
      aria-label="Delete category"
      icon={<FaTrash />}
      bg="white"
      color="red.500"
      border="1px"
      borderColor="red.500"
      _hover={{ bg: "red.500", color: "white" }}
      size="sm"
      onClick={() => handleDeleteCategory(cat)}
    />
  </Flex>
</Td> </Tr>
                              ))
                            ) : (
                              <Tr>
                                <Td colSpan={6} textAlign="center" py={6}>
                                  <Text fontSize="sm">
                                    {categories.length === 0
                                      ? "No categories found."
                                      : categorySearch
                                      ? "No categories match your search."
                                      : "No categories available."}
                                  </Text>
                                </Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </Box>
                    </Box>

                    {/* Pagination Controls */}
                    {filteredCategories.length > 0 && (
                      <Box 
                        flexShrink={0}
                        p="16px"
                        borderTop="1px solid"
                        borderColor={`${customColor}20`}
                        bg="transparent"
                      >
                        <Flex
                          justify="flex-end"
                          align="center"
                          gap={3}
                        >
                          {/* Page Info */}
                          <Text fontSize="sm" color="gray.600" display={{ base: "none", sm: "block" }}>
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCategories.length)} of {filteredCategories.length} categories
                          </Text>

                          {/* Pagination Controls */}
                          <Flex align="center" gap={2}>
                            <Button
                              size="sm"
                              onClick={handlePrevPage}
                              isDisabled={currentPage === 1}
                              leftIcon={<FaChevronLeft />}
                              bg="white"
                              color={customColor}
                              border="1px"
                              borderColor={customColor}
                              _hover={{ bg: customColor, color: "white" }}
                              _disabled={{ 
                                opacity: 0.5, 
                                cursor: "not-allowed",
                                bg: "gray.100",
                                color: "gray.400",
                                borderColor: "gray.300"
                              }}
                            >
                              <Text display={{ base: "none", sm: "block" }}>Previous</Text>
                            </Button>

                            {/* Page Number Display */}
                            <Flex 
                              align="center" 
                              gap={2}
                              bg={`${customColor}10`}
                              px={3}
                              py={1}
                              borderRadius="6px"
                              minW="80px"
                              justify="center"
                            >
                              <Text fontSize="sm" fontWeight="bold" color={customColor}>
                                {currentPage}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                /
                              </Text>
                              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                                {totalCategoryPages}
                              </Text>
                            </Flex>

                            <Button
                              size="sm"
                              onClick={handleNextPage}
                              isDisabled={currentPage === totalCategoryPages}
                              rightIcon={<FaChevronRight />}
                              bg="white"
                              color={customColor}
                              border="1px"
                              borderColor={customColor}
                              _hover={{ bg: customColor, color: "white" }}
                              _disabled={{ 
                                opacity: 0.5, 
                                cursor: "not-allowed",
                                bg: "gray.100",
                                color: "gray.400",
                                borderColor: "gray.300"
                              }}
                            >
                              <Text display={{ base: "none", sm: "block" }}>Next</Text>
                            </Button>
                          </Flex>
                        </Flex>
                      </Box>
                    )}
                  </>
                )}

                {/* Products Table */}
                {currentView === "products" && (
                  <>
                    {/* Table Container */}
                    <Box 
                      flex="1"
                      display="flex"
                      flexDirection="column"
                      overflow="hidden"
                    >
                      {/* Scrollable Table Area */}
                      <Box
                        flex="1"
                        overflow="auto"
                        css={globalScrollbarStyles}
                      >
                        <Table variant="simple" size="md" bg="transparent">
                          {/* Fixed Header */}
                          <Thead>
                            <Tr>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                #
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Name
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Category
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Price
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Stock Status
                              </Th>
                              <Th 
                                color="gray.100" 
                                borderColor={`${customColor}30`}
                                position="sticky"
                                top={0}
                                bg={`${customColor}`}
                                zIndex={10}
                                fontWeight="bold"
                                fontSize="sm"
                                py={3}
                                borderBottom="2px solid"
                                borderBottomColor={`${customColor}50`}
                              >
                                Actions
                              </Th>
                            </Tr>
                          </Thead>

                          {/* Scrollable Body */}
                          <Tbody bg="transparent">
                            {currentProducts.length > 0 ? (
                              currentProducts.map((prod, idx) => {
                                const availableStock = calculateAvailableStock(prod);
                                const totalStock = prod.stock || prod.variants?.[0]?.stock || 0;
                                
                                return (
                                  <Tr 
                                    key={prod._id || idx}
                                    bg="transparent"
                                    _hover={{ bg: `${customColor}10` }}
                                    borderBottom="1px"
                                    borderColor={`${customColor}20`}
                                    height="60px"
                                  >
                                    <Td borderColor={`${customColor}20`} fontSize="sm" py={3}>
                                      {indexOfFirstItem + idx + 1}
                                    </Td>
                                    <Td borderColor={`${customColor}20`} fontWeight="medium" fontSize="sm" py={3}>
                                      <Text noOfLines={1} maxW="150px">
                                        {prod.name}
                                      </Text>
                                    </Td>
                                    <Td borderColor={`${customColor}20`} fontSize="sm" py={3}>
                                      <Text noOfLines={1} maxW="120px">
                                        {prod.category?.name || 
                                        categories.find(c => c._id === prod.category)?.name || 
                                        "N/A"}
                                      </Text>
                                    </Td>
                                    <Td borderColor={`${customColor}20`} fontSize="sm" py={3}>
                                      ₹{prod.price || prod.variants?.[0]?.price || "-"}
                                    </Td>
                                    <Td borderColor={`${customColor}20`} fontSize="sm" py={3}>
                                      <Flex direction="column" gap={1}>
                                        <StockStatusBadge product={prod} />
                                        <Text fontSize="xs" color="gray.500">
                                          Total: {totalStock} | Available: {availableStock}
                                        </Text>
                                      </Flex>
                                    </Td>
                                    <Td borderColor={`${customColor}20`} fontSize="sm" py={3}>
                                      <Flex gap={2}>
                                        <IconButton
                                          aria-label="View product"
                                          icon={<FaEye />}
                                          bg="white"
                                          color="blue.500"
                                          border="1px"
                                          borderColor="blue.500"
                                          _hover={{ bg: "blue.500", color: "white" }}
                                          size="sm"
                                          onClick={() => handleViewProduct(prod)}
                                        />
                                        <IconButton
                                          aria-label="Edit product"
                                          icon={<FaEdit />}
                                          bg="white"
                                          color={customColor}
                                          border="1px"
                                          borderColor={customColor}
                                          _hover={{ bg: customColor, color: "white" }}
                                          size="sm"
                                          onClick={() => handleEditProduct(prod)}
                                        />
                                
<IconButton
  aria-label="Delete product"
  icon={<FaTrash />}
  bg="white"
  color="red.500"
  border="1px"
  borderColor="red.500"
  _hover={{ bg: "red.500", color: "white" }}
  size="sm"
  onClick={() => handleDeleteProduct(prod)}
/>
                                      </Flex>
                                    </Td>
                                  </Tr>
                                );
                              })
                            ) : (
                              <Tr>
                                <Td colSpan={6} textAlign="center" py={6}>
                                  <Text fontSize="sm">
                                    {products.length === 0
                                      ? "No products found."
                                      : productSearch
                                      ? "No products match your search."
                                      : "No products available."}
                                  </Text>
                                </Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </Box>
                    </Box>

                    {/* Pagination Controls */}
                    {filteredProducts.length > 0 && (
                      <Box 
                        flexShrink={0}
                        p="16px"
                        borderTop="1px solid"
                        borderColor={`${customColor}20`}
                        bg="transparent"
                      >
                        <Flex
                          justify="flex-end"
                          align="center"
                          gap={3}
                        >
                          {/* Page Info */}
                          <Text fontSize="sm" color="gray.600" display={{ base: "none", sm: "block" }}>
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
                          </Text>

                          {/* Pagination Controls */}
                          <Flex align="center" gap={2}>
                            <Button
                              size="sm"
                              onClick={handlePrevPage}
                              isDisabled={currentPage === 1}
                              leftIcon={<FaChevronLeft />}
                              bg="white"
                              color={customColor}
                              border="1px"
                              borderColor={customColor}
                              _hover={{ bg: customColor, color: "white" }}
                              _disabled={{ 
                                opacity: 0.5, 
                                cursor: "not-allowed",
                                bg: "gray.100",
                                color: "gray.400",
                                borderColor: "gray.300"
                              }}
                            >
                              <Text display={{ base: "none", sm: "block" }}>Previous</Text>
                            </Button>

                            {/* Page Number Display */}
                            <Flex 
                              align="center" 
                              gap={2}
                              bg={`${customColor}10`}
                              px={3}
                              py={1}
                              borderRadius="6px"
                              minW="80px"
                              justify="center"
                            >
                              <Text fontSize="sm" fontWeight="bold" color={customColor}>
                                {currentPage}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                /
                              </Text>
                              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                                {totalProductPages}
                              </Text>
                            </Flex>

                            <Button
                              size="sm"
                              onClick={handleNextPage}
                              isDisabled={currentPage === totalProductPages}
                              rightIcon={<FaChevronRight />}
                              bg="white"
                              color={customColor}
                              border="1px"
                              borderColor={customColor}
                              _hover={{ bg: customColor, color: "white" }}
                              _disabled={{ 
                                opacity: 0.5, 
                                cursor: "not-allowed",
                                bg: "gray.100",
                                color: "gray.400",
                                borderColor: "gray.300"
                              }}
                            >
                              <Text display={{ base: "none", sm: "block" }}>Next</Text>
                            </Button>
                          </Flex>
                        </Flex>
                      </Box>
                    )}
                  </>
                )}

                {/* Stock Analysis View */}
                {currentView === "stockAnalysis" && (
                  <Box 
                    flex="1" 
                    display="flex" 
                    flexDirection="column" 
                    overflow="auto"
                    css={globalScrollbarStyles}
                    p={4}
                  >
                    

                    {/* Available vs Total Stock Chart */}
                    <Card bg="white" shadow="sm" p={4} mb={6}>
                      <Text fontWeight="bold" color="gray.700" mb={4}>
                        Available vs Total Stock (Top 10 Products)
                      </Text>
                      {stockChartData && (
                        <ReactApexChart
                          options={stockChartData.options}
                          series={stockChartData.series}
                          type="line"
                          height={350}
                        />
                      )}
                    </Card>
                  </Box>
                )}

                {/* Stock Alerts View */}
                {currentView === "stockAlerts" && (
                  <Box 
                    flex="1" 
                    display="flex" 
                    flexDirection="column" 
                    overflow="auto"
                    css={globalScrollbarStyles}
                    p={4}
                  >
                    

                    {/* Stock Alerts Chart */}
                    <Card bg="white" shadow="sm" p={4} mb={6}>
                      <Text fontWeight="bold" color="gray.700" mb={4}>
                        Stock Alerts - Low and Out of Stock Products
                      </Text>
                      {stockAlertChartData && (
                        <ReactApexChart
                          options={stockAlertChartData.options}
                          series={stockAlertChartData.series}
                          type="line"
                          height={350}
                        />
                      )}
                    </Card>
                  </Box>
                )}
              </Box>
            )}
          </CardBody>
        </Card>
      </Box>

      {/* View Modal for Category and Product Details */}
      <Modal isOpen={isViewModalOpen} onClose={closeModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="gray.700">
            {viewModalType === "category" ? "Category Details" : "Product Details"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {viewModalType === "category" && selectedCategory && (
              <SimpleGrid columns={1} spacing={4}>
                <Box>
                  <Text fontWeight="bold" color="gray.600" fontSize="sm">Name:</Text>
                  <Text fontSize="md" mt={1}>{selectedCategory.name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.600" fontSize="sm">Description:</Text>
                  <Text fontSize="md" mt={1}>{selectedCategory.description || "No description"}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.600" fontSize="sm">Status:</Text>
                  <Badge
                    bg="#9d4edd"
                    color="white"
                    px={2}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                    mt={1}
                  >
                    {selectedCategory.status || "Active"}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.600" fontSize="sm">Products in this category:</Text>
                  <Text fontSize="md" mt={1}>
                    {products.filter(p => p.category?._id === selectedCategory._id || p.category === selectedCategory._id).length} products
                  </Text>
                </Box>
              </SimpleGrid>
            )}

          {viewModalType === "product" && selectedProduct && (
  <Box
    bg={useColorModeValue("white", "gray.800")}
    borderRadius="xl"
    boxShadow="lg"
    p={5}
    w="100%"
    maxW="480px"
    mx="auto"
  >
    {/* Square Layout with Image and Details Side by Side */}
    <Flex gap={4} mb={4}>
      {/* Left Side - Image */}
      <Box
        w="140px"
        h="140px"
        borderRadius="lg"
        overflow="hidden"
        bg="gray.100"
        flexShrink={0}
      >
        <Image
          src={
            selectedProduct.images?.[0]?.url ||
            selectedProduct.images?.[0] ||
            "/placeholder.png"
          }
          alt="product"
          w="100%"
          h="100%"
          objectFit="cover"
        />
      </Box>

      {/* Right Side - Details Grid */}
      <Box flex="1">
        <Text fontSize="lg" fontWeight="bold" mb={1} noOfLines={2}>
          {selectedProduct.name}
        </Text>
        
        <SimpleGrid columns={2} spacing={2} mt={2}>
          <Box>
            <Text fontSize="xs" color="gray.500">Category</Text>
            <Text fontSize="sm" fontWeight="medium">
              {selectedProduct.category?.name || "N/A"}
            </Text>
          </Box>
          
          <Box>
            <Text fontSize="xs" color="gray.500">Price</Text>
            <Text fontSize="sm" fontWeight="bold" color="green.600">
              ₹{selectedProduct.price || selectedProduct.variants?.[0]?.price || "-"}
            </Text>
          </Box>
          
          <Box>
            <Text fontSize="xs" color="gray.500">Color</Text>
            <Text fontSize="sm">{selectedProduct.variants?.[0]?.color || "Default"}</Text>
          </Box>
          
          <Box>
            <Text fontSize="xs" color="gray.500">Size</Text>
            <Text fontSize="sm">{selectedProduct.variants?.[0]?.size || "Default"}</Text>
          </Box>
        </SimpleGrid>
      </Box>
    </Flex>

    {/* Stock Information in 2x2 Grid */}
    <Box mb={4}>
      <Text fontWeight="bold" color="gray.500" fontSize="sm" mb={2}>Stock Information</Text>
      <SimpleGrid columns={2} spacing={3}>
        <Box textAlign="center" bg={useColorModeValue("gray.50", "gray.700")} p={2} borderRadius="md">
          <Text fontSize="xs" color="gray.500">Total Stock</Text>
          <Text fontSize="lg" fontWeight="bold">
            {selectedProduct.stock || selectedProduct.variants?.[0]?.stock || 0}
          </Text>
        </Box>
        
        <Box textAlign="center" bg={useColorModeValue("gray.50", "gray.700")} p={2} borderRadius="md">
          <Text fontSize="xs" color="gray.500">Available</Text>
          <Text fontSize="lg" fontWeight="bold" color="green.600">
            {calculateAvailableStock(selectedProduct)}
          </Text>
        </Box>
        
       
        
        <Box textAlign="center" bg={useColorModeValue("gray.50", "gray.700")} p={2} borderRadius="md">
          <Text fontSize="xs" color="gray.500">Status</Text>
          <Box mt={1}>
            <StockStatusBadge product={selectedProduct} />
          </Box>
        </Box>
      </SimpleGrid>
    </Box>

    {/* Description */}
    <Box mb={4}>
      <Text fontWeight="bold" color="gray.500" fontSize="sm" mb={1}>Description</Text>
      <Text fontSize="sm" lineHeight="1.4">
        {selectedProduct.description || "No description available"}
      </Text>
    </Box>

    {/* Images Grid */}
    {selectedProduct.images && selectedProduct.images.length > 0 && (
      <Box>
        <Text fontWeight="bold" color="gray.500" fontSize="sm" mb={2}>Images</Text>
        <SimpleGrid columns={4} spacing={2}>
          {selectedProduct.images.map((img, index) => (
            <Box
              key={img.public_id || index}
              borderRadius="md"
              overflow="hidden"
            >
              <Image
                src={img.url || img}
                alt={`Image ${index + 1}`}
                w="100%"
                h="60px"
                objectFit="cover"
                border="1px solid"
                borderColor="gray.200"
              />
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    )}
  </Box>
)}
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="blue" 
              onClick={closeModal}
              size="sm"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="gray.700">
            <Flex align="center" gap={2}>
              <Icon as={FaExclamationTriangle} color="red.500" />
              Confirm Delete
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="md" mb={4}>
              Are you sure you want to delete{" "}
              <Text as="span" fontWeight="bold" color={customColor}>
                "{itemToDelete?.name}"
              </Text>
              ? This action cannot be undone.
            </Text>
            
            {deleteType === "category" && (
              <Box 
                bg="orange.50" 
                p={3} 
                borderRadius="md" 
                border="1px" 
                borderColor="orange.200"
              >
                <Flex align="center" gap={2} mb={2}>
                  <Icon as={MdWarning} color="orange.500" />
                  <Text fontSize="sm" fontWeight="medium" color="orange.700">
                    Important Note
                  </Text>
                </Flex>
                <Text fontSize="sm" color="orange.600">
                  This category must be empty (no products) before it can be deleted. 
                 
                </Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="outline" 
              mr={3} 
              onClick={closeDeleteModal}
              isDisabled={isDeleting}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              bg="red.500"
              _hover={{ bg: "red.600" }}
              color="white"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              loadingText="Deleting..."
              size="sm"
            >
              Delete {deleteType === "category" ? "Category" : "Product"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}