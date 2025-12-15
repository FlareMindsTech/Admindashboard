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
  FaPlus,
  FaTimes,
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

  // Category doesn't have status field
  const initialCategory = { name: "", description: "" };
  
  // Product has status field
  const initialProduct = {
    name: "",
    description: "",
    images: [],
    status: "Available",
  };
  
  const statusOptions = ["Available", "Out of Stock", "Discontinued"];
  
  const [newCategory, setNewCategory] = useState(initialCategory);
  const [newProduct, setNewProduct] = useState(initialProduct);
  
  // Color management states
  const [availableColors, setAvailableColors] = useState([
    'Red', 'Blue', 'Green', 'Black', 'White', 
    'Yellow', 'Pink', 'Gray', 'Maroon', 'Purple'
  ]);
  const [customColorInput, setCustomColorInput] = useState("");

  // Variants management
  const [variants, setVariants] = useState([
    { 
      color: '', 
      size: '', 
      price: '', 
      stock: '', 
      sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
    }
  ]);

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
      const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;
      return totalStock;
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

    const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;
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
        return availableStock > 0; 
      })
      .sort((a, b) => {
        const stockA = calculateAvailableStock(a);
        const stockB = calculateAvailableStock(b);
        return stockB - stockA;
      })
      .slice(0, 10); 
    const categories = stockProducts.map(product => 
      product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name
    );
    
    const availableStockData = stockProducts.map(product => calculateAvailableStock(product));
    const totalStockData = stockProducts.map(product => 
      product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0
    );

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
      .slice(0, 10);

    const categories = alertProducts.map(product => 
      product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name
    );
    
    const availableStockData = alertProducts.map(product => calculateAvailableStock(product));
    const totalStockData = alertProducts.map(product => 
      product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0
    );

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

  // Color management functions
  const handleAddCustomColor = () => {
    const color = customColorInput.trim();
    
    if (!color) {
      toast({
        title: "Empty Color",
        description: "Please enter a color name",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (availableColors.includes(color)) {
      toast({
        title: "Color Exists",
        description: `Color "${color}" already exists in the list`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setAvailableColors(prev => [...prev, color]);
    setCustomColorInput("");
    
    toast({
      title: "Color Added",
      description: `Color "${color}" added successfully`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleRemoveColor = (colorToRemove) => {
    // Don't allow removal if it's used in any variant
    const isColorUsed = variants.some(variant => variant.color === colorToRemove);
    if (isColorUsed) {
      toast({
        title: "Cannot Remove",
        description: `Color "${colorToRemove}" is currently used in variants. Please remove or change variants first.`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setAvailableColors(prev => prev.filter(color => color !== colorToRemove));
    
    toast({
      title: "Color Removed",
      description: `Color "${colorToRemove}" removed from available colors`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Variant management functions
  const handleAddVariant = () => {
    setVariants([
      ...variants,
      { 
        color: '', 
        size: '', 
        price: '', 
        stock: '', 
        sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
      }
    ]);
  };

  const handleRemoveVariant = (index) => {
    if (variants.length === 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one variant is required",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    
    // Auto-generate SKU if color and size are set
    if ((field === 'color' || field === 'size') && updatedVariants[index].color && updatedVariants[index].size) {
      const colorCode = updatedVariants[index].color.substring(0, 3).toUpperCase();
      const sizeCode = updatedVariants[index].size.toUpperCase();
      updatedVariants[index].sku = `SKU-${colorCode}-${sizeCode}-${Date.now().toString().slice(-6)}`;
    }
    
    setVariants(updatedVariants);
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
      console.error("Fetch error:", err);
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
    setCustomColorInput("");
    setVariants([{ 
      color: '', 
      size: '', 
      price: '', 
      stock: '', 
      sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
    }]);
  };

  // Reset form
  const handleResetCategory = () => setNewCategory(initialCategory);
  const handleResetProduct = () => {
    setNewProduct(initialProduct);
    setCustomColorInput("");
    setVariants([{ 
      color: '', 
      size: '', 
      price: '', 
      stock: '', 
      sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
    }]);
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
    if (!newProduct.name) {
      return toast({
        title: "Validation Error",
        description: "Product name is required.",
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

    // Validate all variants
    const invalidVariants = variants.filter(variant => 
      !variant.color || !variant.size || !variant.price || !variant.stock
    );
    
    if (invalidVariants.length > 0) {
      return toast({
        title: "Validation Error",
        description: "Please fill all fields for each variant (color, size, price, stock).",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    // Check for duplicate variants
    const variantKeys = variants.map(v => `${v.color}-${v.size}`.toLowerCase());
    const hasDuplicates = new Set(variantKeys).size !== variantKeys.length;
    
    if (hasDuplicates) {
      return toast({
        title: "Duplicate Variants",
        description: "Duplicate color-size combinations are not allowed.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    try {
      setIsSubmitting(true);

      // Prepare product data
      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description?.trim() || "",
        category: selectedCategory._id,
        status: newProduct.status || "Available", // Product status validation
        images: newProduct.images?.filter(img => img.url || img.preview).map(img => img.url || img.preview) || [],
        variants: variants.map(variant => ({
          color: variant.color,
          size: variant.size,
          price: Number(variant.price),
          stock: Number(variant.stock),
          sku: variant.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        })),
      };

      let response;
      if (selectedProduct) {
        response = await updateProducts(selectedProduct._id, productData);
        
        // Handle image uploads for existing product
        if (newProduct.images && newProduct.images.some(img => img.isNew)) {
          for (const img of newProduct.images) {
            if (img.isNew && img.file) {
              try {
                await uploadProductImage(selectedProduct._id, img.file);
              } catch (imgError) {
                console.error("Image upload failed:", imgError);
              }
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
        
        // Handle image uploads for new product
        if (newProduct.images && newProduct.images.length > 0) {
          const createdProduct = response.data || response.product || response;
          
          for (const img of newProduct.images) {
            if (img.file) {
              try {
                await uploadProductImage(createdProduct._id, img.file);
              } catch (imgError) {
                console.error("Image upload failed:", imgError);
              }
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
      
      let errorTitle = selectedProduct ? "Error Updating Product" : "Error Creating Product";
      let errorDescription = err.message;
      
      if (err.message?.includes("500")) {
        errorDescription = "Server error. Please check backend connection.";
      } else if (err.message?.includes("401") || err.message?.includes("403")) {
        errorDescription = "Authentication error. Please log in again.";
      } else if (err.message?.includes("Network")) {
        errorDescription = "Network error. Check your internet connection.";
      } else if (err.message?.includes("category")) {
        errorDescription = "Category error. Please select a valid category.";
      } else if (err.status === 500) {
        errorDescription = "Server error (500). Please check backend logs.";
      } else if (err.response?.data?.message) {
        errorDescription = err.response.data.message;
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
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
    
    // Set variants from product data
    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants.map(variant => {
        const color = Array.isArray(variant.color) ? variant.color[0] || '' : variant.color || '';
        const size = Array.isArray(variant.size) ? variant.size[0] || '' : variant.size || '';
        
        return {
          color: color,
          size: size,
          price: variant.price || '',
          stock: variant.stock || '',
          sku: variant.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        };
      }));
    } else {
      setVariants([
        { 
          color: '', 
          size: '', 
          price: '', 
          stock: '', 
          sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
        }
      ]);
    }
    
    setNewProduct({
      name: product.name || '',
      description: product.description || '',
      images: productImages,
      status: product.status || "Available", // Product status
    });
    setCurrentView("addProduct");
  };

  // Edit Category handler - No status field
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setNewCategory({ 
      name: category.name, 
      description: category.description || "" 
    });
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
    const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;
    
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
            {/* Category Form - NO STATUS FIELD */}
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

            {/* Product Form - WITH STATUS FIELD */}
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
                      
                      {/* Status Field for Product ONLY */}
                      <FormControl>
                        <FormLabel color="gray.700" fontSize="sm">Product Status</FormLabel>
                        <Select
                          value={newProduct.status}
                          onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          size="sm"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Custom Color Input Section */}
                    <Box mb="20px">
                      <FormLabel color="gray.700" fontSize="sm">Manage Colors</FormLabel>
                      <Flex mb={3} gap={2}>
                        <Input
                          placeholder="Add custom color (e.g., Navy Blue, Teal)"
                          value={customColorInput}
                          onChange={(e) => setCustomColorInput(e.target.value)}
                          size="sm"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                        />
                        <Button
                          size="sm"
                          leftIcon={<FaPlus />}
                          onClick={handleAddCustomColor}
                          bg={customColor}
                          _hover={{ bg: customHoverColor }}
                          color="white"
                          isDisabled={!customColorInput.trim()}
                        >
                          Add Color
                        </Button>
                      </Flex>

                      {/* Available Colors Display */}
                      <Flex flexWrap="wrap" gap={2} mb={2}>
                        {availableColors.map((color) => {
                          const isDefaultColor = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Gray', 'Maroon', 'Purple'].includes(color);
                          return (
                            <Box key={color} position="relative">
                              <Button
                                size="xs"
                                variant="outline"
                                colorScheme="gray"
                                fontSize="xs"
                                _hover={{ shadow: "sm" }}
                              >
                                {color}
                              </Button>
                              {!isDefaultColor && (
                                <IconButton
                                  aria-label={`Remove ${color}`}
                                  icon={<FaTimes />}
                                  size="2xs"
                                  colorScheme="red"
                                  position="absolute"
                                  top={-2}
                                  right={-2}
                                  borderRadius="full"
                                  onClick={() => handleRemoveColor(color)}
                                />
                              )}
                            </Box>
                          );
                        })}
                      </Flex>
                    </Box>

                    {/* Variants Section */}
                    <Box mb="20px">
                      <Flex justify="space-between" align="center" mb={3}>
                        <FormLabel color="gray.700" fontSize="sm" m={0}>Product Variants *</FormLabel>
                        <Button
                          size="sm"
                          leftIcon={<FaPlus />}
                          onClick={handleAddVariant}
                          bg={customColor}
                          _hover={{ bg: customHoverColor }}
                          color="white"
                        >
                          Add Variant
                        </Button>
                      </Flex>
                      
                      {variants.map((variant, index) => (
                        <Box 
                          key={index} 
                          p={4} 
                          border="1px" 
                          borderColor="gray.200" 
                          borderRadius="md" 
                          mb={3}
                          position="relative"
                        >
                          <Flex justify="space-between" align="center" mb={3}>
                            <Text fontSize="sm" fontWeight="bold" color="gray.700">
                              Variant {index + 1}
                            </Text>
                            {variants.length > 1 && (
                              <IconButton
                                aria-label="Remove variant"
                                icon={<FaTimes />}
                                size="xs"
                                colorScheme="red"
                                onClick={() => handleRemoveVariant(index)}
                              />
                            )}
                          </Flex>
                          
                          <Grid templateColumns={["1fr", "1fr 1fr", "1fr 1fr 1fr 1fr"]} gap={4}>
                            {/* Color Selection */}
                            <FormControl isRequired>
                              <FormLabel fontSize="xs" color="gray.600">Color</FormLabel>
                              <Select
                                value={variant.color}
                                onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                placeholder="Select color"
                                size="sm"
                                borderColor={`${customColor}50`}
                                _hover={{ borderColor: customColor }}
                                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                                bg="white"
                              >
                                <option value="">Select color</option>
                                {availableColors.map(color => (
                                  <option key={color} value={color}>{color}</option>
                                ))}
                              </Select>
                            </FormControl>

                            {/* Size Selection */}
                            <FormControl isRequired>
                              <FormLabel fontSize="xs" color="gray.600">Size</FormLabel>
                              <Select
                                value={variant.size}
                                onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                placeholder="Select size"
                                size="sm"
                                borderColor={`${customColor}50`}
                                _hover={{ borderColor: customColor }}
                                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                                bg="white"
                              >
                                <option value="">Select size</option>
                                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                  <option key={size} value={size}>{size}</option>
                                ))}
                              </Select>
                            </FormControl>

                            {/* Price */}
                            <FormControl isRequired>
                              <FormLabel fontSize="xs" color="gray.600">Price (₹)</FormLabel>
                              <Input
                                type="number"
                                value={variant.price}
                                onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                placeholder="Enter price"
                                min="0"
                                step="0.01"
                                size="sm"
                                borderColor={`${customColor}50`}
                                _hover={{ borderColor: customColor }}
                                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                                bg="white"
                              />
                            </FormControl>

                            {/* Stock */}
                            <FormControl isRequired>
                              <FormLabel fontSize="xs" color="gray.600">Stock</FormLabel>
                              <Input
                                type="number"
                                value={variant.stock}
                                onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                placeholder="Enter stock"
                                min="0"
                                size="sm"
                                borderColor={`${customColor}50`}
                                _hover={{ borderColor: customColor }}
                                _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                                bg="white"
                              />
                            </FormControl>
                          </Grid>
                          
                          {/* SKU Display */}
                          {variant.sku && (
                            <Text fontSize="xs" color="gray.500" mt={2}>
                              SKU: <Text as="span" fontWeight="bold">{variant.sku}</Text>
                            </Text>
                          )}
                        </Box>
                      ))}
                    </Box>

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
                      isDisabled={!selectedCategory || variants.length === 0}
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
            <CardBody position="relative" zIndex={1} p={{ base: 2, md: 4 }}>
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
                    <StatNumber fontSize={{ base: "sm", md: "md" }} color={textColor}>
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
            minH={{ base: "65px", md: "75px" }}
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
                      setVariants([{ 
                        color: '', 
                        size: '', 
                        price: '', 
                        stock: '', 
                        sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
                      }]);
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
                                  </Td>
                                </Tr>
                              ))
                            ) : (
                              <Tr>
                                <Td colSpan={6} textAlign="center" py={6}>
                                  <Text fontSize="sm">
                                    {categories.length === 0
                                      ? "No categories found. Click 'Add Category' to create one."
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
                                Price Range
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
                                const totalStock = prod.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;
                                const prices = prod.variants?.map(v => v.price || 0) || [];
                                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                                const priceRange = minPrice === maxPrice ? 
                                  `₹${minPrice}` : 
                                  `₹${minPrice} - ₹${maxPrice}`;
                                
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
                                      {priceRange}
                                    </Td>
                                    <Td borderColor={`${customColor}20`} fontSize="sm" py={3}>
                                      <Flex direction="column" gap={1}>
                                        <StockStatusBadge product={prod} />
                                        <Badge
                                          colorScheme={
                                            prod.status === "Available" ? "green" : 
                                            prod.status === "Out of Stock" ? "orange" : "red"
                                          }
                                          fontSize="xs"
                                          px={2}
                                          py={1}
                                          borderRadius="full"
                                        >
                                          {prod.status || "Available"}
                                        </Badge>
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
                                      ? "No products found. Click 'Add Product' to create one."
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
                      {products.length > 0 ? (
                        stockChartData && (
                          <ReactApexChart
                            options={stockChartData.options}
                            series={stockChartData.series}
                            type="line"
                            height={350}
                          />
                        )
                      ) : (
                        <Center py={10}>
                          <Text fontSize="md" color="gray.500">
                            No products available to display stock analysis
                          </Text>
                        </Center>
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
                      {products.length > 0 ? (
                        stockAlertChartData && (
                          <ReactApexChart
                            options={stockAlertChartData.options}
                            series={stockAlertChartData.series}
                            type="line"
                            height={350}
                          />
                        )
                      ) : (
                        <Center py={10}>
                          <Text fontSize="md" color="gray.500">
                            No products available to display stock alerts
                          </Text>
                        </Center>
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
                        <Text fontSize="xs" color="gray.500">Status</Text>
                        <Badge
                          colorScheme={
                            selectedProduct.status === "Available" ? "green" : 
                            selectedProduct.status === "Out of Stock" ? "orange" : "red"
                          }
                          fontSize="xs"
                          px={2}
                          py={1}
                        >
                          {selectedProduct.status || "Available"}
                        </Badge>
                      </Box>
                    </SimpleGrid>
                  </Box>
                </Flex>

                {/* Variants Information */}
                <Box mb={4}>
                  <Text fontWeight="bold" color="gray.500" fontSize="sm" mb={2}>Product Variants</Text>
                  {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                    <SimpleGrid columns={1} spacing={2}>
                      {selectedProduct.variants.map((variant, index) => (
                        <Box 
                          key={index}
                          p={2}
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          bg={useColorModeValue("gray.50", "gray.700")}
                        >
                          <Grid templateColumns="1fr 1fr" gap={2}>
                            <Box>
                              <Text fontSize="xs" color="gray.500">Color</Text>
                              <Text fontSize="sm" fontWeight="medium">{variant.color || "N/A"}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="gray.500">Size</Text>
                              <Text fontSize="sm" fontWeight="medium">{variant.size || "N/A"}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="gray.500">Price</Text>
                              <Text fontSize="sm" fontWeight="bold" color="green.600">
                                ₹{variant.price || "N/A"}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="gray.500">Stock</Text>
                              <Text fontSize="sm" fontWeight="medium">{variant.stock || "0"}</Text>
                            </Box>
                            {variant.sku && (
                              <Box colSpan={2}>
                                <Text fontSize="xs" color="gray.500">SKU</Text>
                                <Text fontSize="xs" fontWeight="medium">{variant.sku}</Text>
                              </Box>
                            )}
                          </Grid>
                        </Box>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Text fontSize="sm" color="gray.500">No variants available</Text>
                  )}
                </Box>

                {/* Stock Information */}
                <Box mb={4}>
                  <Text fontWeight="bold" color="gray.500" fontSize="sm" mb={2}>Stock Information</Text>
                  <SimpleGrid columns={2} spacing={3}>
                    <Box textAlign="center" bg={useColorModeValue("gray.50", "gray.700")} p={2} borderRadius="md">
                      <Text fontSize="xs" color="gray.500">Total Stock</Text>
                      <Text fontSize="lg" fontWeight="bold">
                        {selectedProduct.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0}
                      </Text>
                    </Box>
                    
                    <Box textAlign="center" bg={useColorModeValue("gray.50", "gray.700")} p={2} borderRadius="md">
                      <Text fontSize="xs" color="gray.500">Available</Text>
                      <Text fontSize="lg" fontWeight="bold" color="green.600">
                        {calculateAvailableStock(selectedProduct)}
                      </Text>
                    </Box>
                    
                    <Box textAlign="center" bg={useColorModeValue("gray.50", "gray.700")} p={2} borderRadius="md" colSpan={2}>
                      <Text fontSize="xs" color="gray.500">Status</Text>
                      <Box mt={1}>
                        <StockStatusBadge product={selectedProduct} />
                        <Badge
                          colorScheme={
                            selectedProduct.status === "Available" ? "green" : 
                            selectedProduct.status === "Out of Stock" ? "orange" : "red"
                          }
                          fontSize="xs"
                          px={2}
                          py={1}
                          mt={1}
                        >
                          {selectedProduct.status || "Available"}
                        </Badge>
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