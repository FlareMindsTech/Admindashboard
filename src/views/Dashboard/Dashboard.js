import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Input,
  Avatar,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Badge,
  useColorModeValue,
  VStack,
  HStack,
  Progress,
  Tooltip,
  Spinner,
  Button,
  useBreakpointValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiBell, FiShoppingCart, FiUsers, FiDollarSign, FiMapPin, FiPackage, FiRefreshCw } from 'react-icons/fi';
import ReactApexChart from 'react-apexcharts';

// Import your order data function
import { getAllOrders, getAllCategories } from '../utils/axiosInstance';

// Import your custom Card components
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";

// Helper function to match city names to districts
const matchDistrictFromCity = (cityName) => {
  if (!cityName) return 'Other Districts';
  
  const cityLower = cityName.toLowerCase();
  
  const cityToDistrictMap = {
    "chennai": "Chennai",
    "madras": "Chennai",
    "coimbatore": "Coimbatore", 
    "covai": "Coimbatore",
    "madurai": "Madurai",
    "salem": "Salem",
    "tiruchirappalli": "Tiruchirappalli",
    "trichy": "Tiruchirappalli",
    "tiruchi": "Tiruchirappalli",
    "tiruppur": "Tiruppur",
    "tirupur": "Tiruppur",
    "erode": "Erode",
    "vellore": "Vellore",
    "thoothukudi": "Thoothukudi",
    "tuticorin": "Thoothukudi",
    "tirunelveli": "Tirunelveli",
    "dindigul": "Dindigul",
    "thanjavur": "Thanjavur",
    "tanjore": "Thanjavur",
    "kanchipuram": "Kanchipuram",
    "kanchi": "Kanchipuram",
    "cuddalore": "Cuddalore",
    "virudhunagar": "Virudhunagar",
    "kanyakumari": "Kanyakumari",
    "nagercoil": "Kanyakumari"
  };

  return cityToDistrictMap[cityLower] || 'Other Districts';
};

// Enhanced function to extract district from address
const extractDistrictFromAddress = (order) => {
  if (order.city) {
    const cityDistrict = matchDistrictFromCity(order.city);
    if (cityDistrict !== 'Other Districts') {
      return cityDistrict;
    }
  }

  if (order.district) {
    const directDistrict = matchDistrictFromCity(order.district);
    if (directDistrict !== 'Other Districts') {
      return directDistrict;
    }
  }

  let addressText = '';
 
  if (order.address && typeof order.address === 'object') {
    addressText = order.address.street || 
                  order.address.addressLine1 || 
                  order.address.fullAddress || 
                  order.address.city || 
                  JSON.stringify(order.address);
  } 
  else if (order.shippingAddress && typeof order.shippingAddress === 'object') {
    addressText = order.shippingAddress.street || 
                  order.shippingAddress.addressLine1 || 
                  order.shippingAddress.fullAddress || 
                  order.shippingAddress.city || 
                  JSON.stringify(order.shippingAddress);
  }
  else if (typeof order.address === 'string') {
    addressText = order.address;
  }
  else if (typeof order.shippingAddress === 'string') {
    addressText = order.shippingAddress;
  }

  if (!addressText) {
    return 'Unknown';
  }

  const addressLower = addressText.toLowerCase();
  
  const districtKeywords = {
    "Chennai": ["chennai", "madras"],
    "Coimbatore": ["coimbatore", "covai"],
    "Madurai": ["madurai"],
    "Salem": ["salem"],
    "Tiruchirappalli": ["tiruchirappalli", "trichy", "tiruchi"],
    "Tiruppur": ["tiruppur", "tirupur"],
    "Erode": ["erode"],
    "Vellore": ["vellore"],
    "Thoothukudi": ["thoothukudi", "tuticorin"],
    "Tirunelveli": ["tirunelveli"],
    "Dindigul": ["dindigul"],
    "Thanjavur": ["thanjavur", "tanjore"],
    "Kanchipuram": ["kanchipuram", "kanchi"],
    "Cuddalore": ["cuddalore"],
    "Virudhunagar": ["virudhunagar"],
    "Kanyakumari": ["kanyakumari", "nagercoil"]
  };

  for (const [district, keywords] of Object.entries(districtKeywords)) {
    if (keywords.some(keyword => addressLower.includes(keyword))) {
      return district;
    }
  }

  return 'Other Districts';
};

// Enhanced function to extract category and product information with category mapping
const extractProductInfo = (item, categoriesMap = {}) => {
  console.log("Processing item:", item);
  
  // Try different possible category paths
  let categoryId = null;
  let categoryName = 'uncategorized';
  let productName = 'Unknown Product';
  
  // Check for category in different possible locations
  if (item.category) {
    categoryId = item.category;
  } else if (item.productId?.category) {
    categoryId = item.productId.category;
  } else if (item.product?.category) {
    categoryId = item.product.category;
  } else if (item.productDetails?.category) {
    categoryId = item.productDetails.category;
  }
  
  // Check for product name in different possible locations
  if (item.name) {
    productName = item.name;
  } else if (item.productId?.name) {
    productName = item.productId.name;
  } else if (item.product?.name) {
    productName = item.product.name;
  } else if (item.productDetails?.name) {
    productName = item.productDetails.name;
  } else if (item.title) {
    productName = item.title;
  }
  
  // Map category ID to category name
  if (categoryId && categoriesMap[categoryId]) {
    categoryName = categoriesMap[categoryId];
  } else if (categoryId) {
    // If category ID exists but not in map, use the ID as fallback
    categoryName = typeof categoryId === 'string' ? categoryId : 'uncategorized';
  }
  
  // Clean up category name
  categoryName = categoryName.toLowerCase().trim();
  if (categoryName === '' || categoryName === 'undefined' || categoryName === 'null') {
    categoryName = 'uncategorized';
  }
  
  const finalCategoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  
  console.log("Extracted - Category ID:", categoryId, "Category Name:", finalCategoryName, "Product:", productName);
  
  return {
    categoryId: categoryId,
    category: finalCategoryName,
    productName: productName,
    price: item.price || item.unitPrice || 0,
    quantity: item.quantity || item.qty || 1
  };
};

// Process orders data for categories and districts
const processOrdersData = (orders, categories = []) => {
  if (!orders || !Array.isArray(orders)) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      districts: [],
      topDistricts: [],
      recentOrders: [],
      categories: {},
      categoryStats: {
        labels: [],
        series: [],
        totalAmount: 0,
        colors: [],
        details: []
      },
      productStats: {
        labels: [],
        series: [],
        totalAmount: 0,
        colors: [],
        details: []
      },
      lineChartData: {
        series: [],
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      }
    };
  }

  // Create categories map for ID to name mapping
  const categoriesMap = {};
  categories.forEach(cat => {
    if (cat._id) categoriesMap[cat._id] = cat.name || 'Unknown Category';
    if (cat.id) categoriesMap[cat.id] = cat.name || 'Unknown Category';
  });

  console.log("Categories map:", categoriesMap);

  const districtOrders = {};
  const categoryData = {};
  const productData = {};
  const monthlyProductSales = {};
  let totalOrders = 0;
  let totalRevenue = 0;
  const recentOrders = [];

  // Generate dynamic colors
  const generateColors = (count) => {
    const baseColors = [
      '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D',
      '#059669', '#0891B2', '#7C3AED', '#DB2777', '#475569',
      '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D',
      '#059669', '#0891B2', '#7C3AED', '#DB2777', '#475569'
    ];
    return baseColors.slice(0, count);
  };

  console.log("Total orders to process:", orders.length);

  orders.forEach((order, orderIndex) => {
    console.log(`Processing order ${orderIndex + 1}:`, order);
    
    if (order.status && (order.status.toLowerCase() === 'confirmed' || 
                         order.status.toLowerCase() === 'completed' || 
                         order.status.toLowerCase() === 'delivered' || 
                         order.status.toLowerCase() === 'pending')) {
      totalOrders++;
      const orderAmount = order.totalAmount || order.price || order.total_amount || 0;
      totalRevenue += orderAmount;
      
      // Process district data
      const district = extractDistrictFromAddress(order);
      if (!districtOrders[district]) {
        districtOrders[district] = 0;
      }
      districtOrders[district]++;

      let hasItems = false;

      // Process category and product data from order items
      const processItemArray = (items, source) => {
        if (!items || !Array.isArray(items)) return;
        
        console.log(`Found ${items.length} items in ${source}:`, items);
        
        items.forEach((item, itemIndex) => {
          hasItems = true;
          const { categoryId, category, productName, price, quantity } = extractProductInfo(item, categoriesMap);
          const itemAmount = price * quantity;
          
          console.log(`Item ${itemIndex + 1}:`, { categoryId, category, productName, price, quantity, itemAmount });

          // Category data - now using category name instead of ID
          if (!categoryData[category]) {
            categoryData[category] = {
              count: 0,
              amount: 0,
              items: []
            };
          }
          categoryData[category].count += quantity;
          categoryData[category].amount += itemAmount;
          categoryData[category].items.push({
            name: productName,
            quantity: quantity,
            price: price,
            amount: itemAmount
          });

          // Product data
          const productKey = `${productName} - ${category}`;
          if (!productData[productKey]) {
            productData[productKey] = {
              name: productName,
              category: category,
              count: 0,
              amount: 0,
              items: []
            };
          }
          productData[productKey].count += quantity;
          productData[productKey].amount += itemAmount;
          productData[productKey].items.push({
            name: productName,
            quantity: quantity,
            price: price,
            amount: itemAmount
          });

          // Monthly sales data for line chart
          const orderDate = order.createdAt || order.orderDate || order.date || new Date();
          const month = new Date(orderDate).getMonth(); // 0-11 for Jan-Dec
          
          if (!monthlyProductSales[productName]) {
            monthlyProductSales[productName] = Array(12).fill(0);
          }
          monthlyProductSales[productName][month] += itemAmount;
        });
      };

      // Try different possible item array names
      processItemArray(order.items, 'items');
      processItemArray(order.orderItems, 'orderItems');
      processItemArray(order.products, 'products');
      processItemArray(order.orderProducts, 'orderProducts');

      // If no items found, try to find any array that might contain items
      if (!hasItems) {
        console.log("No standard item arrays found, searching for any array...");
        Object.keys(order).forEach(key => {
          if (Array.isArray(order[key]) && order[key].length > 0) {
            const firstItem = order[key][0];
            // Check if this looks like an item (has price, quantity, or name)
            if (firstItem && (firstItem.price !== undefined || firstItem.quantity !== undefined || firstItem.name)) {
              console.log(`Found potential items array in key: ${key}`, order[key]);
              processItemArray(order[key], key);
            }
          }
        });
      }

      // If still no items, create a generic entry from order data
      if (!hasItems) {
        console.log("No items found, creating generic entry from order data");
        const orderCategoryId = order.category;
        let categoryName = 'general';
        
        // Map order category ID to name
        if (orderCategoryId && categoriesMap[orderCategoryId]) {
          categoryName = categoriesMap[orderCategoryId];
        } else if (orderCategoryId) {
          categoryName = typeof orderCategoryId === 'string' ? orderCategoryId : 'general';
        }
        
        categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        const productName = order.productName || 'Order Item';
        
        if (!categoryData[categoryName]) {
          categoryData[categoryName] = {
            count: 0,
            amount: 0,
            items: []
          };
        }
        categoryData[categoryName].count += 1;
        categoryData[categoryName].amount += orderAmount;
        categoryData[categoryName].items.push({
          name: productName,
          quantity: 1,
          price: orderAmount,
          amount: orderAmount
        });

        // Product data for order-level items
        const productKey = `${productName} - ${categoryName}`;
        if (!productData[productKey]) {
          productData[productKey] = {
            name: productName,
            category: categoryName,
            count: 0,
            amount: 0,
            items: []
          };
        }
        productData[productKey].count += 1;
        productData[productKey].amount += orderAmount;
        productData[productKey].items.push({
          name: productName,
          quantity: 1,
          price: orderAmount,
          amount: orderAmount
        });

        // Monthly sales data for line chart
        const orderDate = order.createdAt || order.orderDate || order.date || new Date();
        const month = new Date(orderDate).getMonth();
        
        if (!monthlyProductSales[productName]) {
          monthlyProductSales[productName] = Array(12).fill(0);
        }
        monthlyProductSales[productName][month] += orderAmount;
      }

      // Process recent orders
      let displayAddress = 'No address provided';
      if (order.address) {
        if (typeof order.address === 'object') {
          displayAddress = order.address.street || 
                          order.address.addressLine1 || 
                          order.address.fullAddress || 
                          `${order.address.city || ''} ${order.address.state || ''} ${order.address.pincode || ''}`.trim() ||
                          'Address object';
        } else {
          displayAddress = order.address;
        }
      } else if (order.shippingAddress) {
        if (typeof order.shippingAddress === 'object') {
          displayAddress = order.shippingAddress.street || 
                          order.shippingAddress.addressLine1 || 
                          order.shippingAddress.fullAddress || 
                          `${order.shippingAddress.city || ''} ${order.shippingAddress.state || ''} ${order.shippingAddress.pincode || ''}`.trim() ||
                          'Shipping address object';
        } else {
          displayAddress = order.shippingAddress;
        }
      }

      recentOrders.push({
        id: order.id || order._id || Math.random().toString(36).substr(2, 9),
        address: displayAddress,
        amount: orderAmount,
        status: order.status,
        district: district
      });
    }
  });

  console.log("Processed category data:", categoryData);
  console.log("Processed product data:", productData);
  console.log("Monthly product sales:", monthlyProductSales);

  // Process districts data
  const districts = Object.keys(districtOrders)
    .filter(district => !['Unknown', 'Other Districts'].includes(district))
    .map(district => {
      const ordersCount = districtOrders[district];
      const percentage = totalOrders > 0 ? (ordersCount / totalOrders) * 100 : 0;
      
      return {
        name: district,
        orders: ordersCount,
        percentage: parseFloat(percentage.toFixed(1))
      };
    })
    .sort((a, b) => b.orders - a.orders);

  const topDistricts = districts.slice(0, 4);

  // Process category data for chart - now using category names
  const categoryArray = Object.entries(categoryData)
    .map(([categoryName, data]) => ({
      name: categoryName,
      value: data.amount,
      count: data.count,
      items: data.items,
      color: ''
    }))
    .sort((a, b) => b.value - a.value);

  const categoryColors = generateColors(categoryArray.length);
  categoryArray.forEach((category, index) => {
    category.color = categoryColors[index] || '#6B7280';
  });

  const categoryStats = {
    labels: categoryArray.map(cat => cat.name),
    series: categoryArray.map(cat => parseFloat(cat.value.toFixed(2))),
    totalAmount: categoryArray.reduce((sum, cat) => sum + cat.value, 0),
    colors: categoryArray.map(cat => cat.color),
    details: categoryArray
  };

  // Process product data for chart
  const productArray = Object.entries(productData)
    .map(([productKey, data]) => ({
      name: data.name,
      category: data.category,
      value: data.amount,
      count: data.count,
      items: data.items,
      color: ''
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Show top 10 products

  const productColors = generateColors(productArray.length);
  productArray.forEach((product, index) => {
    product.color = productColors[index] || '#6B7280';
  });

  const productStats = {
    labels: productArray.map(prod => prod.name),
    series: productArray.map(prod => parseFloat(prod.value.toFixed(2))),
    totalAmount: productArray.reduce((sum, prod) => sum + prod.value, 0),
    colors: productArray.map(prod => prod.color),
    details: productArray
  };

  // Process line chart data
  const topProductsForLineChart = Object.entries(monthlyProductSales)
    .map(([productName, monthlyData]) => ({
      name: productName,
      data: monthlyData.map(amount => parseFloat(amount.toFixed(2)))
    }))
    .sort((a, b) => {
      const totalA = a.data.reduce((sum, val) => sum + val, 0);
      const totalB = b.data.reduce((sum, val) => sum + val, 0);
      return totalB - totalA;
    })
    .slice(0, 5); // Top 5 products for line chart

  const lineChartData = {
    series: topProductsForLineChart,
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };

  console.log("Final category stats:", categoryStats);
  console.log("Final product stats:", productStats);
  console.log("Line chart data:", lineChartData);

  return {
    totalOrders,
    totalRevenue,
    districts,
    topDistricts,
    recentOrders: recentOrders.slice(0, 5),
    categories: categoryData,
    categoryStats,
    productStats,
    lineChartData
  };
};

// Modern 3D City Map Component (simplified for brevity)
const ModernCityMap = ({ districts, onDistrictHover, hoveredDistrict, loading }) => {
  if (loading) {
    return (
      <Flex justify="center" align="center" height="100%" bg="gray.50" borderRadius="lg">
        <VStack spacing={3}>
          <Spinner size="lg" color="#DC2626" />
          <Text color="gray.500" fontSize="sm">Loading city data...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box position="relative" width="100%" height="100%">
      <Flex justify="center" align="center" height="100%" bg="gray.50" borderRadius="lg">
        <VStack spacing={4}>
          <Text fontSize="lg" fontWeight="bold" color="gray.700">
            Order Distribution Map
          </Text>
          <Text color="gray.500" textAlign="center">
            Visualizing orders across {districts.length} districts
          </Text>
          <SimpleGrid columns={2} spacing={4} mt={4}>
            {districts.slice(0, 6).map((district, index) => (
              <Box key={district.name} p={3} bg="white" borderRadius="md" shadow="sm">
                <Text fontWeight="medium">{district.name}</Text>
                <Text color="red.500" fontSize="sm">{district.orders} orders</Text>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Flex>
    </Box>
  );
};

// Recent Orders Component
const RecentOrders = ({ orders, loading }) => {
  const accent = '#5a189a';

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'green';
      case 'completed': return 'blue';
      case 'confirmed': return 'orange';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  const truncateAddress = (address, maxLength = 35) => {
    if (!address || address.length <= maxLength) return address || 'No address';
    return address.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100%">
        <Spinner size="sm" color={accent} />
      </Flex>
    );
  }

  if (orders.length === 0) {
    return (
      <Text color="gray.500" textAlign="center" fontSize="sm">
        No recent orders available
      </Text>
    );
  }

  return (
    <VStack spacing={3} align="stretch" maxH="200px" overflowY="auto">
      {orders.map((order) => (
        <Box 
          key={order.id}
          p={3} 
          borderRadius="md" 
          bg="white"
          boxShadow="sm"
          border="1px solid"
          borderColor="gray.100"
          _hover={{ bg: 'gray.50' }}
        >
          <Flex justify="space-between" align="start" mb={2}>
            <Badge 
              colorScheme={getStatusColor(order.status)}
              fontSize="xs"
              textTransform="capitalize"
            >
              {order.status}
            </Badge>
            <Text fontSize="sm" fontWeight="bold" color={accent}>
              ₹{order.amount}
            </Text>
          </Flex>
          
          <Text fontSize="sm" color="gray.700" mb={1}>
            {truncateAddress(order.address)}
          </Text>
          
          <Flex justify="space-between" align="center">
            <Badge variant="subtle" colorScheme="gray" fontSize="xs">
              {order.district}
            </Badge>
            <Text fontSize="xs" color="gray.500">
              Order #{order.id.slice(-6)}
            </Text>
          </Flex>
        </Box>
      ))}
    </VStack>
  );
};

// Enhanced Category Donut Chart Component with Product Details
const CategoryDonutChart = ({ categoryStats, productStats, loading, activeView, onViewChange }) => {
  const accent = '#5a189a';
  const isMobile = useBreakpointValue({ base: true, md: false });

  const currentStats = activeView === 'categories' ? categoryStats : productStats;
  const chartTitle = activeView === 'categories' ? 'Sales by Category' : 'Top Products';

  // Chart options
  const donutChartOptions = {
    chart: { 
      type: 'donut',
      animations: {
        enabled: true,
        speed: 800
      }
    },
    labels: currentStats.labels,
    colors: currentStats.colors,
    legend: { show: false },
    dataLabels: { 
      enabled: true,
      formatter: function (val) {
        return Math.round(val) + "%";
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        color: '#000',
        opacity: 0.45
      }
    },
    plotOptions: {
      pie: { 
        donut: { 
          size: '65%',
          labels: {
            show: true,
            name: { show: true },
            value: { 
              show: true,
              formatter: function (val) {
                return '₹' + Math.round(val).toLocaleString();
              }
            },
            total: {
              show: true,
              label: 'Total',
              formatter: function (w) {
                return '₹' + w.globals.seriesTotals.reduce((a, b) => a + b, 0).toLocaleString();
              }
            }
          }
        }
      }
    },
    tooltip: {
      y: {
        formatter: function (value) {
          return '₹' + value.toLocaleString();
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { position: 'bottom' }
      }
    }]
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Spinner size="lg" color={accent} />
      </Flex>
    );
  }

  if (currentStats.series.length === 0) {
    return (
      <Flex justify="center" align="center" height="200px" direction="column">
        <Text color="gray.500" mb={2}>No {activeView} data available</Text>
        <Text fontSize="sm" color="gray.400">Orders will appear here once processed</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" height="200px">
      {/* View Toggle */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="sm" color="gray.700">{chartTitle}</Heading>
        <Button
          size="xs"
          variant="outline"
          onClick={onViewChange}
          bg={activeView === 'categories' ? accent : 'white'}
          color={activeView === 'categories' ? 'white' : accent}
          borderColor={accent}
          _hover={{ bg: activeView === 'categories' ? accent : `${accent}10` }}
        >
          {activeView === 'categories' ? 'Show Products' : 'Show Categories'}
        </Button>
      </Flex>

      {/* Chart Content */}
      <Flex align="center" justify="space-between" flex="1">
        <Box w={isMobile ? "50%" : "60%"} height="100%">
          <ReactApexChart 
            options={donutChartOptions} 
            series={currentStats.series} 
            type="donut" 
            height="100%" 
          />
        </Box>
        <VStack spacing={3} align="flex-start" w={isMobile ? "50%" : "40%"} pl={4}>
          <Box>
            <Text fontWeight="bold" fontSize={{ base: "lg", md: "xl" }} color="gray.800">
              ₹{currentStats.totalAmount.toLocaleString()}
            </Text>
            <Text fontSize="sm" color="gray.500">Total Sales</Text>
          </Box>
          <VStack spacing={2} align="flex-start" maxH="120px" overflowY="auto" w="100%">
            {currentStats.details.map((item, i) => (
              <HStack key={item.name} spacing={3} w="100%" justify="space-between">
                <HStack spacing={2} flex="1">
                  <Box w={2} h={2} bg={currentStats.colors[i]} borderRadius="full" flexShrink={0} />
                  <VStack spacing={0} align="flex-start" flex="1">
                    <Text fontSize="xs" color="gray.700" noOfLines={1} fontWeight="medium">
                      {item.name}
                    </Text>
                    {activeView === 'products' && (
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {item.category}
                      </Text>
                    )}
                  </VStack>
                </HStack>
                <VStack spacing={0} align="flex-end" flexShrink={0}>
                  <Text fontSize="xs" fontWeight="medium" color="gray.800">
                    ₹{item.value.toLocaleString()}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {item.count} items
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        </VStack>
      </Flex>
    </Flex>
  );
};

// Product Details Component
const ProductDetailsChart = ({ productStats, loading }) => {
  const accent = '#DC2626';
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (loading) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Spinner size="lg" color={accent} />
      </Flex>
    );
  }

  if (productStats.details.length === 0) {
    return (
      <Flex justify="center" align="center" height="200px" direction="column">
        <Text color="gray.500" mb={2}>No product data available</Text>
        <Text fontSize="sm" color="gray.400">Products will appear here once orders are processed</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" height="200px">
      <Heading size="sm" mb={4} color="gray.700">Top Products Performance</Heading>
      
      <Box flex="1" overflowY="auto">
        <VStack spacing={3} align="stretch">
          {productStats.details.map((product, index) => (
            <Box 
              key={product.name}
              p={3}
              borderRadius="md"
              bg="white"
              border="1px solid"
              borderColor="gray.100"
              _hover={{ bg: 'gray.50' }}
            >
              <Flex justify="space-between" align="start" mb={2}>
                <VStack align="start" spacing={1} flex="1">
                  <Text fontSize="sm" fontWeight="bold" color="gray.800" noOfLines={1}>
                    {product.name}
                  </Text>
                  <Badge colorScheme="purple" fontSize="xs">
                    {product.category}
                  </Badge>
                </VStack>
                <Text fontSize="sm" fontWeight="bold" color={accent} flexShrink={0} ml={2}>
                  ₹{product.value.toLocaleString()}
                </Text>
              </Flex>
              
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" color="gray.600">
                  {product.count} items sold
                </Text>
                <Box 
                  w="6px" 
                  h="6px" 
                  bg={productStats.colors[index]} 
                  borderRadius="full" 
                  flexShrink={0}
                />
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>
    </Flex>
  );
};

// Line chart configuration - Updated to use dynamic data
const getLineChartOptions = (categories) => ({
  chart: {
    height: 350,
    type: 'line',
    zoom: { enabled: false },
    toolbar: { show: true }
  },
  colors: ['#5a189a', '#5a189a', '#5a189a', '#5a189a', '#5a189a'],
  stroke: { width: 3, curve: 'smooth' },
  markers: { size: 4 },
  xaxis: {
    categories: categories,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: {
        colors: '#6B7280',
        fontSize: '12px'
      }
    }
  },
  yaxis: {
    min: 0,
    labels: { 
      formatter: (val) => '₹' + val.toLocaleString(),
      style: {
        colors: '#6B7280',
        fontSize: '12px'
      }
    }
  },
  grid: { 
    borderColor: '#f1f1f1',
    strokeDashArray: 4
  },
  legend: {
    position: 'bottom',
    horizontalAlign: 'center',
    fontSize: '12px',
    labels: {
      colors: '#374151'
    }
  },
  tooltip: {
    y: {
      formatter: function (value) {
        return '₹' + value.toLocaleString();
      }
    }
  }
});

export default function EcommerceDashboard() {
  const bg = useColorModeValue('linear-gradient(180deg,#fafafa 0%,#f5f5f5 100%)', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const accent = '#DC2626';
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeChartView, setActiveChartView] = useState('categories'); // 'categories' or 'products'
  const [orderData, setOrderData] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    districts: [],
    topDistricts: [],
    recentOrders: [],
    categories: {},
    categoryStats: {
      labels: [],
      series: [],
      totalAmount: 0,
      colors: [],
      details: []
    },
    productStats: {
      labels: [],
      series: [],
      totalAmount: 0,
      colors: [],
      details: []
    },
    lineChartData: {
      series: [],
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    }
  });

  const fetchCategoriesData = async () => {
    try {
      console.log("Fetching categories data...");
      const response = await getAllCategories();
      
      let categoriesData = [];
      if (Array.isArray(response)) {
        categoriesData = response;
      } else if (response && Array.isArray(response.categories)) {
        categoriesData = response.categories;
      } else if (response && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else {
        // Try to find array in response object
        const maybeArray = Object.values(response || {}).find((v) => Array.isArray(v));
        if (Array.isArray(maybeArray)) {
          categoriesData = maybeArray;
        }
      }

      console.log("Categories data:", categoriesData);
      setCategories(categoriesData);
      return categoriesData;
    } catch (err) {
      console.error("Error fetching categories:", err);
      return [];
    }
  };

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      console.log("Fetching orders data...");
      
      // Fetch categories first
      const categoriesData = await fetchCategoriesData();
      
      // Then fetch orders
      const response = await getAllOrders();
      
      // Extract orders array from response
      let orders = [];
      if (Array.isArray(response)) {
        orders = response;
      } else if (response && Array.isArray(response.orders)) {
        orders = response.orders;
      } else if (response && Array.isArray(response.data)) {
        orders = response.data;
      } else {
        // Try to find array in response object
        const maybeArray = Object.values(response || {}).find((v) => Array.isArray(v));
        if (Array.isArray(maybeArray)) {
          orders = maybeArray;
        }
      }

      console.log("Raw orders data structure:", orders);
      console.log("First order sample:", orders[0]);
      
      // Process orders with categories data
      const processedData = processOrdersData(orders, categoriesData);
      console.log("Processed category data:", processedData.categoryStats);
      console.log("Processed product data:", processedData.productStats);
      console.log("Processed line chart data:", processedData.lineChartData);
      setOrderData(processedData);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrderData({
        totalOrders: 0,
        totalRevenue: 0,
        districts: [],
        topDistricts: [],
        recentOrders: [],
        categories: {},
        categoryStats: {
          labels: [],
          series: [],
          totalAmount: 0,
          colors: [],
          details: []
        },
        productStats: {
          labels: [],
          series: [],
          totalAmount: 0,
          colors: [],
          details: []
        },
        lineChartData: {
          series: [],
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = () => {
    fetchOrdersData();
  };

  useEffect(() => {
    fetchOrdersData();
  }, []);

  const handleDistrictHover = (districtName) => {
    setHoveredDistrict(districtName);
  };

  const toggleChartView = () => {
    setActiveChartView(activeChartView === 'categories' ? 'products' : 'categories');
  };

  const lineChartOptions = getLineChartOptions(orderData.lineChartData.categories);

  return (
    <Box 
      minH="100vh" 
      mt={9}
      p={{ base: 2, md: 3 }}
      overflow="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
          borderRadius: '3px',
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
        scrollbarWidth: 'thin',
        scrollbarColor: 'transparent transparent',
        '&:hover': {
          scrollbarColor: '#cbd5e1 transparent',
        },
      }}
    >
      {/* Stats Cards Row */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 3, md: 6 }} mb={6}>
        <Card bg={cardBg} boxShadow="lg" borderRadius="xl">
          <CardBody>
            <HStack justify="space-between">
              <Box>
                <Stat>
                  <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">Active Orders</StatLabel>
                  <StatNumber fontSize={{ base: "xl", md: "2xl" }} color="gray.800">
                    {loading ? <Spinner size="sm" /> : orderData.totalOrders}
                  </StatNumber>
                  <Text fontSize="sm" color="gray.500">
                    {loading ? 'Loading...' : `${orderData.districts.length} districts`}
                  </Text>
                </Stat>
              </Box>
              <Box>
                <Flex align="center" justify="center" w={12} h={12} borderRadius="xl" bg="#FEE2E2">
                  <FiShoppingCart size={20} color={accent} />
                </Flex>
              </Box>
            </HStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} boxShadow="lg" borderRadius="xl">
          <CardBody>
            <HStack justify="space-between">
              <Box>
                <Stat>
                  <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">Total Revenue</StatLabel>
                  <StatNumber fontSize={{ base: "xl", md: "2xl" }} color="gray.800">
                    {loading ? <Spinner size="sm" /> : `₹${orderData.totalRevenue.toLocaleString()}`}
                  </StatNumber>
                  <Text fontSize="sm" color="gray.500">
                    From all orders
                  </Text>
                </Stat>
              </Box>
              <Box>
                <Flex align="center" justify="center" w={12} h={12} borderRadius="xl" bg="#FEF3C7">
                  <FiDollarSign size={20} color="#D97706" />
                </Flex>
              </Box>
            </HStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} boxShadow="lg" borderRadius="xl">
          <CardBody>
            <HStack justify="space-between">
              <Box>
                <Stat>
                  <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
                    {activeChartView === 'categories' ? 'Categories' : 'Top Products'}
                  </StatLabel>
                  <StatNumber fontSize={{ base: "xl", md: "2xl" }} color="gray.800">
                    {loading ? <Spinner size="sm" /> : 
                      activeChartView === 'categories' 
                        ? orderData.categoryStats.details.length 
                        : orderData.productStats.details.length
                    }
                  </StatNumber>
                  <Text fontSize="sm" color="gray.500">
                    {activeChartView === 'categories' ? 'Product categories' : 'Best selling products'}
                  </Text>
                </Stat>
              </Box>
              <Box>
                <Flex align="center" justify="center" w={12} h={12} borderRadius="xl" bg="#DCFCE7">
                  <FiPackage size={20} color="#16A34A" />
                </Flex>
              </Box>
            </HStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Content Grid */}
      <Box 
        overflowY="auto"
        maxH="calc(100vh - 200px)"
        css={{
          '&::-webkit-scrollbar': {
            width: '6px',
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
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent',
          '&:hover': {
            scrollbarColor: '#cbd5e1 transparent',
          },
        }}
      >
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 6 }} minH="600px">
          {/* Left: Enhanced Donut Chart with Product Details */}
          <Card bg={cardBg} boxShadow="lg" borderRadius="xl" gridColumn={{ md: 'span 1' }}>
            <CardBody>
              <CategoryDonutChart 
                categoryStats={orderData.categoryStats}
                productStats={orderData.productStats}
                loading={loading}
                activeView={activeChartView}
                onViewChange={toggleChartView}
              />
            </CardBody>
          </Card>

          {/* Center: Modern 3D City Map */}
          <Card bg={cardBg} boxShadow="lg" borderRadius="xl" gridColumn={{ md: 'span 2' }}>
            <CardBody>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="sm" color="gray.700">Order Distribution Map</Heading>
                <Badge colorScheme="red" fontSize="sm">
                  Total Orders: {loading ? '...' : orderData.totalOrders}
                </Badge>
              </Flex>
              
              <Box 
                h="300px" 
                borderRadius="lg" 
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                overflow="hidden"
                position="relative"
              >
                <ModernCityMap 
                  districts={orderData.districts}
                  onDistrictHover={handleDistrictHover}
                  hoveredDistrict={hoveredDistrict}
                  loading={loading}
                />
              </Box>
            </CardBody>
          </Card>

          {/* Sales Trend Line Chart */}
          <Card bg={cardBg} boxShadow="lg" borderRadius="xl" gridColumn={{ md: 'span 2' }}>
            <CardBody>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="sm" color="gray.700">Sales Trend</Heading>
                <Badge colorScheme="green" fontSize="sm">
                  Monthly Revenue
                </Badge>
              </Flex>
              <Box height="240px">
                {loading ? (
                  <Flex justify="center" align="center" height="100%">
                    <Spinner size="lg" color="#5a189a" />
                  </Flex>
                ) : orderData.lineChartData.series.length > 0 ? (
                  <ReactApexChart 
                    options={lineChartOptions} 
                    series={orderData.lineChartData.series} 
                    type="line" 
                    height="100%" 
                  />
                ) : (
                  <Flex justify="center" align="center" height="100%" direction="column">
                    <Text color="gray.500" mb={2}>No sales data available</Text>
                    <Text fontSize="sm" color="gray.400">Sales trends will appear here once orders are processed</Text>
                  </Flex>
                )}
              </Box>
            </CardBody>
          </Card>

          {/* Bottom Left: Recent Orders */}
          <Card bg={cardBg} boxShadow="lg" borderRadius="xl" gridColumn={{ md: 'span 1' }}>
            <CardBody>
              <Flex align="center" mb={4}>
                <FiPackage color={accent} style={{ marginRight: '8px' }} />
                <Heading size="sm" color="gray.700">Recent Orders</Heading>
              </Flex>
              <RecentOrders orders={orderData.recentOrders} loading={loading} />
            </CardBody>
          </Card>

          {/* Bottom Right: Product Details */}
          <Card bg={cardBg} boxShadow="lg" borderRadius="xl" gridColumn={{ md: 'span 2' }}>
            <CardBody>
              <Heading size="sm" mb={4} color="gray.700">Top Products Performance</Heading>
              <ProductDetailsChart productStats={orderData.productStats} loading={loading} />
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>

      {/* Refresh Button */}
      <Flex justify="center" mt={4}>
        <Button
          leftIcon={<FiRefreshCw />}
          colorScheme="red"
          onClick={handleRefreshData}
          isLoading={loading}
        >
          Refresh Data
        </Button>
      </Flex>
    </Box>
  );
}