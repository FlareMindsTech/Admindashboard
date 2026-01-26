

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
  IconButton,
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
  SimpleGrid,
} from "@chakra-ui/react";

import { FaSearch, FaChevronLeft, FaChevronRight, FaArrowLeft, FaTimes, FaEye, FaCheckCircle } from "react-icons/fa";
import { FiMoreVertical, FiEye, FiDownload, FiUser, FiCalendar, FiTruck } from "react-icons/fi";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdCategory } from "react-icons/md";

import { getAllOrders, updateOrders } from "../utils/axiosInstance";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/img/Aadvi-logo.png";

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
  pending: { bg: "#F59E0B", color: "white" },
  packed: { bg: "#8B5CF6", color: "white" },
  shipped: { bg: "#6366F1", color: "white" },
  "out-for-delivery": { bg: "#EC4899", color: "white" },
  default: { bg: "#64748B", color: "white" },
};

const ORDER_STATUS_OPTIONS = ["all", "pending", "packed", "shipped", "out-for-delivery", "delivered"];
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
  const [filteredData, setFilteredData] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 220);

  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderDatePreset, setOrderDatePreset] = useState("all");

  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentDatePreset, setPaymentDatePreset] = useState("all");
  const [shipmentDate, setShipmentDate] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [courierName, setCourierName] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [exportDate, setExportDate] = useState(""); // State for date-specific export

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

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
      // Date-specific filter
      if (exportDate) {
        const createdAt = safeGet(o, "createdAt", null);
        if (!createdAt) return false;
        const orderDay = new Date(createdAt).toISOString().split("T")[0];
        if (orderDay !== exportDate) return false;
      }

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
  }, [orders, debouncedSearch, orderStatusFilter, orderDatePreset, exportDate]);

  const filteredPayments = useMemo(() => {
    const q = (debouncedSearch || "").trim().toLowerCase();
    const [payStart, payEnd] = getDateRangePreset(paymentDatePreset);

    return (payments || []).filter((p) => {
      // Date-specific filter
      if (exportDate) {
        let createdDay = null;
        if (safeGet(p, "createdAt", null)) createdDay = new Date(safeGet(p, "createdAt")).toISOString().split("T")[0];
        else if (safeGet(p, "orderRef.createdAt", null)) createdDay = new Date(safeGet(p, "orderRef.createdAt")).toISOString().split("T")[0];

        if (createdDay !== exportDate) return false;
      }

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
  }, [payments, debouncedSearch, paymentMethodFilter, paymentStatusFilter, paymentDatePreset, exportDate]);

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
    setOrderStatus(safeGet(order, "status", "pending"));
    setShipmentDate(safeGet(order, "ShipingDate", ""));
    setCourierName(safeGet(order, "courierName", ""));
    setTrackingId(safeGet(order, "trackingId", ""));

    // Format expectedDelivery for date input (YYYY-MM-DD)
    const rawExpectedDate = safeGet(order, "expectedDelivery", "");
    if (rawExpectedDate) {
      try {
        setExpectedDelivery(new Date(rawExpectedDate).toISOString().split('T')[0]);
      } catch (e) {
        setExpectedDelivery("");
      }
    } else {
      setExpectedDelivery("");
    }

    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };


  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

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

  // Enhanced status update handler
  const handleUpdateStatusAndDate = async () => {
    try {
      const orderId = safeGet(selectedOrder, "_id");
      if (!orderId) return;

      setIsLoading(true);

      const updateData = {
        status: orderStatus,
      };

      if (shipmentDate) updateData.ShipingDate = shipmentDate;
      if (courierName) updateData.courierName = courierName;
      if (trackingId) updateData.trackingId = trackingId;
      if (expectedDelivery) updateData.expectedDelivery = expectedDelivery;

      await updateOrders(orderId, updateData);

      toast({
        title: "Order Updated",
        description: `Order ${orderId} status set to ${orderStatus}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      await fetchOrders();
      closeModal();
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update order status. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date-specific export
  const handleDateExport = () => {
    if (!exportDate) {
      toast({
        title: "Please select a date",
        description: "A date is required to export data.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (currentView === "orders") {
      const filteredOrdersForDate = orders.filter((o) => {
        const createdAt = safeGet(o, "createdAt", null);
        if (!createdAt) return false;
        const orderDay = new Date(createdAt).toISOString().split("T")[0];
        return orderDay === exportDate;
      });

      if (filteredOrdersForDate.length === 0) {
        toast({
          title: "No orders found",
          description: `No orders were found for ${exportDate}.`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const rows = filteredOrdersForDate.map((o) => ({
        orderId: safeGet(o, "_id", ""),
        email: safeGet(o, "user.email", ""),
        items: (safeGet(o, "orderItems", []) || []).map((it) => `${safeGet(it, "name", "")} x${safeGet(it, "qty", 1)}`).join("; "),
        amount: safeGet(o, "total_amount", 0),
        status: safeGet(o, "status", ""),
        createdAt: safeGet(o, "createdAt", ""),
      }));

      exportToCSV(`orders_export_${exportDate}.csv`, rows);
    } else {
      const filteredPaymentsForDate = payments.filter((p) => {
        let createdAt = null;
        if (safeGet(p, "createdAt", null)) createdAt = new Date(safeGet(p, "createdAt")).toISOString().split("T")[0];
        else if (safeGet(p, "orderRef.createdAt", null)) createdAt = new Date(safeGet(p, "orderRef.createdAt")).toISOString().split("T")[0];
        return createdAt === exportDate;
      });

      if (filteredPaymentsForDate.length === 0) {
        toast({
          title: "No payments found",
          description: `No payments were found for ${exportDate}.`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const rows = filteredPaymentsForDate.map((p) => ({
        paymentId: safeGet(p, "_id", ""),
        razorpayOrderId: safeGet(p, "razorpayOrderId", ""),
        orderId: safeGet(p, "orderId", ""),
        method: safeGet(p, "method", ""),
        amount: safeGet(p, "amount", 0),
        status: safeGet(p, "status", ""),
        createdAt: safeGet(p, "createdAt", safeGet(p, "orderRef.createdAt", "")),
      }));

      exportToCSV(`payments_export_${exportDate}.csv`, rows);
    }

    toast({
      title: "Export Successful",
      description: `Data for ${exportDate} has been exported as CSV.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle date-specific PDF export
  const handleDatePDFExport = () => {
    if (!exportDate) {
      toast({
        title: "Please select a date",
        description: "A date is required to generate a PDF.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const doc = new jsPDF();
    const title = currentView === "orders" ? "Orders Report" : "Payments Report";

    // Header
    doc.setFontSize(20);
    doc.setTextColor(123, 44, 191); // customColor
    doc.text(title, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report Date: ${exportDate}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    if (currentView === "orders") {
      const filteredOrdersForDate = orders.filter((o) => {
        const createdAt = safeGet(o, "createdAt", null);
        if (!createdAt) return false;
        const orderDay = new Date(createdAt).toISOString().split("T")[0];
        return orderDay === exportDate;
      });

      if (filteredOrdersForDate.length === 0) {
        toast({
          title: "No orders found",
          description: `No orders were found for ${exportDate}.`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const tableRows = filteredOrdersForDate.map((o) => [
        safeGet(o, "_id", "").slice(-8),
        safeGet(o, "user.email", ""),
        (safeGet(o, "orderItems", []) || []).map((it) => `${safeGet(it, "name", "")} x${safeGet(it, "qty", 1)}`).join("\n"),
        formatINR(safeGet(o, "total_amount", 0)).replace("₹", "Rs. "),
        safeGet(o, "status", "").toUpperCase(),
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Order ID', 'Customer Email', 'Items', 'Amount', 'Status']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [123, 44, 191], textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          2: { cellWidth: 60 },
        },
      });

      doc.save(`orders_report_${exportDate}.pdf`);
    } else {
      const filteredPaymentsForDate = payments.filter((p) => {
        let createdAt = null;
        if (safeGet(p, "createdAt", null)) createdAt = new Date(safeGet(p, "createdAt")).toISOString().split("T")[0];
        else if (safeGet(p, "orderRef.createdAt", null)) createdAt = new Date(safeGet(p, "orderRef.createdAt")).toISOString().split("T")[0];
        return createdAt === exportDate;
      });

      if (filteredPaymentsForDate.length === 0) {
        toast({
          title: "No payments found",
          description: `No payments were found for ${exportDate}.`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const tableRows = filteredPaymentsForDate.map((p) => [
        safeGet(p, "razorpayOrderId", safeGet(p, "_id", "")).slice(-10),
        safeGet(p, "orderId", "").slice(-8),
        safeGet(p, "method", "").toUpperCase(),
        formatINR(safeGet(p, "amount", 0)).replace("₹", "Rs. "),
        safeGet(p, "status", "").toUpperCase(),
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Payment ID', 'Order ID', 'Method', 'Amount', 'Status']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [123, 44, 191], textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      doc.save(`payments_report_${exportDate}.pdf`);
    }

    toast({
      title: "PDF Generated",
      description: `PDF report for ${exportDate} has been downloaded.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const Print_Bill = () => {
    if (!selectedOrder) return;

    const doc = new jsPDF({
      unit: "mm",
      format: [80, 150] // Reduced height to 150mm
    });

    const orderId = safeGet(selectedOrder, "_id", "—");
    const date = new Date(safeGet(selectedOrder, "createdAt", Date.now())).toLocaleString();
    const items = safeGet(selectedOrder, "orderItems", []);
    const totalAmount = formatINR(safeGet(selectedOrder, "total_amount", 0)).replace("₹", "Rs. ");
    const customerEmail = safeGet(selectedOrder, "user.email", "—");

    const addr = safeGet(selectedOrder, "address", {});
    const customerAddr = [
      safeGet(addr, "street", ""),
      safeGet(addr, "city", ""),
      safeGet(addr, "state", ""),
      safeGet(addr, "pincode", "")
    ].filter(Boolean).join(", ");

    // Add Logo - Smaller size
    try {
      doc.addImage(logo, 'PNG', 30, 2, 20, 20);
    } catch (e) {
      console.log("Logo failed to load for PDF", e);
    }

    doc.setFont("courier", "bold");
    doc.setFontSize(12);
    doc.text("LABEL AADVI", 40, 25, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    doc.text(`Order: ${orderId.slice(-10)}`, 5, 32);
    doc.text(`Date: ${date}`, 5, 36);
    doc.text("------------------------------------------", 5, 40);

    doc.setFont("courier", "bold");
    doc.text("From:", 5, 45);
    doc.setFont("courier", "normal");
    doc.text("Label Aadvi, Palladam, TN 641664", 5, 49);
    doc.text("Phone: +91 8807427126", 5, 53);
    doc.text("------------------------------------------", 5, 57);

    doc.setFont("courier", "bold");
    doc.text("To:", 5, 62);
    doc.setFont("courier", "normal");
    const splitAddr = doc.splitTextToSize(customerAddr, 70);
    doc.text(customerEmail, 5, 66);
    doc.text(splitAddr, 5, 70);

    const addrHeight = (splitAddr.length * 4) + 72;
    doc.text("------------------------------------------", 5, addrHeight);

    let currentY = addrHeight + 5;
    items.forEach((item) => {
      const itemName = item.name || safeGet(item, "product.name", "Item");
      const qty = item.qty || item.quantity || 1;
      const price = formatINR(safeGet(item, "price", 0) * qty).replace("₹", "Rs. ");

      const wrappedName = doc.splitTextToSize(`${itemName} x${qty}`, 55);
      doc.text(wrappedName, 5, currentY);
      doc.text(price, 75, currentY, { align: "right" });
      currentY += (wrappedName.length * 4);
    });

    doc.text("------------------------------------------", 5, currentY);
    currentY += 6;
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.text(`Total: ${totalAmount}`, 75, currentY, { align: "right" });

    currentY += 10;
    doc.setFontSize(7);
    doc.setFont("courier", "normal");
    doc.text("Thank you for shopping with us!", 40, currentY, { align: "center" });

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const Download_Packing_Slip = () => {
    if (!selectedOrder) return;

    const doc = new jsPDF();
    const orderId = safeGet(selectedOrder, "_id", "—");
    const orderDate = new Date(safeGet(selectedOrder, "createdAt", Date.now())).toLocaleDateString();

    // Brand Color: #5a189a (RGB: 90, 24, 154)
    const primaryColor = [90, 24, 154];

    // Header - Title and PKG Number
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PACKAGE SLIP", 190, 30, { align: "right" });

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`Package# - PKG-${orderId.slice(-6).toUpperCase()}`, 190, 38, { align: "right" });

    // Company Information (Top Left)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Label Aadvi", 20, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No.1, near Thangalakshmi Jewellery", 20, 36);
    doc.text("Palladam, Tamil Nadu", 20, 41);
    doc.text("641664", 20, 46);

    // Separator Line (Requested Color)
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 60, 190, 60);

    // Meta Header (Package #, Order Date, Sales Order #)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Package #", 20, 68);
    doc.text("Order Date", 65, 68);
    doc.text("Sales Order #", 145, 68);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`PKG-${orderId.slice(-6).toUpperCase()}`, 20, 75);
    doc.text(orderDate, 65, 75);
    doc.text(orderId.slice(-10), 145, 75);

    doc.line(20, 78, 190, 78);

    // Bill To & Ship To
    const addr = safeGet(selectedOrder, "address", {});
    const customerEmail = safeGet(selectedOrder, "user.email", "—");
    const fullAddr = [
      safeGet(addr, "street", ""),
      safeGet(addr, "city", ""),
      safeGet(addr, "state", ""),
      safeGet(addr, "pincode", "")
    ].filter(Boolean).join(", ");

    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 95);
    doc.text("Ship To:", 110, 95);

    doc.setFont("helvetica", "normal");
    doc.text(customerEmail, 20, 102);
    const splitAddrBill = doc.splitTextToSize(fullAddr, 80);
    doc.text(splitAddrBill, 20, 108);

    doc.text(customerEmail, 110, 102);
    const splitAddrShip = doc.splitTextToSize(fullAddr, 80);
    doc.text(splitAddrShip, 110, 108);

    // Items Table
    const items = safeGet(selectedOrder, "orderItems", []).map((it, idx) => {
      const itemName = it.name ||
        safeGet(it, "product.name") ||
        safeGet(it, "productId.name") ||
        it.productName ||
        it.description ||
        "Unnamed Item";

      return [
        idx + 1,
        itemName,
        it.qty || it.quantity || 1
      ];
    });

    const totalItems = safeGet(selectedOrder, "orderItems", []).reduce((sum, it) => sum + (it.qty || it.quantity || 1), 0);

    autoTable(doc, {
      startY: 135,
      head: [['SR No.', 'ITEM DESCRIPTION', 'QTY']],
      body: items,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'left' },
        2: { halign: 'center', cellWidth: 30 }
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: primaryColor,
        lineWidth: 0.1
      }
    });

    // Total Row
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text("Total", 145, finalY);
    doc.text(totalItems.toString(), 190, finalY, { align: "right" });

    // Notes Section
    const notesY = finalY + 30;
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 20, notesY);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, notesY + 30, 190, notesY + 30);

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const Download_Detailed_Order = async (order) => {
    if (!order) return;

    const toast_id = toast({
      title: "Generating PDF",
      description: "Please wait while we prepare your download...",
      status: "info",
      duration: null,
      isClosable: false,
    });

    try {
      const doc = new jsPDF();
      const orderId = safeGet(order, "_id", "—");
      const orderDate = new Date(safeGet(order, "createdAt", Date.now())).toLocaleString();
      const primaryColor = [123, 44, 191]; // #7b2cbf

      // Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text("ORDER SUMMARY", 20, 28);

      doc.setFontSize(10);
      doc.text(`Order ID: ${orderId}`, 190, 20, { align: "right" });
      doc.text(`Date: ${orderDate}`, 190, 28, { align: "right" });

      // Customer Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Customer Details:", 20, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Email: ${safeGet(order, "user.email", "—")}`, 20, 57);

      const addr = safeGet(order, "address", {});
      const fullAddr = [
        safeGet(addr, "street", ""),
        safeGet(addr, "city", ""),
        safeGet(addr, "state", ""),
        safeGet(addr, "pincode", ""),
        safeGet(addr, "country", "")
      ].filter(Boolean).join(", ");

      const splitAddr = doc.splitTextToSize(`Address: ${fullAddr}`, 170);
      doc.text(splitAddr, 20, 64);

      let yPos = 80;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Items Ordered:", 20, yPos);
      yPos += 10;

      const items = safeGet(order, "orderItems", []);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemName = item.name || safeGet(item, "product.name", "Unnamed Product");
        const itemImg = item.image || safeGet(item, "product.images.0.url");
        const itemQty = item.qty || item.quantity || 1;
        const itemPrice = item.price || 0;

        // Add a line between items
        if (i > 0) {
          doc.setDrawColor(230, 230, 230);
          doc.line(20, yPos - 5, 190, yPos - 5);
        }

        // Image container
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.1);
        doc.rect(20, yPos, 30, 30);

        if (itemImg) {
          try {
            const img = await new Promise((resolve, reject) => {
              const tempImg = new window.Image();
              tempImg.crossOrigin = "Anonymous";
              tempImg.src = itemImg;
              tempImg.onload = () => resolve(tempImg);
              tempImg.onerror = (e) => reject(e);
            });
            doc.addImage(img, 'JPEG', 21, yPos + 1, 28, 28);
          } catch (e) {
            console.error("Image load failed", e);
            doc.setFontSize(8);
            doc.text("No Image", 25, yPos + 15);
          }
        } else {
          doc.setFontSize(8);
          doc.text("No Image", 25, yPos + 15);
        }

        // Details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(itemName, 55, yPos + 5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Quantity: ${itemQty}`, 55, yPos + 12);
        doc.text(`Unit Price: ${formatINR(itemPrice).replace("₹", "Rs. ")}`, 55, yPos + 19);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`Subtotal: ${formatINR(itemPrice * itemQty).replace("₹", "Rs. ")}`, 55, yPos + 26);

        yPos += 40;

        if (yPos > 250 && i < items.length - 1) {
          doc.addPage();
          yPos = 30;
        }
      }

      // Final Total
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(20, yPos, 190, yPos);
      yPos += 10;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount:", 130, yPos);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(formatINR(safeGet(order, "total_amount", 0)).replace("₹", "Rs. "), 190, yPos, { align: "right" });

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you", 105, 285, { align: "center" });

      doc.save(`Order_${orderId.slice(-6)}.pdf`);

      toast.close(toast_id);
      toast({
        title: "Success",
        description: "Order details downloaded.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error("Error generating detailed PDF:", error);
      toast.close(toast_id);
      toast({
        title: "Error",
        description: "Failed to generate PDF.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };


  // handleUpdateStatusAndDate handles most status updates now

  useEffect(() => {
    if (currentView === "orders") {
      setFilteredData(filteredOrders);
    } else {
      setFilteredData(filteredPayments);
    }
  }, [currentView, filteredOrders, filteredPayments]);

  // Row components
  const OrderRow = ({ order }) => {
    const status = safeGet(order, "status", "pending");
    return (
      <Tr _hover={{ bg: "gray.50", cursor: "pointer" }} borderBottom="1px solid" borderColor="gray.100">
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

        <Td borderColor={`${customColor}20`}>
          <Flex gap={2}>
            <IconButton
              aria-label="View bill"
              icon={<FaEye />}
              bg="white"
              color="green.500"
              border="1px"
              borderColor="green.500"
              _hover={{ bg: "green.500", color: "white" }}
              size="sm"
              onClick={() => openModalForOrder(order)}
            />
            <IconButton
              aria-label="Download details"
              icon={<FiDownload />}
              bg="white"
              color="blue.500"
              border="1px"
              borderColor="blue.500"
              _hover={{ bg: "blue.500", color: "white" }}
              size="sm"
              onClick={() => Download_Detailed_Order(order)}
            />
            {/* {order.status !== "paid" && (
                                        <IconButton
                                          aria-label="Mark as paid"
                                          icon={<FaCheckCircle />}
                                          bg="white"
                                          color={customColor}
                                          border="1px"
                                          borderColor={customColor}
                                          _hover={{ bg: customColor, color: "white" }}
                                          size="sm"
                                          onClick={() => {Confirm_Order(selectedOrder)}}
                                        />
                                      )} */}
          </Flex>
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
    <Flex
      flexDirection="column"
      pt={{ base: "140px", md: "75px" }}
      height={{ base: "auto", lg: "100vh" }}
      minHeight="100vh"
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
          borderRadius: '24px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'transparent',
          borderRadius: '24px',
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

      <Box mb="24px">

        <Flex
          direction="row"
          wrap="wrap"
          justify="center"
          gap={{ base: 3, md: 4 }}
          overflowX="auto"
          py={2}
          css={{
            '&::-webkit-scrollbar': {
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
          }}
        >

          <Card
            minH="83px"
            cursor="pointer"
            onClick={() => setCurrentView("orders")}
            border={currentView === "orders" ? "2px solid" : "1px solid"}
            borderColor={currentView === "orders" ? customColor : `${customColor}30`}
            transition="all 0.2s ease-in-out"
            bg="white"
            position="relative"
            overflow="hidden"
            w={{ base: "32%", md: "30%", lg: "25%" }}
            minW="100px"
            flex="1"
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
              transform: "translateY(-4px)",
              shadow: "xl",
              _before: {
                opacity: 1,
              },
              borderColor: customColor,
            }}
          >

            <CardBody
              position="relative"
              zIndex={1} p={{ base: 3, md: 4 }}>

              <Flex
                flexDirection="row" align="center" justify="space-between" w="100%" padding={5}>

                <Stat me="auto">
                  <StatLabel
                    fontSize={{ base: "sm", md: "md" }}
                    color="gray.600"
                    fontWeight="bold"
                    pb="0px"
                  >All Orders</StatLabel>
                  <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>
                    {isLoading ? <Spinner size="xs" /> : orders.length}</StatNumber>
                </Stat>

                <Box display="flex" alignItems="center" justifyContent="center" borderRadius="10px" h="34px" w="34px" bg={customColor}>
                  <Icon as={MdCategory} h="16px" w="16px" color="white" />
                </Box>

              </Flex>
            </CardBody>
          </Card>

          <Card
            minH="83px"
            cursor="pointer"
            onClick={() => setCurrentView("payments")}
            border={currentView === "payments" ? "2px solid" : "1px solid"}
            borderColor={currentView === "payments" ? customColor : `${customColor}30`}
            transition="all 0.2s ease-in-out"
            bg="white"
            position="relative"
            overflow="hidden"
            w={{ base: "32%", md: "30%", lg: "25%" }}
            minW="100px"
            flex="1"
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
              transform: "translateY(-4px)",
              shadow: "xl",
              _before: {
                opacity: 1,
              },
              borderColor: customColor,
            }}
          >
            <CardBody position="relative" zIndex={1} p={{ base: 3, md: 4 }}>
              <Flex flexDirection="row" align="center" justify="space-between" w="100%" padding={5}>
                <Stat me="auto">
                  <StatLabel
                    fontSize={{ base: "sm", md: "md" }}
                    color="gray.600"
                    fontWeight="bold"
                    pb="2px"
                  >All Payments</StatLabel>
                  <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>{isLoading ? <Spinner size="xs" /> : payments.length}</StatNumber>
                </Stat>
                <Box display="flex" alignItems="center" justifyContent="center" borderRadius="10px" h="34px" w="34px" bg={customColor}>
                  <Icon as={IoCheckmarkDoneCircleSharp} h="16px" w="16px" color="white" />
                </Box>
              </Flex>
            </CardBody>
          </Card>

          {/* <Card 
          minH="83px" 
          cursor="pointer" 
          onClick={() => setCurrentView("payments")} 
          border={currentView === "payments" ? "2px solid" : "1px solid"} 
          borderColor={currentView === "payments" ? customColor : `${customColor}30`} 
          transition="all 0.2s ease-in-out" 
          bg="white"
            position="relative"
            overflow="hidden"
            w={{ base: "32%", md: "30%", lg: "25%" }}
            minW="100px"
            flex="1"
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
              transform: "translateY(-4px)",
              shadow: "xl",
              _before: {
                opacity: 1,
              },
              borderColor: customColor,
            }}>

            <CardBody position="relative" zIndex={1} p={{ base: 3, md: 4 }}>
              
            <Flex flexDirection="row" align="center" justify="space-between" w="100%">
                <Stat me="auto">
                  <StatLabel 
                    fontSize={{ base: "sm", md: "md" }}
                    color="gray.600"
                    fontWeight="bold"
                    pb="2px"
                  >All Payments</StatLabel>
                  <StatNumber fontSize={{ base: "lg", md: "xl" }} color={textColor}>{isLoading ? <Spinner size="xs" /> : payments.length}</StatNumber>
                </Stat>

                <Box display="flex" alignItems="center" justifyContent="center" borderRadius="10px" h="34px" w="34px" bg={customColor}>
                  <Icon as={IoCheckmarkDoneCircleSharp} h="16px" w="16px" color="white" />
                </Box>

              </Flex>
            </CardBody>
          </Card> */}

        </Flex>

        {/* Success/Error Message Display */}
        {/* {error && (
          <Text
            color="red.500"
            mb={4}
            p={3}
            border="1px"
            borderColor="red.200"
            borderRadius="md"
            bg="red.50"
          >
            {error}
          </Text>
        )}
        {success && (
          <Text
            color="green.500"
            mb={4}
            p={3}
            border="1px"
            borderColor="green.200"
            borderRadius="md"
            bg="green.50"
          >
            {success}
          </Text>
        )} */}

        {/* Active Filter Display */}
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            {currentView === "payments" && "All Payments"}
            {currentView === "orders" && "All Orders"}
          </Text>
          {/* {currentView !== "all" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCardClick("all")}
              border="1px"
              borderColor={customColor}
              color={customColor}
              _hover={{ bg: customColor, color: "white" }}
            >
              Show All Products
            </Button>
          )} */}
        </Flex>

      </Box>

      {/* Table Container */}
      <Box
        mt={-8}
        flex="1"
        display="flex"
        flexDirection="column"
        p={2}
        pt={0}
        overflow="hidden"
      >
        <Card
          shadow="xl"
          bg="transparent"
          display="flex"
          flexDirection="column"
          height="90%"
          minH="0"
          border="none"
        >
          <CardHeader
            p="5px"
            pb="5px"
            padding='5'
            bg="transparent"
            flexShrink={0}
            borderBottom="1px solid"
            borderColor={`${customColor}20`}
          >

            <Flex
              justify="space-between"
              align="center"
              flexWrap="wrap"
              gap={4}
            >

              <Heading size="md" flexShrink={0} color="gray.700">
                {currentView === "orders" ? "🛒 Orders" : "💳 Payments"}
              </Heading>

              <Flex align="center" flex="1" maxW="400px">

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

              <Flex
                align="center"
                gap={2}
                direction={{ base: "column", sm: "row" }}
                width={{ base: "100%", md: "auto" }}
              >
                <Input
                  type="date"
                  size="sm"
                  value={exportDate}
                  onChange={(e) => setExportDate(e.target.value)}
                  borderColor={`${customColor}40`}
                  _hover={{ borderColor: customColor }}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  borderRadius="8px"
                  bg="white"
                  width={{ base: "100%", sm: "160px" }}
                  cursor="pointer"
                />

                <HStack spacing={2} align="center" width={{ base: "100%", sm: "auto" }}>
                  <Button
                    leftIcon={<FaArrowLeft />}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setOrderStatusFilter("all");
                      setPaymentMethodFilter("all");
                      setPaymentStatusFilter("all");
                      setOrderDatePreset("all");
                      setPaymentDatePreset("all");
                      setExportDate("");
                      setCurrentView("orders");
                    }}
                    display={{ base: "none", md: "flex" }}
                  >
                    Reset
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    borderColor={customColor}
                    color={customColor}
                    _hover={{ bg: `${customColor}10` }}
                    leftIcon={<FiDownload />}
                    onClick={handleDateExport}
                    width={{ base: "100%", sm: "auto" }}
                    fontWeight="bold"
                  >
                    CSV
                  </Button>

                  <Button
                    variant="solid"
                    size="sm"
                    bg={customColor}
                    color="white"
                    _hover={{ bg: customHoverColor }}
                    leftIcon={<FaEye />}
                    onClick={handleDatePDFExport}
                    width={{ base: "100%", sm: "auto" }}
                    fontWeight="bold"
                  >
                    PDF
                  </Button>
                </HStack>
              </Flex>
            </Flex>

            {/* <Flex mt={3} gap={3} flexWrap="wrap" direction={{ base: "column", md: "row" }}>
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
            </Flex> */}

          </CardHeader>

          <CardBody
            bg="transparent"
            flex="1"
            display="flex"
            flexDirection="column"
            p={0}
            overflow="hidden"
          >
            {isLoading ? (
              <Flex justify="center" align="center" py={10} flex="1">
                <Spinner size="xl" color={customColor} />
                <Text ml={3} fontSize="sm">Loading data...</Text>
              </Flex>
            ) : (
              <Box flex="1" display="flex" flexDirection="column" overflow="hidden">


                <Box
                  flex="1"
                  display="flex"
                  flexDirection="column"
                  height="auto"
                  minH="0"
                  overflow="hidden"
                >
                  {/* Responsive Table Wrapper */}
                  <Box
                    flex="1"
                    overflowY="auto"
                    overflowX="auto"
                    css={{
                      '&::-webkit-scrollbar': {
                        width: '4px',
                        height: '4px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '10px',
                      },
                      '@media screen and (max-width: 768px)': {
                        '&::-webkit-scrollbar': {
                          width: '2px',
                          height: '2px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'rgba(0,0,0,0.2)',
                        },
                      },
                      '&:hover::-webkit-scrollbar-thumb': {
                        background: 'rgba(0,0,0,0.2)',
                      },
                    }}
                  >
                    {currentView === "orders" ? (
                      <Table variant="simple" size={{ base: "sm", md: "md" }} bg="transparent" minW={{ base: "900px", lg: "100%" }}>
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
                              Order Details</Th>
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
                              Address</Th>
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
                            >Amount</Th>
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
                            >Status</Th>
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
                            >Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody bg="transparent">
                          {currentSlice.length === 0 ? (
                            <Tr
                              bg="transparent"
                              height="60px">
                              <Td borderColor={`${customColor}20`} colSpan={currentView === "orders" ? 4 : 6}>
                                <Box height="60px" />
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
                      <Table variant="simple" size={{ base: "sm", md: "md" }} bg="transparent" minW={{ base: "800px", lg: "100%" }}>
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
                            >Payment ID</Th>
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
                            >Order ID</Th>
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
                            >Amount</Th>
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
                            >Method</Th>
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
                            >Status</Th>
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
                  {currentSlice.length > 0 && (
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
                          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} {currentView === 'orders' ? 'orders' : 'payment'}
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
                              {totalPages}
                            </Text>
                          </Flex>

                          <Button
                            size="sm"
                            onClick={handleNextPage}
                            isDisabled={currentPage === totalPages}
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
                </Box>




              </Box>
            )}
          </CardBody>
        </Card>
      </Box>

      {/* Order Details Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="4xl" isCentered scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
        <ModalContent bg={cardBg} borderRadius="2xl" overflow="hidden">
          <ModalHeader bg={`${customColor}`} borderBottom="1px solid" borderColor="gray.200">
            <VStack align="start" spacing={2}>
              <Heading size="md" color={"white"}>Order Details</Heading>
              <Text color="gray.200" fontSize="sm">Manage order status and delivery information</Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton color={"white"} />
          <ModalBody py={6}>
            {selectedOrder ? (
              <VStack spacing={6} align="stretch">
                <Flex
                  justify="space-between"
                  align={{ base: "start", md: "center" }}
                  direction={{ base: "column", md: "row" }}
                  gap={4}
                >
                  <VStack align="start" spacing={1} w="100%">
                    <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="gray.800" wordBreak="break-all">
                      {safeGet(selectedOrder, "_id", "—")}
                    </Text>
                    <Flex direction={{ base: "column", sm: "row" }} gap={{ base: 2, sm: 4 }}>
                      <HStack><Icon as={FiUser} color="gray.500" /><Text color="gray.600" fontSize="sm">{safeGet(selectedOrder, "user.email", "—")}</Text></HStack>
                      <HStack><Icon as={FiCalendar} color="gray.500" /><Text color="gray.600" fontSize="sm">{new Date(safeGet(selectedOrder, "createdAt", Date.now())).toLocaleString()}</Text></HStack>
                    </Flex>
                  </VStack>

                  <Badge
                    bg={getStatusColor(safeGet(selectedOrder, "status", "")).bg}
                    color={getStatusColor(safeGet(selectedOrder, "status", "")).color}
                    px={4} py={2} borderRadius="full" fontSize={{ base: "xs", md: "md" }} fontWeight="bold"
                    alignSelf={{ base: "flex-start", md: "center" }}
                  >
                    {String(safeGet(selectedOrder, "status", "UNKNOWN")).toUpperCase()}
                  </Badge>
                </Flex>

                <Divider />

                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>Order Items</Text>
                  <VStack spacing={3} align="stretch">
                    {(safeGet(selectedOrder, "orderItems", []) || []).map((item, index) => {
                      const itemName = item.name || safeGet(item, "product.name", "Unnamed");
                      const itemImg = item.image || safeGet(item, "product.images.0.url");
                      const itemQty = item.qty || item.quantity || 1;
                      const itemPrice = item.price || 0;

                      return (
                        <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                          <HStack spacing={3}>
                            {itemImg ? (
                              <Image alt={itemName} src={itemImg} boxSize="50px" objectFit="cover" borderRadius="8px" />
                            ) : (
                              <Box boxSize="50px" display="flex" alignItems="center" justifyContent="center" bg="gray.100" borderRadius="8px"><Text fontSize="xs">No Image</Text></Box>
                            )}
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{itemName}</Text>
                              <Text fontSize="sm" color="gray.600">₹{itemPrice} × {itemQty}</Text>
                            </VStack>
                          </HStack>
                          <Text fontWeight="bold" fontSize="lg">₹{(itemPrice * itemQty).toLocaleString()}</Text>
                        </HStack>
                      );
                    })}
                  </VStack>
                </Box>

                <Box bg={`${customColor}05`} p={4} borderRadius="lg">
                  <HStack justify="space-between">
                    <Text fontSize="xl" fontWeight="bold">Total Amount</Text>
                    <Text fontSize="2xl" fontWeight="bold" color={customColor}>{formatINR(safeGet(selectedOrder, "total_amount", 0))}</Text>
                  </HStack>
                </Box>

                {(safeGet(selectedOrder, "courierName") || safeGet(selectedOrder, "trackingId") || safeGet(selectedOrder, "expectedDelivery")) && (
                  <Box p={4} border="1px solid" borderColor="gray.100" borderRadius="xl">
                    <Text fontSize="md" fontWeight="bold" mb={3}>Shipping Information</Text>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      {safeGet(selectedOrder, "courierName") && (
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Courier</Text>
                          <Text fontWeight="medium">{selectedOrder.courierName}</Text>
                        </VStack>
                      )}
                      {safeGet(selectedOrder, "trackingId") && (
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Tracking ID</Text>
                          <Text fontWeight="medium" color={customColor}>{selectedOrder.trackingId}</Text>
                        </VStack>
                      )}
                      {safeGet(selectedOrder, "expectedDelivery") && (
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Expected Delivery</Text>
                          <Text fontWeight="medium">{new Date(selectedOrder.expectedDelivery).toLocaleDateString()}</Text>
                        </VStack>
                      )}
                    </SimpleGrid>
                  </Box>
                )}

                <Flex
                  direction="column"
                  gap={4}
                  mt={2}
                >
                  <SimpleGrid
                    columns={{ base: 1, md: 2, xl: 3 }}
                    spacing={4}
                  >
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="xs" color="gray.500">Update Status:</Text>
                      <Select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                        bg="white"
                        size="md"
                      >
                        {ORDER_STATUS_OPTIONS.filter(o => o !== "all").map(opt => (
                          <option key={opt} value={opt}>
                            {opt.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </option>
                        ))}
                      </Select>
                    </VStack>

                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="xs" color="gray.500">Shipping Date:</Text>
                      <Input
                        type="date"
                        value={shipmentDate}
                        onChange={(e) => setShipmentDate(e.target.value)}
                        bg="white"
                        size="md"
                      />
                    </VStack>

                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="xs" color="gray.500">Courier Name:</Text>
                      <Input
                        placeholder="e.g. BlueDart"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        bg="white"
                        size="md"
                      />
                    </VStack>

                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="xs" color="gray.500">Tracking ID:</Text>
                      <Input
                        placeholder="TRK123456"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        bg="white"
                        size="md"
                      />
                    </VStack>

                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="xs" color="gray.500">Expected Delivery:</Text>
                      <Input
                        type="date"
                        value={expectedDelivery}
                        onChange={(e) => setExpectedDelivery(e.target.value)}
                        bg="white"
                        size="md"
                      />
                    </VStack>

                    <VStack align="start" spacing={1} justify="flex-end">
                      <Button
                        leftIcon={<IoCheckmarkDoneCircleSharp />}
                        bg="#10B981"
                        _hover={{ bg: "#059669" }}
                        color="white"
                        onClick={handleUpdateStatusAndDate}
                        isLoading={isLoading}
                        w="100%"
                      >
                        Save Changes
                      </Button>
                    </VStack>
                  </SimpleGrid>

                  <Flex
                    direction={{ base: "column", sm: "row" }}
                    gap={2}
                    wrap="wrap"
                    justify="flex-end"
                  >
                    <Button
                      leftIcon={<FiTruck />}
                      bg="#3B82F6"
                      _hover={{ bg: "#2563EB" }}
                      color="white"
                      flex={{ base: "1", sm: "none" }}
                      onClick={() => {
                        setOrderStatus("delivered");
                        setTimeout(() => handleUpdateStatusAndDate(), 0);
                      }}
                      isLoading={isLoading}
                    >
                      Mark Delivered
                    </Button>

                    <Button
                      leftIcon={<FiDownload />}
                      colorScheme="purple"
                      variant="solid"
                      flex={{ base: "1", sm: "none" }}
                      onClick={Download_Packing_Slip}
                    >
                      Packing Slip
                    </Button>

                    <Button
                      leftIcon={<FiDownload />}
                      colorScheme="teal"
                      variant="solid"
                      flex={{ base: "1", sm: "none" }}
                      onClick={() => Download_Detailed_Order(selectedOrder)}
                    >
                      Download Details
                    </Button>

                    <Button
                      leftIcon={<FiDownload />}
                      colorScheme="blue"
                      variant="outline"
                      flex={{ base: "1", sm: "none" }}
                      onClick={Print_Bill}
                    >
                      Print Bill
                    </Button>
                  </Flex>
                </Flex>
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
