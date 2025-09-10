import {
  Box, Table, Thead, Tbody, Tr, Th, Td,
  Text, useColorModeValue, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, useDisclosure, Button, Flex, Tabs, Tab, TabList, TabPanels, TabPanel
} from "@chakra-ui/react";
import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";

export default function Billing() {
  const textColor = useColorModeValue("gray.800", "white");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ✅ Orders Data
  const orders = [
    {
      id: "001",
      customer: "Emily Carter",
      email: "emily.carter@example.com",
      phone: "555-123-4567",
      address: "Fashion Street Mall, Los Angeles, CA",
      items: [
        { name: "Denim Jacket", price: 75, qty: 1 },
        { name: "Slim Fit Jeans", price: 50, qty: 2 },
        { name: "Sneakers", price: 90, qty: 1 },
      ],
      compliment: "Free scarf included in the package",
    },
    {
      id: "002",
      customer: "Michael Brown",
      email: "michael.brown@example.com",
      phone: "555-987-6543",
      address: "Downtown Plaza, New York, NY",
      items: [
        { name: "Formal Shirt", price: 40, qty: 2 },
        { name: "Leather Belt", price: 30, qty: 1 },
        { name: "Oxford Shoes", price: 120, qty: 1 },
      ],
      compliment: "Gift wrap included with this order",
    },
  ];

  // ✅ Transactions Data
  const transactions = [
    { id: "T001", orderId: "001", amount: 265, mode: "Credit Card", date: "2025-09-10" },
    { id: "T002", orderId: "002", amount: 230, mode: "UPI", date: "2025-09-09" },
  ];

  const handleRowClick = (order) => {
    setSelectedOrder(order);
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

  // ✅ Download PDF Receipt
  const handleDownload = () => {
    if (!selectedOrder) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Order Receipt", 14, 20);

    // Customer Info
    doc.setFontSize(12);
    doc.text(`Order ID: ${selectedOrder.id}`, 14, 30);
    doc.text(`Customer: ${selectedOrder.customer}`, 14, 38);
    doc.text(`Email: ${selectedOrder.email}`, 14, 46);
    doc.text(`Phone: ${selectedOrder.phone}`, 14, 54);
    doc.text(`Address: ${selectedOrder.address}`, 14, 62);

    // Items Table
    const tableData = selectedOrder.items.map(it => [
      it.name, `$${it.price}`, it.qty, `$${it.qty * it.price}`
    ]);
    autoTable(doc, {
      head: [["Item", "Price", "Qty", "Total"]],
      body: tableData,
      startY: 70,
    });

    // Totals
    const { totalQty, totalPrice } = calculateTotal(selectedOrder.items);
    doc.text(`Total Items: ${totalQty}`, 14, doc.lastAutoTable.finalY + 10);
    doc.text(`Total Price: $${totalPrice}`, 14, doc.lastAutoTable.finalY + 18);

    if (selectedOrder.compliment) {
      doc.text(`Note: ${selectedOrder.compliment}`, 14, doc.lastAutoTable.finalY + 30);
    }

    doc.save(`Order_${selectedOrder.id}.pdf`);
  };

  return (
    <Box pt={{ base: "20px", md: "75px" }}>
      <Tabs isFitted variant="enclosed">
        <TabList mb="1em">
          <Tab>Order Summary</Tab>
          <Tab>Transaction Summary</Tab>
        </TabList>

        <TabPanels>
          {/* ✅ Orders Tab */}
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
                    </Tr>
                  </Thead>
                  <Tbody>
                    {orders.map((order, i) => (
                      <Tr
                        key={i}
                        cursor="pointer"
                        _hover={{ bg: "gray.100" }}
                        onClick={() => handleRowClick(order)}
                      >
                        <Td>{order.id}</Td>
                        <Td>{order.customer}</Td>
                        <Td>{order.email}</Td>
                        <Td>{order.phone}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* ✅ Transactions Tab */}
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
                        <Td>${txn.amount}</Td>
                        <Td>{txn.mode}</Td>
                        <Td>{txn.date}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* ✅ Modal for Order Details */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Order Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedOrder && (
              <Card>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold">
                    {selectedOrder.customer} &nbsp; #{selectedOrder.id}
                  </Text>
                </CardHeader>
                <CardBody>
                  <Flex justify="space-between" mb="4">
                    <Box>
                      <Text><strong>Email:</strong> {selectedOrder.email}</Text>
                      <Text><strong>Phone:</strong> {selectedOrder.phone}</Text>
                    </Box>
                    <Box textAlign="right">
                      <Text><strong>Distribution:</strong></Text>
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
                      {selectedOrder.items.map((it, idx) => (
                        <Tr key={idx}>
                          <Td>{it.name}</Td>
                          <Td isNumeric>${it.price}</Td>
                          <Td isNumeric>{it.qty}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

                  {(() => {
                    const { totalQty, totalPrice } = calculateTotal(selectedOrder.items);
                    return (
                      <Flex justify="space-between" fontWeight="bold" mb="4">
                        <Text>Total</Text>
                        <Text>${totalPrice} ({totalQty} items)</Text>
                      </Flex>
                    );
                  })()}

                  <Flex justify="flex-end" gap="3">
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
