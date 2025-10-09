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
  Image,
  Input,
  Select,
  Badge,
  useToast,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";

import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";

import storeLogo from "assets/img/Aadvi-logo.png";

export default function Billing() {
  const textColor = useColorModeValue("gray.800", "white");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [currentUser, setCurrentUser] = useState(null);

  // ------------------ ACCESS CONTROL ------------------
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      toast({
        title: "Access Denied 🔒",
        description: "Only admins and super admins can access this page.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      navigate("/auth/signin");
      return;
    }
    setCurrentUser(user);
  }, [navigate, toast]);

  // ------------------ FETCH DATA ------------------
  useEffect(() => {
    if (currentUser) {
      fetchOrders();
      fetchTransactions();
      fetchPayments();
    }
  }, [currentUser]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:7000/api/orders/all");
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:7000/api/transactions/all");
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get("http://localhost:7000/api/payments/all");
      setPayments(res.data);
    } catch (err) {
      console.error("Error fetching payments:", err);
    }
  };

  // ------------------ ORDER HANDLERS ------------------
  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setDeliveryDate(order.deliveryDate || "");
    setDeliveryTime(order.deliveryTime || "");
    onOpen();
  };

  const calculateTotal = (items) => {
    let totalQty = 0;
    let totalPrice = 0;
    items.forEach((it) => {
      totalQty += it.qty;
      totalPrice += it.qty * it.price;
    });
    return { totalQty, totalPrice };
  };

  const handleConfirmOrder = async () => {
    if (!deliveryDate || !deliveryTime) {
      alert("Please select delivery date and time");
      return;
    }
    try {
      const updatedOrder = {
        status: "confirmed",
        deliveryDate,
        deliveryTime,
        confirmationDate: new Date().toISOString(),
      };
      await axios.put(`http://localhost:7000/api/orders/update/${selectedOrder._id}`, updatedOrder);
      fetchOrders();
      setSelectedOrder({ ...selectedOrder, ...updatedOrder });
      onClose();
    } catch (err) {
      console.error("Error confirming order:", err);
    }
  };

  const handleMarkDelivered = async () => {
    try {
      await axios.put(`http://localhost:7000/api/orders/update/${selectedOrder._id}`, { status: "delivered" });
      fetchOrders();
      setSelectedOrder({ ...selectedOrder, status: "delivered" });
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------ PAYMENT HANDLERS ------------------
  const handlePaymentStatusChange = async (paymentId, newStatus) => {
    try {
      await axios.put(`http://localhost:7000/api/payments/update/${paymentId}`, { status: newStatus });
      fetchPayments();
    } catch (err) {
      console.error("Error updating payment status:", err);
    }
  };

  // ------------------ PDF RECEIPT ------------------
  const handleDownload = () => {
    if (!selectedOrder) return;
    const doc = new jsPDF();
    const img = new Image();
    img.src = storeLogo;
    img.onload = function () {
      const imgWidth = 50;
      const imgHeight = (img.height * imgWidth) / img.width;
      doc.addImage(img, "PNG", 14, 10, imgWidth, imgHeight);

      doc.setFontSize(18);
      doc.text("Order Receipt", 70, 25);

      doc.setFontSize(12);
      doc.text(`Order ID: ${selectedOrder._id}`, 14, imgHeight + 30);
      doc.text(`Customer: ${selectedOrder.customer}`, 14, imgHeight + 38);
      doc.text(`Email: ${selectedOrder.email}`, 14, imgHeight + 46);
      doc.text(`Phone: ${selectedOrder.phone}`, 14, imgHeight + 54);
      doc.text(`Address: ${selectedOrder.address}`, 14, imgHeight + 62);

      if (selectedOrder.deliveryDate && selectedOrder.deliveryTime) {
        doc.text(`Delivery Scheduled: ${selectedOrder.deliveryDate} at ${selectedOrder.deliveryTime}`, 14, imgHeight + 70);
      }

      const tableData = selectedOrder.orderItems.map((it) => [
        it.name,
        `₹${it.price}`,
        it.qty,
        `₹${it.qty * it.price}`,
      ]);

      autoTable(doc, {
        head: [["Item", "Price", "Qty", "Total"]],
        body: tableData,
        startY: imgHeight + 78,
      });

      const { totalQty, totalPrice } = calculateTotal(selectedOrder.orderItems);
      doc.text(`Total Items: ${totalQty}`, 14, doc.lastAutoTable.finalY + 10);
      doc.text(`Total Price: ₹${totalPrice}`, 14, doc.lastAutoTable.finalY + 18);

      if (selectedOrder.notes) {
        doc.text(`Note: ${selectedOrder.notes}`, 14, doc.lastAutoTable.finalY + 30);
      }

      doc.save(`Order_${selectedOrder._id}.pdf`);
    };
  };

  // ------------------ RETURN NULL IF NO ACCESS ------------------
  if (!currentUser) return null;

  // ------------------ RENDER ------------------
  return (
    <Box pt={{ base: "20px", md: "75px" }}>
      <Tabs isFitted variant="enclosed">
        <TabList mb="1em">
          <Tab fontSize="lg" fontWeight="bold" color="white" _selected={{ color: "white", borderBottom: "2px solid white" }}>
            Order Summary
          </Tab>
          <Tab fontSize="lg" fontWeight="bold" color="white" _selected={{ color: "white", borderBottom: "2px solid white" }}>
            Transaction Summary
          </Tab>
          <Tab fontSize="lg" fontWeight="bold" color="white" _selected={{ color: "white", borderBottom: "2px solid white" }}>
            Payment Summary
          </Tab>
        </TabList>

        <TabPanels>
          {/* Orders Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Text fontSize="xl" fontWeight="bold">Order Summary</Text>
              </CardHeader>
              <CardBody>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Order ID</Th>
                      <Th>Customer</Th>
                      <Th>Email</Th>
                      <Th>Phone</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {orders.map((order, i) => (
                      <Tr key={i} cursor="pointer" _hover={{ bg: "gray.100" }} onClick={() => handleRowClick(order)}>
                        <Td>{order._id}</Td>
                        <Td>{order.customer}</Td>
                        <Td>{order.email}</Td>
                        <Td>{order.phone}</Td>
                        <Td>{order.status}</Td>
                        <Td>
                          {order.status === "pending" && (
                            <Button size="sm" colorScheme="green" onClick={() => handleRowClick(order)}>Confirm</Button>
                          )}
                          {order.status === "confirmed" && (
                            <Button size="sm" colorScheme="blue" onClick={() => handleMarkDelivered()}>Mark Delivered</Button>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Transactions Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Text fontSize="xl" fontWeight="bold">Transaction Summary</Text>
              </CardHeader>
              <CardBody>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Transaction ID</Th>
                      <Th>Order ID</Th>
                      <Th>Amount</Th>
                      <Th>Mode</Th>
                      <Th>Date</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {transactions.map((txn, i) => (
                      <Tr key={i}>
                        <Td>{txn.id}</Td>
                        <Td>{txn.orderId}</Td>
                        <Td>₹{txn.amount}</Td>
                        <Td>{txn.mode}</Td>
                        <Td>{txn.date}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Payments Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Text fontSize="xl" fontWeight="bold">Payment Summary</Text>
              </CardHeader>
              <CardBody>
                <Flex mb="3" align="center" gap={3}>
                  <Text>Filter by Status:</Text>
                  <Select
                    w="200px"
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </Select>
                </Flex>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Transaction ID</Th>
                      <Th>Order ID</Th>
                      <Th>Amount</Th>
                      <Th>Method</Th>
                      <Th>Status</Th>
                      <Th>Date</Th>
                      <Th>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {payments
                      .filter(p => paymentFilter === "all" || p.status === paymentFilter)
                      .map((p, i) => (
                        <Tr key={i}>
                          <Td>{p.transaction_id}</Td>
                          <Td>{p.order}</Td>
                          <Td>₹{p.amount}</Td>
                          <Td>{p.method}</Td>
                          <Td>
                            <Badge colorScheme={
                              p.status === "success" ? "green" :
                              p.status === "pending" ? "yellow" :
                              p.status === "failed" ? "red" :
                              "gray"
                            }>
                              {p.status.toUpperCase()}
                            </Badge>
                          </Td>
                          <Td>{new Date(p.createdAt).toLocaleString()}</Td>
                          <Td>
                            <Select
                              size="sm"
                              value={p.status}
                              onChange={(e) => handlePaymentStatusChange(p._id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="success">Success</option>
                              <option value="failed">Failed</option>
                              <option value="refunded">Refunded</option>
                            </Select>
                          </Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal for Order Details */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={3}>
              <Image src={storeLogo} alt="Store Logo" boxSize="50px" objectFit="contain" />
              <Text fontSize="lg" fontWeight="bold">Order Details</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedOrder && (
              <Card>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold">{selectedOrder.customer} &nbsp; #{selectedOrder._id}</Text>
                </CardHeader>
                <CardBody>
                  <Flex justify="space-between" mb="4">
                    <Box>
                      <Text><strong>Email:</strong> {selectedOrder.email}</Text>
                      <Text><strong>Phone:</strong> {selectedOrder.phone}</Text>
                    </Box>
                    <Box textAlign="right">
                      <Text><strong>Address:</strong></Text>
                      <Text>{selectedOrder.address}</Text>
                    </Box>
                  </Flex>

                  <Table size="sm" variant="simple" mb="3">
                    <Thead>
                      <Tr>
                        <Th>Item</Th>
                        <Th isNumeric>Price</Th>
                        <Th isNumeric>Qty</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedOrder.orderItems.map((it, idx) => (
                        <Tr key={idx}>
                          <Td>{it.name}</Td>
                          <Td isNumeric>₹{it.price}</Td>
                          <Td isNumeric>{it.qty}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

                  {(() => {
                    const { totalQty, totalPrice } = calculateTotal(selectedOrder.orderItems);
                    return (
                      <Flex justify="space-between" fontWeight="bold" mb="4">
                        <Text>Total</Text>
                        <Text>₹{totalPrice} ({totalQty} items)</Text>
                      </Flex>
                    );
                  })()}

                  {selectedOrder.status === "pending" && (
                    <Flex direction="column" gap={2} mb="3">
                      <Text fontWeight="bold">Set Delivery Schedule:</Text>
                      <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                      <Input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
                      <Button colorScheme="green" onClick={handleConfirmOrder}>Confirm Order</Button>
                    </Flex>
                  )}

                  {selectedOrder.status === "confirmed" && (
                    <Text fontWeight="bold" color="blue.600">
                      Scheduled Delivery: {selectedOrder.deliveryDate} at {selectedOrder.deliveryTime}
                    </Text>
                  )}

                  <Flex justify="flex-end" gap="3" mt="3">
                    <Button size="sm" colorScheme="green" onClick={handleDownload}>
                      Download Receipt
                    </Button>
                  </Flex>
                </CardBody>
              </Card>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
