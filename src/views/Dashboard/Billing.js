
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Button,
  Flex,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Input,
  Select,
  Badge,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  Heading,
  Icon,
  IconButton,
  InputGroup,
  InputLeftElement,
  HStack,
  VStack,
  Progress,
  Avatar,
  AvatarGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  useToast,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { 
  FiShoppingCart, 
  FiCreditCard, 
  FiRepeat, 
  FiEye, 
  FiDownload, 
  FiCheckCircle,
  FiTruck,
  FiCalendar,
  FiUser,
  FiMoreVertical,
  FiSearch,
  FiFilter
} from "react-icons/fi";

export default function Billing() {
  const textColor = useColorModeValue("gray.800", "white");
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Modern color palette
  const colors = {
    primary: "#6366F1",
    primaryLight: "#818CF8",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
  };

  // Demo data
  const orders = [
    {
      _id: "ORD001",
      customer: "John Doe",
      customerEmail: "john@example.com",
      status: "pending",
      progress: 30,
      createdAt: "2024-01-15",
      deliveryDate: "2024-01-20",
      orderItems: [
        { name: "MacBook Pro 14\"", price: 1999, qty: 1, image: "💻" },
        { name: "Magic Mouse", price: 99, qty: 2, image: "🖱️" }
      ],
      assignedTeam: ["👨‍💼", "👩‍💻"]
    },
    {
      _id: "ORD002",
      customer: "Jane Smith",
      customerEmail: "jane@example.com",
      status: "confirmed",
      progress: 60,
      createdAt: "2024-01-16",
      deliveryDate: "2024-01-22",
      orderItems: [
        { name: "iPhone 15 Pro", price: 1199, qty: 1, image: "📱" },
        { name: "AirPods Pro", price: 249, qty: 1, image: "🎧" }
      ],
      assignedTeam: ["👨‍💼", "👩‍💻", "👨‍🔧"]
    },
    {
      _id: "ORD003",
      customer: "Mike Johnson",
      customerEmail: "mike@example.com",
      status: "delivered",
      progress: 100,
      createdAt: "2024-01-14",
      deliveryDate: "2024-01-18",
      orderItems: [
        { name: "iPad Air", price: 749, qty: 1, image: "📱" },
        { name: "Apple Pencil", price: 129, qty: 1, image: "✏️" }
      ],
      assignedTeam: ["👨‍💼", "👩‍💻"]
    }
  ];

  const payments = [
    { 
      _id: "PAY001", 
      orderId: "ORD001", 
      amount: 2197, 
      status: "pending", 
      method: "Credit Card",
      dueDate: "2024-01-25"
    },
    { 
      _id: "PAY002", 
      orderId: "ORD002", 
      amount: 1448, 
      status: "completed", 
      method: "PayPal",
      paidDate: "2024-01-16"
    }
  ];

  const transactions = [
    { 
      _id: "TXN001", 
      orderId: "ORD002", 
      amount: 1448, 
      type: "payment",
      status: "completed",
      createdAt: "2024-01-16",
      method: "PayPal"
    },
    { 
      _id: "TXN002", 
      orderId: "ORD003", 
      amount: 878, 
      type: "payment",
      status: "completed",
      createdAt: "2024-01-14",
      method: "Bank Transfer"
    }
  ];

  // Handlers
  const handleRowClick = (order) => {
    setSelectedOrder(order);
    onOpen();
  };

  const handleConfirmOrder = () => {
    toast({
      title: "Order Confirmed",
      description: `Order ${selectedOrder._id} has been confirmed`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    onClose();
  };

  const handleMarkDelivered = () => {
    toast({
      title: "Order Delivered",
      description: `Order ${selectedOrder._id} marked as delivered`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    onClose();
  };

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Invoice is being downloaded",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      delivered: { color: "white", bg: colors.success },
      confirmed: { color: "white", bg: colors.info },
      completed: { color: "white", bg: colors.success },
      pending: { color: "white", bg: colors.warning },
      success: { color: "white", bg: colors.success },
    };
    return statusColors[status] || { color: "white", bg: colors.primary };
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  return (
    <Box
      minH="100vh"
      bg={bgColor}
      p={{ base: 4, md: 6, lg: 8 }}
      mt="130px"
    >
      {/* Header */}
      <VStack spacing={6} align="stretch" mb={8}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <VStack align="start" spacing={2}>
            <Heading size="lg" color="gray.700" fontWeight="bold">
              Order Management
            </Heading>
            <Text color="gray.500" fontSize="md">
              Manage orders, payments, and transactions
            </Text>
          </VStack>
          
          <HStack spacing={3}>
            <Box position="relative">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg={cardBg}
                borderColor="gray.200"
                pl={10}
                w={{ base: "200px", md: "300px" }}
                _focus={{
                  borderColor: colors.primary,
                  boxShadow: `0 0 0 1px ${colors.primary}`
                }}
              />
              <Icon
                as={FiSearch}
                position="absolute"
                left={3}
                top="50%"
                transform="translateY(-50%)"
                color="gray.400"
              />
            </Box>
            <Button
              leftIcon={<FiFilter />}
              variant="outline"
              borderColor="gray.200"
              bg={cardBg}
            >
              Filter
            </Button>
          </HStack>
        </Flex>

        {/* Stats Boxes */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
          {/* Total Orders */}
          <Box 
            bg={cardBg} 
            p={6} 
            borderRadius="lg" 
            shadow="sm" 
            borderLeft={`4px solid ${colors.primary}`}
          >
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text color="gray.500" fontSize="sm">Total Orders</Text>
                <Text fontSize="2xl" fontWeight="bold" color="gray.700">
                  {orders.length}
                </Text>
                <Text fontSize="sm" color={colors.success}>
                  +12% this month
                </Text>
              </VStack>
              <Box p={3} bg={`${colors.primary}15`} borderRadius="lg">
                <Icon as={FiShoppingCart} boxSize={6} color={colors.primary} />
              </Box>
            </HStack>
          </Box>

          {/* Completed Orders */}
          <Box 
            bg={cardBg} 
            p={6} 
            borderRadius="lg" 
            shadow="sm" 
            borderLeft={`4px solid ${colors.success}`}
          >
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text color="gray.500" fontSize="sm">Completed</Text>
                <Text fontSize="2xl" fontWeight="bold" color="gray.700">
                  {orders.filter(o => o.status === 'delivered').length}
                </Text>
                <Text fontSize="sm" color={colors.success}>
                  85% success rate
                </Text>
              </VStack>
              <Box p={3} bg={`${colors.success}15`} borderRadius="lg">
                <Icon as={FiCheckCircle} boxSize={6} color={colors.success} />
              </Box>
            </HStack>
          </Box>

          {/* Revenue */}
          <Box 
            bg={cardBg} 
            p={6} 
            borderRadius="lg" 
            shadow="sm" 
            borderLeft={`4px solid ${colors.info}`}
          >
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text color="gray.500" fontSize="sm">Revenue</Text>
                <Text fontSize="2xl" fontWeight="bold" color="gray.700">
                  ₹{orders.reduce((sum, order) => sum + calculateTotal(order.orderItems), 0).toLocaleString()}
                </Text>
                <Text fontSize="sm" color={colors.success}>
                  +8% growth
                </Text>
              </VStack>
              <Box p={3} bg={`${colors.info}15`} borderRadius="lg">
                <Icon as={FiCreditCard} boxSize={6} color={colors.info} />
              </Box>
            </HStack>
          </Box>
        </Grid>
      </VStack>

      {/* Main Content Box */}
      <Box bg={cardBg} shadow="md" borderRadius="xl" overflow="hidden">
        {/* Tabs Header */}
        <Box p={6} borderBottom="1px solid" borderColor="gray.200">
          <Tabs 
            variant="soft-rounded" 
            colorScheme="purple"
            onChange={setActiveTab}
          >
            <TabList>
              <Tab
                _selected={{ 
                  bg: `${colors.primary}15`, 
                  color: colors.primary,
                  fontWeight: "semibold"
                }}
                fontSize="sm"
                fontWeight="medium"
              >
                <HStack spacing={2}>
                  <Icon as={FiShoppingCart} />
                  <Text>Orders</Text>
                  <Badge 
                    bg={`${colors.primary}20`} 
                    color={colors.primary}
                    borderRadius="full"
                    px={2}
                  >
                    {orders.length}
                  </Badge>
                </HStack>
              </Tab>
              <Tab
                _selected={{ 
                  bg: `${colors.info}15`, 
                  color: colors.info,
                  fontWeight: "semibold"
                }}
                fontSize="sm"
                fontWeight="medium"
              >
                <HStack spacing={2}>
                  <Icon as={FiCreditCard} />
                  <Text>Payments</Text>
                </HStack>
              </Tab>
              <Tab
                _selected={{ 
                  bg: `${colors.success}15`, 
                  color: colors.success,
                  fontWeight: "semibold"
                }}
                fontSize="sm"
                fontWeight="medium"
              >
                <HStack spacing={2}>
                  <Icon as={FiRepeat} />
                  <Text>Transactions</Text>
                </HStack>
              </Tab>
            </TabList>
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box p={6}>
          {activeTab === 0 && (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Order Details</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Customer</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Status</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Progress</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Team</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orders.map((order) => (
                    <Tr
                      key={order._id}
                      _hover={{ bg: "gray.50", cursor: "pointer" }}
                      onClick={() => handleRowClick(order)}
                      borderBottom="1px solid"
                      borderColor="gray.100"
                    >
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold" color="gray.800">
                            {order._id}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {order.orderItems.length} items
                          </Text>
                          <Text fontSize="sm" fontWeight="medium" color="gray.700">
                            ₹{calculateTotal(order.orderItems).toLocaleString()}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{order.customer}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {order.customerEmail}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge
                          bg={getStatusColor(order.status).bg}
                          color={getStatusColor(order.status).color}
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {order.status.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td>
                        <VStack spacing={1} align="start" w="120px">
                          <Progress 
                            value={order.progress} 
                            size="sm" 
                            w="100%"
                            colorScheme={
                              order.status === 'delivered' ? 'green' :
                              order.status === 'confirmed' ? 'blue' : 'orange'
                            }
                            borderRadius="full"
                          />
                          <Text fontSize="xs" color="gray.500">
                            {order.progress}% complete
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <AvatarGroup size="sm" max={3}>
                          {order.assignedTeam.map((emoji, index) => (
                            <Avatar key={index} name={emoji} src="" bg="transparent" />
                          ))}
                        </AvatarGroup>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={Button}
                            variant="ghost"
                            size="sm"
                          >
                            <Icon as={FiMoreVertical} />
                          </MenuButton>
                          <MenuList>
                            <MenuItem icon={<FiEye />} onClick={() => handleRowClick(order)}>
                              View Details
                            </MenuItem>
                            <MenuItem icon={<FiDownload />} onClick={handleDownload}>
                              Download Invoice
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          {activeTab === 1 && (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Payment ID</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Order ID</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Amount</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Method</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {payments.map((payment) => (
                    <Tr key={payment._id} borderBottom="1px solid" borderColor="gray.100">
                      <Td>
                        <Text fontWeight="semibold">{payment._id}</Text>
                      </Td>
                      <Td>
                        <Text color="gray.700">{payment.orderId}</Text>
                      </Td>
                      <Td>
                        <Text fontWeight="bold" color="gray.800" fontSize="lg">
                          ₹{payment.amount.toLocaleString()}
                        </Text>
                      </Td>
                      <Td>
                        <Badge variant="outline" colorScheme="blue">
                          {payment.method}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge
                          bg={getStatusColor(payment.status).bg}
                          color={getStatusColor(payment.status).color}
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {payment.status.toUpperCase()}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          {activeTab === 2 && (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Transaction ID</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Order ID</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Type</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Amount</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Date</Th>
                    <Th color="gray.600" fontSize="sm" fontWeight="semibold">Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactions.map((transaction) => (
                    <Tr key={transaction._id} borderBottom="1px solid" borderColor="gray.100">
                      <Td>
                        <Text fontWeight="semibold">{transaction._id}</Text>
                      </Td>
                      <Td>
                        <Text color="gray.700">{transaction.orderId}</Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={transaction.type === 'payment' ? 'green' : 'orange'}
                          variant="subtle"
                        >
                          {transaction.type}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontWeight="bold" color="gray.800" fontSize="lg">
                          ₹{transaction.amount.toLocaleString()}
                        </Text>
                      </Td>
                      <Td>
                        <Text color="gray.600">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </Text>
                      </Td>
                      <Td>
                        <Badge
                          bg={getStatusColor(transaction.status).bg}
                          color={getStatusColor(transaction.status).color}
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {transaction.status.toUpperCase()}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </Box>

      {/* Order Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
        <ModalContent bg={cardBg} borderRadius="2xl" overflow="hidden">
          <ModalHeader 
            bg={`${colors.primary}08`}
            borderBottom="1px solid"
            borderColor="gray.200"
          >
            <VStack align="start" spacing={2}>
              <Heading size="md">Order Details</Heading>
              <Text color="gray.600" fontSize="sm">
                Manage order status and delivery information
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {selectedOrder && (
              <VStack spacing={6} align="stretch">
                {/* Order Header */}
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                      {selectedOrder._id}
                    </Text>
                    <HStack spacing={4}>
                      <HStack>
                        <Icon as={FiUser} color="gray.500" />
                        <Text color="gray.600">{selectedOrder.customer}</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FiCalendar} color="gray.500" />
                        <Text color="gray.600">
                          {new Date(selectedOrder.createdAt).toLocaleDateString()}
                        </Text>
                      </HStack>
                    </HStack>
                  </VStack>
                  <Badge
                    bg={getStatusColor(selectedOrder.status).bg}
                    color={getStatusColor(selectedOrder.status).color}
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="md"
                    fontWeight="bold"
                  >
                    {selectedOrder.status.toUpperCase()}
                  </Badge>
                </HStack>

                <Divider />

                {/* Order Items */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>
                    Order Items
                  </Text>
                  <VStack spacing={3} align="stretch">
                    {selectedOrder.orderItems.map((item, index) => (
                      <HStack
                        key={index}
                        justify="space-between"
                        p={3}
                        bg="gray.50"
                        borderRadius="lg"
                      >
                        <HStack spacing={3}>
                          <Text fontSize="xl">{item.image}</Text>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">{item.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              ₹{item.price} × {item.qty}
                            </Text>
                          </VStack>
                        </HStack>
                        <Text fontWeight="bold" fontSize="lg">
                          ₹{(item.price * item.qty).toLocaleString()}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                {/* Total */}
                <Box bg={`${colors.primary}05`} p={4} borderRadius="lg">
                  <HStack justify="space-between">
                    <Text fontSize="xl" fontWeight="bold">
                      Total Amount
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={colors.primary}>
                      ₹{calculateTotal(selectedOrder.orderItems).toLocaleString()}
                    </Text>
                  </HStack>
                </Box>

                {/* Action Buttons */}
                <HStack spacing={3} justify="flex-end">
                  <Button
                    variant="outline"
                    leftIcon={<FiDownload />}
                    onClick={handleDownload}
                    borderColor="gray.300"
                  >
                    Download Invoice
                  </Button>
                  <Button
                    leftIcon={<FiCheckCircle />}
                    bg={colors.info}
                    _hover={{ bg: colors.primaryLight }}
                    color="white"
                    onClick={handleConfirmOrder}
                  >
                    Confirm Order
                  </Button>
                  <Button
                    leftIcon={<FiTruck />}
                    bg={colors.success}
                    _hover={{ bg: "#059669" }}
                    color="white"
                    onClick={handleMarkDelivered}
                  >
                    Mark Delivered
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}