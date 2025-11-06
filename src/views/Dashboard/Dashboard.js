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
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiBell, FiShoppingCart, FiUsers, FiDollarSign, FiMapPin, FiPackage, FiRefreshCw } from 'react-icons/fi';
import ReactApexChart from 'react-apexcharts';

// Import your order data function
import { getAllOrders } from '../utils/axiosInstance';

// Import your custom Card components
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";

// Tamil Nadu Districts Data with SVG paths
const tamilNaduDistricts = {
  "Chennai": { path: "M450,200 L460,210 L470,200 L460,190 Z", center: [455, 205] },
  "Coimbatore": { path: "M350,250 L370,240 L380,260 L360,270 Z", center: [365, 255] },
  "Madurai": { path: "M400,300 L420,290 L430,310 L410,320 Z", center: [415, 305] },
  "Salem": { path: "M380,220 L400,210 L410,230 L390,240 Z", center: [395, 225] },
  "Tiruchirappalli": { path: "M420,280 L440,270 L450,290 L430,300 Z", center: [435, 285] },
  "Tiruppur": { path: "M360,240 L380,230 L390,250 L370,260 Z", center: [375, 245] },
  "Erode": { path: "M370,260 L390,250 L400,270 L380,280 Z", center: [385, 265] },
  "Vellore": { path: "M410,180 L430,170 L440,190 L420,200 Z", center: [425, 185] },
  "Thoothukudi": { path: "M380,350 L400,340 L410,360 L390,370 Z", center: [395, 355] },
  "Tirunelveli": { path: "M370,330 L390,320 L400,340 L380,350 Z", center: [385, 335] },
  "Dindigul": { path: "M390,290 L410,280 L420,300 L400,310 Z", center: [405, 295] },
  "Thanjavur": { path: "M440,300 L460,290 L470,310 L450,320 Z", center: [455, 305] },
  "Kanchipuram": { path: "M430,200 L450,190 L460,210 L440,220 Z", center: [445, 205] },
  "Cuddalore": { path: "M450,250 L470,240 L480,260 L460,270 Z", center: [465, 255] },
  "Virudhunagar": { path: "M370,310 L390,300 L400,320 L380,330 Z", center: [385, 315] },
  "Kanyakumari": { path: "M350,370 L370,360 L380,380 L360,390 Z", center: [365, 375] }
};

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
// Enhanced function to extract district from address
const extractDistrictFromAddress = (order) => {
  // First, check if we have direct city/district fields in the order
  if (order.city) {
    console.log(`🏙️ Found city in order data:`, order.city);
    const cityDistrict = matchDistrictFromCity(order.city);
    if (cityDistrict !== 'Other Districts') {
      return cityDistrict;
    }
  }

  if (order.district) {
    console.log(`🗺️ Found district in order data:`, order.district);
    const directDistrict = matchDistrictFromCity(order.district);
    if (directDistrict !== 'Other Districts') {
      return directDistrict;
    }
  }

  // Handle address field - it might be an object or string
  let addressText = '';
  
  // If address is an object, try to extract text from common fields
  if (order.address && typeof order.address === 'object') {
    console.log("📍 Address is an object:", order.address);
    addressText = order.address.street || 
                  order.address.addressLine1 || 
                  order.address.fullAddress || 
                  order.address.city || 
                  JSON.stringify(order.address);
  } 
  // If shippingAddress is an object
  else if (order.shippingAddress && typeof order.shippingAddress === 'object') {
    console.log("📍 Shipping address is an object:", order.shippingAddress);
    addressText = order.shippingAddress.street || 
                  order.shippingAddress.addressLine1 || 
                  order.shippingAddress.fullAddress || 
                  order.shippingAddress.city || 
                  JSON.stringify(order.shippingAddress);
  }
  // If address is a string
  else if (typeof order.address === 'string') {
    addressText = order.address;
  }
  // If shippingAddress is a string
  else if (typeof order.shippingAddress === 'string') {
    addressText = order.shippingAddress;
  }

  console.log("📍 Final address text to process:", addressText);

  if (!addressText) {
    console.log("❌ No address information found");
    return 'Unknown';
  }

  const addressLower = addressText.toLowerCase();
  
  // District mapping for Tamil Nadu
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
      console.log(`✅ Found district in address: ${district}`);
      return district;
    }
  }

  console.log("❓ Could not identify district from address");
  return 'Other Districts';
};
// Process orders data with enhanced district extraction
// Process orders data with enhanced district extraction
const processOrdersData = (orders) => {
  if (!orders || !Array.isArray(orders)) {
    console.log("❌ No orders data provided");
    return {
      totalOrders: 0,
      districts: [],
      topDistricts: [],
      recentOrders: [],
      totalRevenue: 0
    };
  }

  console.log(`🔄 Processing ${orders.length} orders...`);

  const districtOrders = {};
  let totalOrders = 0;
  let totalRevenue = 0;
  const recentOrders = [];

  // Process each order
  orders.forEach((order, index) => {
    if (order.status && (order.status.toLowerCase() === 'confirmed' || 
                         order.status.toLowerCase() === 'completed' || 
                         order.status.toLowerCase() === 'delivered' || 
                         order.status.toLowerCase() === 'pending')) {
      totalOrders++;
      totalRevenue += order.totalAmount || order.price || 0;
      
      // Use enhanced district extraction that checks multiple fields
      const district = extractDistrictFromAddress(order);
      console.log(`📋 Order ${index + 1}: ${district}`);
      
      if (!districtOrders[district]) {
        districtOrders[district] = 0;
      }
      
      districtOrders[district]++;

      // Handle address formatting for display
      let displayAddress = 'No address provided';
      if (order.address) {
        if (typeof order.address === 'object') {
          // Format object address for display
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

      // Add to recent orders for display
      recentOrders.push({
        id: order.id || order._id || Math.random().toString(36).substr(2, 9),
        address: displayAddress,
        amount: order.totalAmount || order.price || 0,
        status: order.status,
        district: district
      });
    }
  });

  console.log("📊 Raw district orders:", districtOrders);

  // Convert to array format and calculate percentages
  const districts = Object.keys(districtOrders).map(district => {
    const ordersCount = districtOrders[district];
    const percentage = totalOrders > 0 ? (ordersCount / totalOrders) * 100 : 0;
    
    return {
      name: district,
      orders: ordersCount,
      percentage: parseFloat(percentage.toFixed(1))
    };
  });

  // Filter out "Unknown" and "Other Districts", sort by order count
  const filteredDistricts = districts
    .filter(district => !['Unknown', 'Other Districts'].includes(district.name))
    .sort((a, b) => b.orders - a.orders);

  const topDistricts = filteredDistricts.slice(0, 4);

  const result = {
    totalOrders,
    totalRevenue,
    districts: filteredDistricts,
    topDistricts,
    recentOrders: recentOrders.slice(0, 5) // Get only latest 5 orders
  };

  console.log("✅ Final dashboard data:", result);
  return result;
};
// Recent Orders Component
const RecentOrders = ({ orders, loading }) => {
  const accent = '#FF7A59';

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'green';
      case 'completed':
        return 'blue';
      case 'confirmed':
        return 'orange';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
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
            <Badge 
              variant="subtle" 
              colorScheme="gray" 
              fontSize="xs"
            >
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

// Tamil Nadu Map Component
const TamilNaduMap = ({ districts, onDistrictHover, hoveredDistrict, loading }) => {
  const getDistrictColor = (percentage) => {
    if (percentage >= 20) return '#FF7A59';
    if (percentage >= 10) return '#FF9D7A';
    if (percentage >= 5) return '#FFC0A6';
    if (percentage >= 2) return '#FFE2D3';
    return '#F5F5F5';
  };

  const getDistrictOpacity = (districtName) => {
    return hoveredDistrict === districtName ? 1 : 0.8;
  };

  const getDistrictData = (districtName) => {
    return districts.find(district => district.name === districtName) || { orders: 0, percentage: 0 };
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100%" bg="gray.50" borderRadius="lg">
        <VStack spacing={3}>
          <Spinner size="lg" color="#FF7A59" />
          <Text color="gray.500" fontSize="sm">Loading district data...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box position="relative" width="100%" height="100%">
      <svg
        viewBox="0 0 800 600"
        width="100%"
        height="100%"
        style={{ maxHeight: '240px' }}
      >
        {/* Background */}
        <rect width="100%" height="100%" fill="#fef3f2" />
        
        {/* Draw each district */}
        {Object.entries(tamilNaduDistricts).map(([districtName, districtData]) => {
          const districtInfo = getDistrictData(districtName);
          
          return (
            <Tooltip 
              key={districtName}
              label={
                <Box textAlign="center">
                  <Text fontWeight="bold">{districtName}</Text>
                  <Text>Orders: {districtInfo.orders}</Text>
                  <Text>Percentage: {districtInfo.percentage}%</Text>
                </Box>
              } 
              hasArrow 
              bg="white" 
              color="gray.800"
              borderRadius="md"
              boxShadow="lg"
            >
              <path
                d={districtData.path}
                fill={getDistrictColor(districtInfo.percentage)}
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity={getDistrictOpacity(districtName)}
                onMouseEnter={() => onDistrictHover(districtName)}
                onMouseLeave={() => onDistrictHover(null)}
                style={{ 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  transform: hoveredDistrict === districtName ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center'
                }}
              />
            </Tooltip>
          );
        })}

        {/* Legend */}
        <g transform="translate(600, 30)">
          <text x="0" y="0" fontSize="12" fontWeight="bold" fill="#4A5568">
            Order Density
          </text>
          <rect x="0" y="15" width="15" height="15" fill="#FF7A59" />
          <text x="20" y="27" fontSize="10" fill="#4A5568">High (20%+)</text>
          <rect x="0" y="35" width="15" height="15" fill="#FF9D7A" />
          <text x="20" y="47" fontSize="10" fill="#4A5568">Medium (10-20%)</text>
          <rect x="0" y="55" width="15" height="15" fill="#FFC0A6" />
          <text x="20" y="67" fontSize="10" fill="#4A5568">Low (5-10%)</text>
          <rect x="0" y="75" width="15" height="15" fill="#FFE2D3" />
          <text x="20" y="87" fontSize="10" fill="#4A5568">Very Low (2-5%)</text>
        </g>

        {/* Title */}
        <text x="400" y="50" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#2D3748">
          Tamil Nadu - Order Distribution
        </text>
      </svg>
    </Box>
  );
};

// District Summary Component
const DistrictSummary = ({ districts, totalOrders, loading }) => {
  const accent = '#FF7A59';

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100%">
        <Spinner size="sm" color={accent} />
      </Flex>
    );
  }

  if (districts.length === 0) {
    return (
      <Text color="gray.500" textAlign="center" fontSize="sm">
        No district data available
      </Text>
    );
  }

  return (
    <SimpleGrid columns={2} spacing={4}>
      {districts.map((district, index) => (
        <Box 
          key={district.name} 
          textAlign="center" 
          p={3} 
          borderRadius="lg" 
          bg="white"
          boxShadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <Text fontSize="lg" fontWeight="bold" color={accent}>
            {district.orders}
          </Text>
          <Text fontSize="xs" color="gray.600" noOfLines={1} fontWeight="medium">
            {district.name}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {district.percentage}%
          </Text>
          <Progress
            value={district.percentage}
            max={districts[0]?.percentage || 100}
            size="xs"
            colorScheme="orange"
            mt={2}
            borderRadius="full"
          />
        </Box>
      ))}
    </SimpleGrid>
  );
};

// ApexCharts Configuration
const donutChartOptions = {
  chart: {
    type: 'donut',
  },
  labels: ['Electronics', 'Fashion', 'Home', 'Beauty'],
  colors: ['#FF7A59', '#FFD166', '#52C7B8', '#8AB4FF'],
  legend: {
    show: false,
  },
  dataLabels: {
    enabled: false,
  },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
      }
    }
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 200
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
};

const donutChartSeries = [52, 30, 22, 16];

const lineChartOptions = {
  chart: {
    height: 350,
    type: 'line',
    zoom: {
      enabled: false
    },
    toolbar: {
      show: false
    }
  },
  colors: ['#FF7A59', '#8AB4FF', '#52C7B8'],
  stroke: {
    width: 3,
    curve: 'smooth'
  },
  markers: {
    size: 2,
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    }
  },
  yaxis: {
    min: 0,
    labels: {
      formatter: function (val) {
        return val.toFixed(0);
      }
    }
  },
  grid: {
    borderColor: '#f1f1f1',
  },
  legend: {
    position: 'bottom',
    horizontalAlign: 'center',
    itemMargin: {
      horizontal: 10,
      vertical: 5
    },
    markers: {
      radius: 12
    }
  }
};

const lineChartSeries = [
  {
    name: "Women's Kurta",
    data: [12, 18, 25, 35, 40, 55, 60, 75, 80, 95, 110, 125]
  },
  {
    name: 'Fashion',
    data: [8, 12, 16, 22, 28, 32, 38, 42, 48, 52, 60, 72]
  },
  {
    name: 'Home Kurta',
    data: [6, 9, 12, 18, 21, 26, 30, 34, 39, 44, 50, 58]
  }
];

export default function EcommerceDashboard() {
  const bg = useColorModeValue('linear-gradient(180deg,#f6fbfb 0%,#eef8f8 100%)', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const accent = '#FF7A59';

  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    districts: [],
    topDistricts: [],
    recentOrders: []
  });

  // Fetch and process orders data from backend
  // Fetch and process orders data from backend
const fetchOrdersData = async () => {
  try {
    setLoading(true);
    console.log("📦 Fetching orders data from backend...");

    // 1️⃣ Fetch orders from API
    const response = await getAllOrders();

    // 2️⃣ Handle multiple possible response formats
    const orders =
      response.data?.orders ||
      response.data ||
      response?.orders ||
      response ||
      [];

    console.log(`📊 Processing ${orders.length} orders from backend...`);

    // 3️⃣ Log the structure of first few orders to understand data format
    if (orders.length > 0) {
      console.log("🔍 Sample order structure:", orders.slice(0, 3));
      
      // Specifically check address structure
      orders.slice(0, 3).forEach((order, index) => {
        console.log(`📍 Order ${index} address field:`, order.address);
        console.log(`📍 Order ${index} address type:`, typeof order.address);
        console.log(`📍 Order ${index} shippingAddress:`, order.shippingAddress);
        console.log(`📍 Order ${index} shippingAddress type:`, typeof order.shippingAddress);
      });
    }

    // 4️⃣ Process the orders data for dashboard visualization
    const processedData = processOrdersData(orders);
    console.log('🗺️ Processed district data from backend:', processedData);

    // 5️⃣ Update React state
    setOrderData(processedData);
    
  } catch (err) {
    console.error("❌ Error fetching orders from backend:", err);

    // fallback data
    setOrderData({
      totalOrders: 0,
      totalRevenue: 0,
      districts: [],
      topDistricts: [],
      recentOrders: [],
    });
  } finally {
    setLoading(false);
  }
};
  // Manual refresh function
  const handleRefreshData = () => {
    fetchOrdersData();
  };

  useEffect(() => {
    fetchOrdersData();
  }, []);

  const handleDistrictHover = (districtName) => {
    setHoveredDistrict(districtName);
  };

  return (
    <Box minH="100vh" p={8} bgGradient={bg}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Welcome back!</Heading>
          <Text color="gray.600">Your E-commerce Overview</Text>
        </Box>

        <HStack spacing={4}>
          <Input placeholder="Search orders, addresses..." maxW="380px" bg={cardBg} boxShadow="sm" />
          <IconButton 
            aria-label="Refresh data" 
            icon={<FiRefreshCw />} 
            onClick={handleRefreshData}
            isLoading={loading}
          />
          <IconButton aria-label="notifications" icon={<FiBell />} />
          <Avatar name="Admin" size="sm" src="https://i.pravatar.cc/150?img=3" />
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Card bg={cardBg} boxShadow="sm" borderRadius="xl">
          <CardBody>
            <HStack justify="space-between">
              <Box>
                <Stat>
                  <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">Active Orders</StatLabel>
                  <StatNumber fontSize="2xl" color="gray.800">
                    {loading ? <Spinner size="sm" /> : orderData.totalOrders}
                  </StatNumber>
                  <Text fontSize="sm" color="gray.500">
                    {loading ? 'Loading...' : `${orderData.districts.length} districts`}
                  </Text>
                </Stat>
              </Box>
              <Box>
                <Flex align="center" justify="center" w={12} h={12} borderRadius="xl" bg="#FFF5F2">
                  <FiShoppingCart size={20} color={accent} />
                </Flex>
              </Box>
            </HStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} boxShadow="sm" borderRadius="xl">
          <CardBody>
            <HStack justify="space-between">
              <Box>
                <Stat>
                  <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">Total Revenue</StatLabel>
                  <StatNumber fontSize="2xl" color="gray.800">
                    {loading ? <Spinner size="sm" /> : `₹${orderData.totalRevenue.toLocaleString()}`}
                  </StatNumber>
                  <Text fontSize="sm" color="gray.500">
                    From all orders
                  </Text>
                </Stat>
              </Box>
              <Box>
                <Flex align="center" justify="center" w={12} h={12} borderRadius="xl" bg="#F0F9FF">
                  <FiDollarSign size={20} color="#2B6CB0" />
                </Flex>
              </Box>
            </HStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} boxShadow="sm" borderRadius="xl">
          <CardBody>
            <HStack justify="space-between">
              <Box>
                <Stat>
                  <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">Districts Covered</StatLabel>
                  <StatNumber fontSize="2xl" color="gray.800">
                    {loading ? <Spinner size="sm" /> : orderData.districts.length}
                  </StatNumber>
                  <Text fontSize="sm" color="gray.500">
                    Across Tamil Nadu
                  </Text>
                </Stat>
              </Box>
              <Box>
                <Flex align="center" justify="center" w={12} h={12} borderRadius="xl" bg="#F6FFFA">
                  <FiMapPin size={20} color="#38A169" />
                </Flex>
              </Box>
            </HStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} minH="320px">
        {/* Left: Donut Chart */}
        <Card bg={cardBg} boxShadow="sm" borderRadius="xl" gridColumn={{ md: 'span 1' }}>
          <CardBody>
            <Heading size="sm" mb={4} color="gray.700">Sales by Category</Heading>
            <Flex align="center" justify="space-between" height="200px">
              <Box w="60%" height="100%">
                <ReactApexChart
                  options={donutChartOptions}
                  series={donutChartSeries}
                  type="donut"
                  height="100%"
                />
              </Box>
              <VStack spacing={3} align="flex-start">
                <Text fontWeight="bold" fontSize="xl" color="gray.800">
                  ₹1,20,000
                </Text>
                <Text fontSize="sm" color="gray.500">Total Sales</Text>
                {donutChartOptions.labels.map((label, i) => (
                  <HStack key={label} spacing={3}>
                    <Box w={3} h={3} bg={donutChartOptions.colors[i]} borderRadius="full" />
                    <Text fontSize="sm" color="gray.700">
                      {label} <Text as="span" color="gray.500">₹{donutChartSeries[i]}K</Text>
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Center: Tamil Nadu District Map */}
        <Card bg={cardBg} boxShadow="sm" borderRadius="xl" gridColumn={{ md: 'span 2' }}>
          <CardBody>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="sm" color="gray.700">Order Distribution Map</Heading>
              <Badge colorScheme="orange" fontSize="sm">
                Total Orders: {loading ? '...' : orderData.totalOrders}
              </Badge>
            </Flex>
            
            <Box 
              h="240px" 
              borderRadius="lg" 
              bgGradient="linear(to-r, #fef3f2, #f3fff9)" 
              border="1px solid"
              borderColor="gray.200"
              overflow="hidden"
              position="relative"
            >
              <TamilNaduMap 
                districts={orderData.districts}
                onDistrictHover={handleDistrictHover}
                hoveredDistrict={hoveredDistrict}
                loading={loading}
              />
              
              {/* Hover Info Display */}
              {hoveredDistrict && (
                <Box
                  position="absolute"
                  top="10px"
                  left="10px"
                  bg="white"
                  p={3}
                  borderRadius="md"
                  boxShadow="lg"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontSize="sm" fontWeight="bold" color="gray.800">
                    {hoveredDistrict}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {orderData.districts.find(d => d.name === hoveredDistrict)?.orders || 0} orders
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {orderData.districts.find(d => d.name === hoveredDistrict)?.percentage || 0}%
                  </Text>
                </Box>
              )}
            </Box>

            {/* District Summary Grid */}
            <Box mt={4}>
              <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={3}>
                Top Performing Districts
              </Text>
              <DistrictSummary 
                districts={orderData.topDistricts}
                totalOrders={orderData.totalOrders}
                loading={loading}
              />
            </Box>
          </CardBody>
        </Card>

        {/* Bottom Left: Recent Orders with Addresses */}
        <Card bg={cardBg} boxShadow="sm" borderRadius="xl" gridColumn={{ md: 'span 1' }}>
          <CardBody>
            <Flex align="center" mb={4}>
              <FiPackage color={accent} style={{ marginRight: '8px' }} />
              <Heading size="sm" color="gray.700">Recent Orders</Heading>
            </Flex>
            <RecentOrders 
              orders={orderData.recentOrders}
              loading={loading}
            />
          </CardBody>
        </Card>

        {/* Bottom Right: Trend */}
        <Card bg={cardBg} boxShadow="sm" borderRadius="xl" gridColumn={{ md: 'span 2' }}>
          <CardBody>
            <Heading size="sm" mb={4} color="gray.700">Sales Trend</Heading>
            <Box height="240px">
              <ReactApexChart
                options={lineChartOptions}
                series={lineChartSeries}
                type="line"
                height="100%"
              />
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
}