// billing
// CleanedBilling.js (Mobile-friendly table / compact-scroll version)
// Updated to keep table layout but be responsive & mobile-friendly.
// - Horizontal scroll on small screens
// - Compact table sizes on mobile
// - Filters & search stacked on mobile
// - Pagination buttons full-width / touch-friendly on mobile
// - Bugfix: Confirm_Order calls fetchOrders()
// - Keep rest of features identical to original file

/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Icon,
  Input,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
  useToast,
  Spinner,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Center,
  Divider,
  Image,
  Select,
  Tooltip,
  InputGroup,
  InputRightElement,
  VisuallyHidden,
  useBreakpointValue,
} from "@chakra-ui/react";

import { FaSearch, FaChevronLeft, FaChevronRight, FaArrowLeft, FaTimes } from "react-icons/fa";
import { FiMoreVertical, FiEye, FiDownload, FiUser, FiCalendar, FiTruck } from "react-icons/fi";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdCategory } from "react-icons/md";

// Replace this import with your project's API helper.
// getAllOrders should return data in one of these shapes:
//  - an array of orders
//  - an object { orders: [...] }
//  - an object { data: [...] }
import { getAllOrders, updateOrders } from "../utils/axiosInstance";

// Lightweight presentational Card components so this file is self-contained.
const Card = ({ children, ...props }) => <Box borderRadius="12px" p={0} {...props}>{children}</Box>;
const CardHeader = ({ children, ...props }) => <Box px="16px" py="12px" borderBottomWidth="1px" {...props}>{children}</Box>;
const CardBody = ({ children, ...props }) => <Box p="16px" {...props}>{children}</Box>;

/** Helper & Utilities **/
const safeGet = (obj, path, fallback = undefined) => {
  if (!path) return fallback;
  try {
    return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback;
  } catch {
    return fallback;
  }
};

const formatINR = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "₹0";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
  } catch {
    return `₹${num}`;
  }
};

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const getDateRangePreset = (preset) => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  let start = null;
  switch ((preset || "all").toLowerCase()) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      break;
    case "this_week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0).getTime();
      break;
    }
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      break;
    case "this_year":
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
      break;
    case "all":
    default:
      start = null;
  }
  return [start, end];
};

const exportToCSV = (filename, rows) => {
  if (!rows || !rows.length) {
    const blob = new Blob(["No data"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")].concat(rows.map((row) =>
    headers.map((h) => {
      const v = row[h] === undefined || row[h] === null ? "" : String(row[h]);
      return `"${v.replace(/"/g, '""')}"`;
    }).join(",")
  )).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/** Constants **/
const DEFAULT_CUSTOM_COLOR = "#7b2cbf";
const DEFAULT_CUSTOM_HOVER = "#5a189a";

const STATUS_COLORS = {
  delivered: { bg: "#10B981", color: "white" },
  confirmed: { bg: "#3B82F6", color: "white" },
  pending: { bg: "#F59E0B", color: "white" },
  default: { bg: "#6366F1", color: "white" },
};

const ORDER_STATUS_OPTIONS = ["all", "pending", "confirmed", "delivered", "completed", "failed", "refunded"];
const PAYMENT_METHOD_OPTIONS = ["all", "card", "upi", "netbanking", "cod", "wallet", "bank_transfer"];
const PAYMENT_STATUS_OPTIONS = ["all", "success", "failed", "refunded", "pending"];

/** Main component **/
export default function CleanedBilling() {
  const textColor = useColorModeValue("gray.700", "white");
  const cardBg = useColorModeValue("white", "gray.800");
  const toast = useToast();

  const customColor = DEFAULT_CUSTOM_COLOR;
  const customHoverColor = DEFAULT_CUSTOM_HOVER;

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = window?.localStorage?.getItem?.("user");
      return raw ? JSON.parse(raw) : { role: "admin", name: "Local Dev" };
    } catch {
      return null;
    }
  });

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const payments = useMemo(() => {
    const list = [];
    (orders || []).forEach((o) => {
      const p = safeGet(o, "payment", null) || safeGet(o, "payment_response", null) || safeGet(o, "paymentResponse", null);
      if (p && typeof p === "object") {
        list.push({ ...p, orderId: safeGet(o, "_id", null), orderRef: o });
      }
    });
    return list;
  }, [orders]);

  const [currentView, setCurrentView] = useState("orders");

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 220);

  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderDatePreset, setOrderDatePreset] = useState("all");

  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentDatePreset, setPaymentDatePreset] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchRef = useRef(null);

  // Responsive detection
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        if (searchRef?.current) searchRef.current.focus();
      }
      if (e.key === "Escape") {
        // Clear search on Esc for quick mobile UX
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fetching orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await getAllOrders();
      if (Array.isArray(res)) setOrders(res);
      else if (res && Array.isArray(res.orders)) setOrders(res.orders);
      else if (res && Array.isArray(res.data)) setOrders(res.data);
      else {
        const maybeArray = Object.values(res || {}).find((v) => Array.isArray(v));
        if (Array.isArray(maybeArray)) setOrders(maybeArray);
        else setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setFetchError(err?.message || "Unknown error");
      toast({ title: "Failed to load orders", description: err?.message || "See console", status: "error", duration: 4000, isClosable: true });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filtering logic
  const filteredOrders = useMemo(() => {
    const q = (debouncedSearch || "").trim().toLowerCase();
    const [orderStart, orderEnd] = getDateRangePreset(orderDatePreset);

    return (orders || []).filter((o) => {
      const status = (safeGet(o, "status", "") || "").toString().toLowerCase();
      if (orderStatusFilter !== "all" && status !== orderStatusFilter) return false;

      if (orderStart != null) {
        const created = new Date(safeGet(o, "createdAt", Date.now())).getTime();
        if (!(created >= orderStart && created <= orderEnd)) return false;
      }

      if (!q) return true;
      const id = (safeGet(o, "_id", "") || "").toString().toLowerCase();
      const email = (safeGet(o, "user.email", "") || "").toString().toLowerCase();
      const userId = (safeGet(o, "user._id", "") || "").toString().toLowerCase();
      const city = (safeGet(o, "address.city", "") || "").toString().toLowerCase();
      const pincode = (safeGet(o, "address.pincode", "") || "").toString().toLowerCase();
      const itemNames = (safeGet(o, "orderItems", []) || []).map((it) => `${safeGet(it, "name", "")}`).join(" ").toLowerCase();

      return (
        id.includes(q) ||
        email.includes(q) ||
        userId.includes(q) ||
        city.includes(q) ||
        pincode.includes(q) ||
        itemNames.includes(q)
      );
    });
  }, [orders, debouncedSearch, orderStatusFilter, orderDatePreset]);

  const filteredPayments = useMemo(() => {
    const q = (debouncedSearch || "").trim().toLowerCase();
    const [payStart, payEnd] = getDateRangePreset(paymentDatePreset);

    return (payments || []).filter((p) => {
      const method = (safeGet(p, "method", "") || "").toString().toLowerCase();
      if (paymentMethodFilter !== "all" && method !== paymentMethodFilter) return false;

      const status = (safeGet(p, "status", "") || "").toString().toLowerCase();
      if (paymentStatusFilter !== "all" && status !== paymentStatusFilter) return false;

      let createdAt = null;
      if (safeGet(p, "createdAt", null)) createdAt = new Date(safeGet(p, "createdAt")).getTime();
      else if (safeGet(p, "orderRef.createdAt", null)) createdAt = new Date(safeGet(p, "orderRef.createdAt")).getTime();

      if (payStart != null) {
        if (createdAt == null) return false;
        if (!(createdAt >= payStart && createdAt <= payEnd)) return false;
      }

      if (!q) return true;
      const pid = (safeGet(p, "_id", "") || "").toString().toLowerCase();
      const razor = (safeGet(p, "razorpayOrderId", "") || "").toString().toLowerCase();
      const orderId = (safeGet(p, "orderId", "") || "").toString().toLowerCase();
      return pid.includes(q) || razor.includes(q) || orderId.includes(q) || method.includes(q) || status.includes(q);
    });
  }, [payments, debouncedSearch, paymentMethodFilter, paymentStatusFilter, paymentDatePreset]);

  // Pagination
  const totalPages = useMemo(() => {
    const len = currentView === "orders" ? filteredOrders.length : filteredPayments.length;
    return Math.max(1, Math.ceil(len / itemsPerPage));
  }, [currentView, filteredOrders, filteredPayments, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentView, debouncedSearch, orderStatusFilter, paymentMethodFilter, paymentStatusFilter, orderDatePreset, paymentDatePreset, itemsPerPage]);

  const currentSlice = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return currentView === "orders" ? filteredOrders.slice(start, end) : filteredPayments.slice(start, end);
  }, [currentPage, itemsPerPage, currentView, filteredOrders, filteredPayments]);

  // UI helpers
  const getStatusColor = (status) => {
    if (!status) return STATUS_COLORS.default;
    const n = status.toString().toLowerCase();
    return STATUS_COLORS[n] || STATUS_COLORS.default;
  };

  const openModalForOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleDownloadInvoice = (order) => {
    toast({ title: "Download", description: `Requesting invoice for ${safeGet(order, "_id", "order")}`, status: "info", duration: 3000, isClosable: true });
  };

  const goPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const prepareOrdersExportRows = () => {
    return (filteredOrders || []).map((o) => ({
      orderId: safeGet(o, "_id", ""),
      email: safeGet(o, "user.email", ""),
      items: (safeGet(o, "orderItems", []) || []).map((it) => `${safeGet(it, "name", "")} x${safeGet(it, "qty", 1)}`).join("; "),
      amount: safeGet(o, "total_amount", 0),
      status: safeGet(o, "status", ""),
      createdAt: safeGet(o, "createdAt", ""),
    }));
  };

  const preparePaymentsExportRows = () => {
    return (filteredPayments || []).map((p) => ({
      paymentId: safeGet(p, "_id", ""),
      razorpayOrderId: safeGet(p, "razorpayOrderId", ""),
      orderId: safeGet(p, "orderId", ""),
      method: safeGet(p, "method", ""),
      amount: safeGet(p, "amount", 0),
      status: safeGet(p, "status", ""),
      createdAt: safeGet(p, "createdAt", safeGet(p, "orderRef.createdAt", "")),
    }));
  };

  // Fixed Confirm_Order (calls fetchOrders)
  const Confirm_Order = async () => {
    try {
      const orderId = safeGet(selectedOrder, "_id");
      await updateOrders(orderId, { status: "Confirmed" });

      toast({
        title: "Order Confirmed",
        description: `Order ${orderId} marked as confirmed.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      await fetchOrders();
      closeModal();
    } catch (error) {
      console.error("Error confirming order:", error);
      toast({
        title: "Error",
        description: "Failed to confirm the order. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const markAsDelivered = async () => {
    try {
      const orderId = safeGet(selectedOrder, "_id");
      await updateOrders(orderId, { status: "delivered" });

      toast({
        title: "Order Delivered",
        description: `Order ${orderId} marked as delivered.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      await fetchOrders();
      closeModal();
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      toast({
        title: "Error",
        description: "Failed to mark the order as delivered. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Row components
  const OrderRow = ({ order }) => {
    const status = safeGet(order, "status", "pending");
    return (
      <Tr _hover={{ bg: "gray.50", cursor: "pointer" }} onClick={() => openModalForOrder(order)} borderBottom="1px solid" borderColor="gray.100">
        <Td px={isMobile ? 3 : 6} py={isMobile ? 2 : 3}>
          <VStack align="start" spacing={1}>
            <Text fontWeight="semibold" color="gray.700" fontSize={isMobile ? "sm" : "md"}>{safeGet(order, "user.email", "—")}</Text>
            <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">{safeGet(order, "user._id", "")}</Text>
            <Text fontSize="xs" color="gray.500">{safeGet(order, "orderItems.length", 0)} items</Text>
          </VStack>
        </Td>

        <Td px={isMobile ? 3 : 6} py={isMobile ? 2 : 3}>
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium" fontSize={isMobile ? "sm" : "md"}>{safeGet(order, "address.city", "—")} ({safeGet(order, "address.pincode", "—")})</Text>
            <Text fontSize="xs" color="gray.500">{safeGet(order, "address.state", "—")}</Text>
            <Text fontSize="xs" color="gray.500">{safeGet(order, "address.country", "—")}</Text>
          </VStack>
        </Td>

        <Td px={isMobile ? 3 : 6} py={isMobile ? 2 : 3}>
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium" fontSize={isMobile ? "sm" : "md"}>{formatINR(safeGet(order, "total_amount", 0))}</Text>
            <Text fontSize="xs" color="gray.500">{new Date(safeGet(order, "createdAt", Date.now())).toLocaleDateString()}</Text>
          </VStack>
        </Td>

        <Td px={isMobile ? 3 : 6} py={isMobile ? 2 : 3}>
          <Badge bg={getStatusColor(status).bg} color={getStatusColor(status).color} px={3} py={1} borderRadius="full" fontSize={isMobile ? "xs" : "sm"} fontWeight="bold">
            {String(status).toUpperCase()}
          </Badge>
        </Td>

        <Td px={isMobile ? 3 : 6} py={isMobile ? 2 : 3}>
          <Menu>
            <MenuButton as={Button} variant="ghost" size="sm"><Icon as={FiMoreVertical} /></MenuButton>
            <MenuList>
              <MenuItem icon={<FiEye />} onClick={() => openModalForOrder(order)}>View Details</MenuItem>
              <MenuItem icon={<FiDownload />} onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(order); }}>Download Invoice</MenuItem>
            </MenuList>
          </Menu>
        </Td>
      </Tr>
    );
  };

  const PaymentRow = ({ payment }) => {
    const status = safeGet(payment, "status", "pending");
    return (
      <Tr borderBottom="1px solid" borderColor="gray.100">
        <Td px={isMobile ? 3 : 6} py={isMobile ? 2 : 3}><Text fontWeight="semibold" fontSize={isMobile ? "sm" : "md"}>{safeGet(payment, "razorpayOrderId", safeGet(payment, "_id", "—"))}</Text></Td>
        <Td px={isMobile ? 3 : 6} py={isMobile ? 2 : 3}><Text color="gray.700" fontSize={isMobile ? "sm" : "md"}>{safeGet(payment, "orderId", "—")}</Text></Td>
        <Td px={isMobile ? 3 : 6} py={isMobile ? 2 : 3}><Text fontWeight="bold" color="gray.800" fontSize={isMobile ? "md" : "lg"}>{formatINR(safeGet(payment, "amount", 0))}</Text></Td>
        <Td px={isMobile ? 3 : 6} py={isMobile ? 2 : 3}><Badge variant="outline" colorScheme="blue" fontSize={isMobile ? "xs" : "sm"}>{safeGet(payment, "method", "UNKNOWN")}</Badge></Td>
        <Td px={isMobile ? 3 : 6} py={isMobile ? 2 : 3}><Badge bg={getStatusColor(status).bg} color={getStatusColor(status).color} px={3} py={1} borderRadius="full" fontSize={isMobile ? "xs" : "sm"} fontWeight="bold">{String(status).toUpperCase()}</Badge></Td>
      </Tr>
    );
  };

  if (!currentUser) {
    return (
      <Center minH="300px">
        <Spinner />
        <Text ml={3}>Checking user...</Text>
      </Center>
    );
  }

  const searchPlaceholder = currentView === "orders"
    ? "Search orders by ID, email, product, city, pincode..."
    : "Search payments by payment ID, method, or order ID...";

  return (
    <Flex flexDirection="column" pt={{ base: "100px", md: "45px" }} height="100vh" overflow="hidden">
      <Box px={4} mb="14px">
        <Grid templateColumns={{ base: "1fr", sm: "1fr", md: "1fr 1fr" }} gap="12px">
          <Card minH="72px" cursor="pointer" onClick={() => setCurrentView("orders")} border={currentView === "orders" ? "2px solid" : "1px solid"} borderColor={currentView === "orders" ? customColor : `${customColor}30`} transition="all 0.2s ease-in-out" bg={cardBg}>
            <CardBody position="relative" zIndex={1} p={3}>
              <Flex align="center" justify="space-between">
                <Stat>
                  <StatLabel fontSize="xs" color="gray.600" fontWeight="bold">All Orders</StatLabel>
                  <StatNumber fontSize="md" color={textColor}>{isLoading ? <Spinner size="xs" /> : orders.length}</StatNumber>
                </Stat>
                <Box display="flex" alignItems="center" justifyContent="center" borderRadius="10px" h="34px" w="34px" bg={customColor}>
                  <Icon as={MdCategory} h="16px" w="16px" color="white" />
                </Box>
              </Flex>
            </CardBody>
          </Card>

          <Card minH="72px" cursor="pointer" onClick={() => setCurrentView("payments")} border={currentView === "payments" ? "2px solid" : "1px solid"} borderColor={currentView === "payments" ? customColor : `${customColor}30`} transition="all 0.2s ease-in-out" bg={cardBg}>
            <CardBody position="relative" zIndex={1} p={3}>
              <Flex align="center" justify="space-between">
                <Stat>
                  <StatLabel fontSize="xs" color="gray.600" fontWeight="bold">All Payments</StatLabel>
                  <StatNumber fontSize="md" color={textColor}>{isLoading ? <Spinner size="xs" /> : payments.length}</StatNumber>
                </Stat>
                <Box display="flex" alignItems="center" justifyContent="center" borderRadius="10px" h="34px" w="34px" bg={customColor}>
                  <Icon as={IoCheckmarkDoneCircleSharp} h="16px" w="16px" color="white" />
                </Box>
              </Flex>
            </CardBody>
          </Card>
        </Grid>
      </Box>

      <Box flex="1" display="flex" flexDirection="column" p={4} pt={0} overflow="hidden">
        <Card shadow="lg" bg={cardBg} display="flex" flexDirection="column" height="96%" minH="0">
          <CardHeader p="12px" pb="10px" bg={cardBg} flexShrink={0} borderBottom="1px solid" borderColor={`${customColor}20`}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3} direction={{ base: "column", md: "row" }}>
              <Heading size="sm" color="gray.700" flexShrink={0}>
                {currentView === "orders" ? "🛒 Orders" : "💳 Payments"}
              </Heading>

              <Flex align="center" flex="1" maxW={{ base: "100%", md: "720px" }} width="100%">
                <InputGroup width="100%">
                  <VisuallyHidden as="label" htmlFor="global-search">Search</VisuallyHidden>
                  <Input
                    id="global-search"
                    ref={searchRef}
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="sm"
                    borderColor={`${customColor}50`}
                    _hover={{ borderColor: customColor }}
                    _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    bg="white"
                    fontSize={isMobile ? "sm" : "md"}
                    transition="box-shadow 0.15s ease, border-color 0.15s ease"
                  />
                  <InputRightElement width="3rem">
                    {searchQuery ? (
                      <Tooltip label="Clear search (Esc also clears)">
                        <Button size="xs" onClick={() => setSearchQuery("")} variant="ghost">
                          <Icon as={FaTimes} />
                        </Button>
                      </Tooltip>
                    ) : (
                      <Tooltip label="Search (Ctrl + / to focus)">
                        <Box as="span" color="gray.400" pl={1}><Icon as={FaSearch} /></Box>
                      </Tooltip>
                    )}
                  </InputRightElement>
                </InputGroup>
              </Flex>

              <HStack spacing={2} align="center">
                <Button leftIcon={<FaArrowLeft />} size="sm" variant="ghost" onClick={() => {
                  setSearchQuery("");
                  setOrderStatusFilter("all");
                  setPaymentMethodFilter("all");
                  setPaymentStatusFilter("all");
                  setOrderDatePreset("all");
                  setPaymentDatePreset("all");
                  setCurrentView("orders");
                }}>Reset</Button>

                <Button variant="outline" size="sm" borderColor="gray.200" bg={cardBg} onClick={() => {
                  if (currentView === "orders") {
                    const rows = prepareOrdersExportRows();
                    exportToCSV(`orders_export_${new Date().toISOString().slice(0, 10)}.csv`, rows);
                  } else {
                    const rows = preparePaymentsExportRows();
                    exportToCSV(`payments_export_${new Date().toISOString().slice(0, 10)}.csv`, rows);
                  }
                }}>Export</Button>
              </HStack>
            </Flex>

            <Flex mt={3} gap={3} flexWrap="wrap" direction={{ base: "column", md: "row" }}>
              {currentView === "orders" ? (
                <HStack spacing={3} width="100%" flexWrap="wrap">
                  <Box width={{ base: "100%", sm: "48%", md: "auto" }}>
                    <Text fontSize="xs" color="gray.600" mb={1}>Status</Text>
                    <Select size="sm" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} width="100%" bg="white">
                      {ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </Select>
                  </Box>

                  <Box width={{ base: "100%", sm: "48%", md: "auto" }}>
                    <Text fontSize="xs" color="gray.600" mb={1}>Date</Text>
                    <Select size="sm" value={orderDatePreset} onChange={(e) => setOrderDatePreset(e.target.value)} width="100%" bg="white">
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                      <option value="this_year">This Year</option>
                    </Select>
                  </Box>
                </HStack>
              ) : (
                <HStack spacing={3} width="100%" flexWrap="wrap">
                  <Box width={{ base: "100%", sm: "48%", md: "auto" }}>
                    <Text fontSize="xs" color="gray.600" mb={1}>Method</Text>
                    <Select size="sm" value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} width="100%" bg="white">
                      {PAYMENT_METHOD_OPTIONS.map((m) => <option key={m} value={m}>{m === "all" ? "All" : m.toUpperCase()}</option>)}
                    </Select>
                  </Box>

                  <Box width={{ base: "100%", sm: "48%", md: "auto" }}>
                    <Text fontSize="xs" color="gray.600" mb={1}>Status</Text>
                    <Select size="sm" value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} width="100%" bg="white">
                      {PAYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </Select>
                  </Box>

                  <Box width={{ base: "100%", sm: "48%", md: "auto" }}>
                    <Text fontSize="xs" color="gray.600" mb={1}>Date</Text>
                    <Select size="sm" value={paymentDatePreset} onChange={(e) => setPaymentDatePreset(e.target.value)} width="100%" bg="white">
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                      <option value="this_year">This Year</option>
                    </Select>
                  </Box>
                </HStack>
              )}
            </Flex>
          </CardHeader>

          <CardBody bg={cardBg} flex="1" display="flex" flexDirection="column" p={0} overflow="hidden">
            {isLoading ? (
              <Flex justify="center" align="center" py={6} flex="1">
                <Spinner size="lg" color={customColor} />
                <Text ml={3} fontSize="sm">Loading data...</Text>
              </Flex>
            ) : (
              <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
<Box
  flex="1"
  overflowY="hidden"
  overflowX="hidden"
  _hover={{
    overflowY: "auto",
    overflowX: "auto",
  }}
  css={{
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
    },
    '&::-webkit-scrollbar-thumb': {
      background: customColor,
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: customHoverColor,
    },
  }}
>
  {/* Responsive Table Wrapper */}
  <Box
    overflowX={{ base: "auto", md: "hidden" }}
    w="100%"
    px={{ base: 2, md: 4 }}
  >
    {currentView === "orders" ? (
      <Table size={{ base: "sm", md: "md" }} variant="simple">
        <Thead bg={customColor} position="sticky" top={0} zIndex={10}>
          <Tr>
            <Th color="gray.100" fontSize={{ base: "xs", md: "sm" }}>Order Details</Th>
            <Th color="gray.100" fontSize={{ base: "xs", md: "sm" }}>Address</Th>
            <Th color="gray.100" fontSize={{ base: "xs", md: "sm" }}>Amount</Th>
            <Th color="gray.100" fontSize={{ base: "xs", md: "sm" }}>Status</Th>
            <Th color="gray.100" fontSize={{ base: "xs", md: "sm" }}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {currentSlice.length === 0 ? (
            <Tr>
              <Td colSpan={5}>
                <Center py={6}>
                  <Text color="gray.500" fontSize={{ base: "xs", md: "sm" }}>
                    No orders found.
                  </Text>
                </Center>
              </Td>
            </Tr>
          ) : (
            currentSlice.map((order) => (
              <OrderRow
                key={safeGet(order, "_id", Math.random().toString())}
                order={order}
              />
            ))
          )}
        </Tbody>
      </Table>
    ) : (
      <Table size={{ base: "sm", md: "md" }} variant="simple">
        <Thead bg={customColor} position="sticky" top={0} zIndex={10}>
          <Tr>
            <Th color="gray.100" fontSize={{ base: "xs", md: "sm" }}>Payment ID</Th>
            <Th color="gray.100" fontSize={{ base: "xs", md: "sm" }}>Order ID</Th>
            <Th color="gray.100" fontSize={{ base: "xs", md: "sm" }}>Amount</Th>
            <Th color="gray.100" fontSize={{ base: "xs", md: "sm" }}>Method</Th>
            <Th color="gray.100" fontSize={{ base: "xs", md: "sm" }}>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {currentSlice.length === 0 ? (
            <Tr>
              <Td colSpan={5}>
                <Center py={6}>
                  <Text color="gray.500" fontSize={{ base: "xs", md: "sm" }}>
                    No payments found.
                  </Text>
                </Center>
              </Td>
            </Tr>
          ) : (
            currentSlice.map((pay) => (
              <PaymentRow
                key={safeGet(pay, "_id", safeGet(pay, "orderId", Math.random().toString()))}
                payment={pay}
              />
            ))
          )}
        </Tbody>
      </Table>
    )}
  </Box>

  {/* Pagination controls */}
  <Box
    flexShrink={0}
    p={{ base: "8px", md: "12px" }}
    pt={{ base: "6px", md: "10px" }}
    borderTop="1px solid"
    borderColor={`${customColor}20`}
    bg={cardBg}
  >
    <Flex
      justify="center"
      align="center"
      gap={{ base: 2, md: 4 }}
      flexWrap="wrap"
      direction={{ base: "column", sm: "row" }}
    >
      <Button
        size={{ base: "xs", md: "sm" }}
        onClick={goPrevPage}
        isDisabled={currentPage === 1}
        leftIcon={<FaChevronLeft />}
        bg="white"
        color={customColor}
        border="1px"
        borderColor={customColor}
        _hover={{ bg: customColor, color: "white" }}
        _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
        width={{ base: "200%", sm: "auto" }}
      >
        Prev
      </Button>

      <Text fontSize={{ base: "xs", md: "sm" }} color="gray.700" fontWeight="medium">
        Page {currentPage} of {totalPages}
      </Text>

      <Button
        size={{ base: "xs", md: "sm" }}
        onClick={goNextPage}
        isDisabled={currentPage === totalPages}
        rightIcon={<FaChevronRight />}
        bg="white"
        color={customColor}
        border="1px"
        borderColor={customColor}
        _hover={{ bg: customColor, color: "white" }}
        _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
        width={{ base: "100%", sm: "auto" }}
      >
        Next
      </Button>
    </Flex>
  </Box>
</Box>




              </Box>
            )}
          </CardBody>
        </Card>
      </Box>

      {/* Order Details Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="4xl" isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
        <ModalContent bg={cardBg} borderRadius="2xl" overflow="hidden">
          <ModalHeader bg={`${customColor}08`} borderBottom="1px solid" borderColor="gray.200">
            <VStack align="start" spacing={2}>
              <Heading size="md">Order Details</Heading>
              <Text color="gray.600" fontSize="sm">Manage order status and delivery information</Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {selectedOrder ? (
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800">{safeGet(selectedOrder, "_id", "—")}</Text>
                    <HStack spacing={4}>
                      <HStack><Icon as={FiUser} color="gray.500" /><Text color="gray.600">{safeGet(selectedOrder, "user.email", "—")}</Text></HStack>
                      <HStack><Icon as={FiCalendar} color="gray.500" /><Text color="gray.600">{new Date(safeGet(selectedOrder, "createdAt", Date.now())).toLocaleString()}</Text></HStack>
                    </HStack>
                  </VStack>

                  <Badge bg={getStatusColor(safeGet(selectedOrder, "status", "")).bg} color={getStatusColor(safeGet(selectedOrder, "status", "")).color} px={4} py={2} borderRadius="full" fontSize="md" fontWeight="bold">
                    {String(safeGet(selectedOrder, "status", "UNKNOWN")).toUpperCase()}
                  </Badge>
                </HStack>

                <Divider />

                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>Order Items</Text>
                  <VStack spacing={3} align="stretch">
                    {(safeGet(selectedOrder, "orderItems", []) || []).map((item, index) => (
                      <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                        <HStack spacing={3}>
                          {item?.image ? (
                            <Image alt={safeGet(item, "name", "")} src={item.image} boxSize="50px" objectFit="cover" borderRadius="8px" />
                          ) : (
                            <Box boxSize="50px" display="flex" alignItems="center" justifyContent="center" bg="gray.100" borderRadius="8px"><Text fontSize="xs">No Image</Text></Box>
                          )}
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">{safeGet(item, "name", "Unnamed")}</Text>
                            <Text fontSize="sm" color="gray.600">₹{safeGet(item, "price", 0)} × {safeGet(item, "qty", 1)}</Text>
                          </VStack>
                        </HStack>
                        <Text fontWeight="bold" fontSize="lg">₹{(safeGet(item, "price", 0) * safeGet(item, "qty", 1)).toLocaleString()}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                <Box bg={`${customColor}05`} p={4} borderRadius="lg">
                  <HStack justify="space-between">
                    <Text fontSize="xl" fontWeight="bold">Total Amount</Text>
                    <Text fontSize="2xl" fontWeight="bold" color={customColor}>{formatINR(safeGet(selectedOrder, "total_amount", 0))}</Text>
                  </HStack>
                </Box>

                <HStack spacing={3} justify="flex-end" flexWrap="wrap">
                  <Button variant="outline" leftIcon={<FiDownload />} onClick={() => handleDownloadInvoice(selectedOrder)} borderColor="gray.300">Download Invoice</Button>
                  
                  <Button leftIcon={<IoCheckmarkDoneCircleSharp />} bg="#3B82F6" _hover={{ bg: "#2563EB" }} color="white" onClick={() => {
                    Confirm_Order();
                  }}>Confirm Order</Button>

                  <Button leftIcon={<FiTruck />} bg="#10B981" _hover={{ bg: "#059669" }} color="white" onClick={markAsDelivered}>Mark Delivered</Button>
                </HStack>
              </VStack>
            ) : (
              <Center py={6}><Text color="gray.500">No order selected.</Text></Center>
            )}
          </ModalBody>

          <ModalFooter><Button onClick={closeModal}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}

/* End of CleanedBilling.js */
