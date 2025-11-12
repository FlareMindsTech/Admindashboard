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

// Process orders data
const processOrdersData = (orders) => {
  if (!orders || !Array.isArray(orders)) {
    return {
      totalOrders: 0,
      districts: [],
      topDistricts: [],
      recentOrders: [],
      totalRevenue: 0
    };
  }

  const districtOrders = {};
  let totalOrders = 0;
  let totalRevenue = 0;
  const recentOrders = [];

  orders.forEach((order) => {
    if (order.status && (order.status.toLowerCase() === 'confirmed' || 
                         order.status.toLowerCase() === 'completed' || 
                         order.status.toLowerCase() === 'delivered' || 
                         order.status.toLowerCase() === 'pending')) {
      totalOrders++;
      totalRevenue += order.totalAmount || order.price || 0;
      
      const district = extractDistrictFromAddress(order);
      
      if (!districtOrders[district]) {
        districtOrders[district] = 0;
      }
      
      districtOrders[district]++;

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
        amount: order.totalAmount || order.price || 0,
        status: order.status,
        district: district
      });
    }
  });

  const districts = Object.keys(districtOrders).map(district => {
    const ordersCount = districtOrders[district];
    const percentage = totalOrders > 0 ? (ordersCount / totalOrders) * 100 : 0;
    
    return {
      name: district,
      orders: ordersCount,
      percentage: parseFloat(percentage.toFixed(1))
    };
  });

  const filteredDistricts = districts
    .filter(district => !['Unknown', 'Other Districts'].includes(district.name))
    .sort((a, b) => b.orders - a.orders);

  const topDistricts = filteredDistricts.slice(0, 4);

  return {
    totalOrders,
    totalRevenue,
    districts: filteredDistricts,
    topDistricts,
    recentOrders: recentOrders.slice(0, 5)
  };
};

// Modern 3D City Map Component
const ModernCityMap = ({ districts, onDistrictHover, hoveredDistrict, loading }) => {
  const getDistrictData = (districtName) => {
    return districts.find(district => district.name === districtName) || { orders: 0, percentage: 0 };
  };

  // City zones with 3D building data
  const cityZones = [
    // Central Business District (High density)
    { 
      name: "Chennai", 
      center: [460, 200],
      buildings: [
        { x: 450, y: 190, width: 25, height: 40, floors: 12, color: "#e2e8f0" },
        { x: 480, y: 185, width: 20, height: 35, floors: 10, color: "#f1f5f9" },
        { x: 465, y: 210, width: 30, height: 45, floors: 15, color: "#cbd5e1" },
        { x: 440, y: 205, width: 22, height: 38, floors: 11, color: "#f1f5f9" },
        { x: 475, y: 195, width: 18, height: 32, floors: 9, color: "#e2e8f0" }
      ],
      pins: [
        { x: 455, y: 180, intensity: 1.0 },
        { x: 470, y: 175, intensity: 0.8 },
        { x: 465, y: 190, intensity: 0.9 },
        { x: 450, y: 195, intensity: 0.7 }
      ]
    },
    // Commercial Zone
    { 
      name: "Coimbatore", 
      center: [350, 250],
      buildings: [
        { x: 340, y: 240, width: 22, height: 35, floors: 8, color: "#f1f5f9" },
        { x: 365, y: 235, width: 28, height: 42, floors: 13, color: "#e2e8f0" },
        { x: 355, y: 255, width: 20, height: 30, floors: 7, color: "#f1f5f9" },
        { x: 370, y: 245, width: 25, height: 38, floors: 11, color: "#cbd5e1" }
      ],
      pins: [
        { x: 345, y: 230, intensity: 0.6 },
        { x: 360, y: 240, intensity: 0.8 },
        { x: 355, y: 250, intensity: 0.5 }
      ]
    },
    // Urban Center
    { 
      name: "Madurai", 
      center: [400, 300],
      buildings: [
        { x: 390, y: 290, width: 26, height: 40, floors: 12, color: "#cbd5e1" },
        { x: 415, y: 285, width: 24, height: 36, floors: 10, color: "#f1f5f9" },
        { x: 405, y: 305, width: 30, height: 44, floors: 14, color: "#e2e8f0" },
        { x: 395, y: 310, width: 20, height: 32, floors: 8, color: "#f1f5f9" }
      ],
      pins: [
        { x: 395, y: 280, intensity: 0.7 },
        { x: 410, y: 290, intensity: 0.9 },
        { x: 400, y: 300, intensity: 0.6 }
      ]
    },
    // Industrial Area
    { 
      name: "Salem", 
      center: [380, 220],
      buildings: [
        { x: 370, y: 210, width: 32, height: 28, floors: 6, color: "#e2e8f0" },
        { x: 390, y: 215, width: 28, height: 25, floors: 5, color: "#f1f5f9" },
        { x: 375, y: 225, width: 35, height: 30, floors: 7, color: "#cbd5e1" }
      ],
      pins: [
        { x: 375, y: 210, intensity: 0.4 },
        { x: 385, y: 220, intensity: 0.5 }
      ]
    },
    // Residential Zone
    { 
      name: "Tiruchirappalli", 
      center: [420, 280],
      buildings: [
        { x: 410, y: 270, width: 18, height: 25, floors: 4, color: "#f1f5f9" },
        { x: 430, y: 265, width: 20, height: 28, floors: 5, color: "#e2e8f0" },
        { x: 415, y: 285, width: 22, height: 30, floors: 6, color: "#f1f5f9" },
        { x: 425, y: 275, width: 16, height: 22, floors: 3, color: "#e2e8f0" }
      ],
      pins: [
        { x: 415, y: 265, intensity: 0.5 },
        { x: 425, y: 275, intensity: 0.7 },
        { x: 420, y: 285, intensity: 0.4 }
      ]
    }
  ];

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
      <svg
        viewBox="0 0 800 500"
        width="100%"
        height="100%"
        style={{ maxHeight: '300px' }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="cityBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          
          <linearGradient id="buildingShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
          </linearGradient>

          {/* Glow effects */}
          <filter id="pinGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 0.2 0 0 0  0 0 0.2 0 0  0 0 0 0.8 -0.3" result="glow"/>
          </filter>

          <filter id="buildingShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.15"/>
          </filter>
        </defs>

        {/* Background */}
        <rect width="100%" height="100%" fill="url(#cityBg)" />

        {/* Main Roads */}
        <g opacity="0.6">
          {/* Horizontal main roads */}
          <path d="M50,150 L750,150" stroke="#cbd5e1" strokeWidth="8" fill="none" />
          <path d="M100,250 L700,250" stroke="#cbd5e1" strokeWidth="6" fill="none" />
          <path d="M150,350 L650,350" stroke="#cbd5e1" strokeWidth="8" fill="none" />
          
          {/* Vertical main roads */}
          <path d="M200,100 L200,400" stroke="#cbd5e1" strokeWidth="6" fill="none" />
          <path d="M400,50 L400,450" stroke="#cbd5e1" strokeWidth="10" fill="none" />
          <path d="M600,100 L600,400" stroke="#cbd5e1" strokeWidth="6" fill="none" />
          
          {/* Secondary roads */}
          <path d="M300,180 L500,180" stroke="#e2e8f0" strokeWidth="4" fill="none" strokeDasharray="2,4" />
          <path d="M300,320 L500,320" stroke="#e2e8f0" strokeWidth="4" fill="none" strokeDasharray="2,4" />
          <path d="M280,200 L280,300" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeDasharray="1,3" />
          <path d="M520,200 L520,300" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeDasharray="1,3" />
        </g>

        {/* Draw 3D Buildings */}
        {cityZones.map((zone) => (
          <g key={zone.name} opacity={hoveredDistrict === zone.name ? 1 : 0.8}>
            {zone.buildings.map((building, index) => (
              <g key={index}>
                {/* Building shadow */}
                <rect
                  x={building.x + 3}
                  y={building.y + 3}
                  width={building.width}
                  height={building.height}
                  fill="url(#buildingShadow)"
                  opacity="0.3"
                />
                
                {/* Building main structure */}
                <rect
                  x={building.x}
                  y={building.y}
                  width={building.width}
                  height={building.height}
                  fill={building.color}
                  stroke="#94a3b8"
                  strokeWidth="0.5"
                  filter="url(#buildingShadow)"
                />
                
                {/* Building windows */}
                {Array.from({ length: building.floors }).map((_, floor) => (
                  <g key={floor}>
                    {Array.from({ length: Math.floor(building.width / 8) }).map((_, windowIndex) => (
                      <rect
                        key={windowIndex}
                        x={building.x + 4 + windowIndex * 8}
                        y={building.y + 4 + floor * 6}
                        width="4"
                        height="3"
                        fill="#cbd5e1"
                        opacity="0.6"
                      />
                    ))}
                  </g>
                ))}
              </g>
            ))}
          </g>
        ))}

        {/* Red Map Pins */}
        {cityZones.map((zone) => {
          const districtData = getDistrictData(zone.name);
          const intensity = districtData.percentage > 0 ? Math.min(districtData.percentage / 20, 1) : 0.3;
          
          return zone.pins.map((pin, pinIndex) => (
            <g key={`${zone.name}-${pinIndex}`} opacity={intensity}>
              {/* Pin glow */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r="12"
                fill="#DC2626"
                opacity="0.2"
                filter="url(#pinGlow)"
              />
              
              {/* Pin outer circle */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r="8"
                fill="#DC2626"
                opacity="0.4"
              />
              
              {/* Pin main */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r="5"
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth="2"
                onMouseEnter={() => onDistrictHover(zone.name)}
                onMouseLeave={() => onDistrictHover(null)}
                style={{ cursor: 'pointer' }}
              />
              
              {/* Pin highlight */}
              <circle
                cx={pin.x - 1}
                cy={pin.y - 1}
                r="1.5"
                fill="#FFFFFF"
                opacity="0.8"
              />
            </g>
          ));
        })}

        {/* Data visualization overlay */}
        <g opacity="0.1">
          {/* Data flow lines */}
          <path d="M460,200 L400,300" stroke="#DC2626" strokeWidth="2" strokeDasharray="3,3" />
          <path d="M460,200 L350,250" stroke="#DC2626" strokeWidth="2" strokeDasharray="3,3" />
          <path d="M400,300 L420,280" stroke="#DC2626" strokeWidth="2" strokeDasharray="3,3" />
          <path d="M350,250 L380,220" stroke="#DC2626" strokeWidth="2" strokeDasharray="3,3" />
        </g>
      </svg>

      {/* Info Panel */}
      <Box
        position="absolute"
        top="20px"
        right="20px"
        bg="white"
        p={4}
        borderRadius="xl"
        boxShadow="xl"
        border="1px solid"
        borderColor="gray.200"
        minW="200px"
        backdropFilter="blur(10px)"
      >
        <VStack spacing={3} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Order Analytics
          </Text>
          
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>Total Orders</Text>
            <Text fontSize="2xl" fontWeight="bold" color="#DC2626">
              {districts.reduce((sum, district) => sum + district.orders, 0).toLocaleString()}
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" color="gray.600" mb={2}>Top Districts</Text>
            <VStack spacing={2} align="stretch">
              {districts.slice(0, 3).map((district, index) => (
                <Flex key={district.name} justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.700" noOfLines={1}>
                    {district.name}
                  </Text>
                  <Badge colorScheme="red" fontSize="xs">
                    {district.orders}
                  </Badge>
                </Flex>
              ))}
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* Hover Tooltip */}
      {hoveredDistrict && (
        <Box
          position="absolute"
          bottom="20px"
          left="20px"
          bg="white"
          p={3}
          borderRadius="lg"
          boxShadow="lg"
          border="1px solid"
          borderColor="gray.200"
          minW="140px"
          backdropFilter="blur(10px)"
        >
          <Text fontSize="sm" fontWeight="bold" color="gray.800" mb={1}>
            {hoveredDistrict}
          </Text>
          <HStack spacing={2} mb={1}>
            <Box w="6px" h="6px" bg="#DC2626" borderRadius="full" />
            <Text fontSize="xs" color="gray.600">
              {getDistrictData(hoveredDistrict)?.orders || 0} orders
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.500">
            {getDistrictData(hoveredDistrict)?.percentage || 0}% of total
          </Text>
        </Box>
      )}
    </Box>
  );
};

// Recent Orders Component
const RecentOrders = ({ orders, loading }) => {
  const accent = '#DC2626';

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
    <VStack spacing={3} align="stretch" maxH="200px" overflowY="auto" css={{
      '&::-webkit-scrollbar': {
        width: '4px',
      },
      '&::-webkit-scrollbar-track': {
        width: '6px',
        background: '#f1f1f1',
        borderRadius: '24px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#cbd5e1',
        borderRadius: '24px',
      },
    }}>
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

// ApexCharts Configuration
const donutChartOptions = {
  chart: { type: 'donut' },
  labels: ['Electronics', 'Fashion', 'Home', 'Beauty'],
  colors: ['#DC2626', '#EA580C', '#D97706', '#CA8A04'],
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: { donut: { size: '65%' } }
  }
};

const donutChartSeries = [52, 30, 22, 16];

const lineChartOptions = {
  chart: {
    height: 350,
    type: 'line',
    zoom: { enabled: false },
    toolbar: { show: false }
  },
  colors: ['#DC2626', '#EA580C', '#D97706'],
  stroke: { width: 3, curve: 'smooth' },
  markers: { size: 2 },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    min: 0,
    labels: { formatter: (val) => val.toFixed(0) }
  },
  grid: { borderColor: '#f1f1f1' },
  legend: {
    position: 'bottom',
    horizontalAlign: 'center'
  }
};

const lineChartSeries = [
  { name: "Women's Kurta", data: [12, 18, 25, 35, 40, 55, 60, 75, 80, 95, 110, 125] },
  { name: 'Fashion', data: [8, 12, 16, 22, 28, 32, 38, 42, 48, 52, 60, 72] },
  { name: 'Home Kurta', data: [6, 9, 12, 18, 21, 26, 30, 34, 39, 44, 50, 58] }
];

export default function EcommerceDashboard() {
  const bg = useColorModeValue('linear-gradient(180deg,#fafafa 0%,#f5f5f5 100%)', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const accent = '#DC2626';

  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    districts: [],
    topDistricts: [],
    recentOrders: []
  });

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      const orders = response.data?.orders || response.data || response?.orders || response || [];
      const processedData = processOrdersData(orders);
      setOrderData(processedData);
    } catch (err) {
      console.error("Error fetching orders:", err);
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
    <Box 
      minH="100vh" 
      mt={9}
      p={3}
      overflow="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          width: '10px',
          background: '#f1f1f1',
          borderRadius: '24px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#cbd5e1',
          borderRadius: '24px',
          transition: 'background 0.3s ease',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#94a3b8',
        },
        // For Firefox
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 transparent',
      }}
    >
      {/* Stats Cards Row */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Card bg={cardBg} boxShadow="lg" borderRadius="xl">
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
                  <StatNumber fontSize="2xl" color="gray.800">
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
                <Flex align="center" justify="center" w={12} h={12} borderRadius="xl" bg="#DCFCE7">
                  <FiMapPin size={20} color="#16A34A" />
                </Flex>
              </Box>
            </HStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Content Grid - Made scrollable */}
      <Box 
        overflowY="auto"
        maxH="calc(100vh - 200px)"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '24px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e1',
            borderRadius: '24px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#94a3b8',
          },
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
        }}
      >
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} minH="600px">
          {/* Left: Donut Chart */}
          <Card bg={cardBg} boxShadow="lg" borderRadius="xl" gridColumn={{ md: 'span 1' }}>
            <CardBody>
              <Heading size="sm" mb={4} color="gray.700">Sales by Category</Heading>
              <Flex align="center" justify="space-between" height="200px">
                <Box w="60%" height="100%">
                  <ReactApexChart options={donutChartOptions} series={donutChartSeries} type="donut" height="100%" />
                </Box>
                <VStack spacing={3} align="flex-start">
                  <Text fontWeight="bold" fontSize="xl" color="gray.800">₹1,20,000</Text>
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

          {/* Bottom Right: Trend */}
          <Card bg={cardBg} boxShadow="lg" borderRadius="xl" gridColumn={{ md: 'span 2' }}>
            <CardBody>
              <Heading size="sm" mb={4} color="gray.700">Sales Trend</Heading>
              <Box height="240px">
                <ReactApexChart options={lineChartOptions} series={lineChartSeries} type="line" height="100%" />
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>
    </Box>
  );
}