import {
  Box, Button, Flex, Grid, Icon, Text,
  useColorMode, useColorModeValue,
  Table, Thead, Tr, Th, Tbody, Td,
  Input, VStack, HStack, Divider, Badge,
  Tabs, TabList, TabPanels, Tab, TabPanel
} from "@chakra-ui/react";
import React from "react";
import {
  FaCreditCard, FaPaypal, FaWallet, FaHome, FaTruck,
  FaDownload, FaUndo, FaCheckCircle
} from "react-icons/fa";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";

export default function Billing() {
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const { colorMode } = useColorMode();

  return (
    <Box pt={{ base: "20px", md: "75px" }}>
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Order Info</Tab>
          <Tab>Payment</Tab>
          <Tab>Transactions</Tab>
        </TabList>

        <TabPanels>
          {/* Order Info */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Text fontSize="xl" fontWeight="bold">Order Summary</Text>
              </CardHeader>
              <CardBody>
                <Table size="sm" variant="simple">
                  <Thead><Tr><Th>Item</Th><Th>Qty</Th><Th isNumeric>Price</Th></Tr></Thead>
                  <Tbody>
                    {["Shoes","Shirt","Watch"].map((name,i) => (
                      <Tr key={i}>
                        <Td>{name}</Td><Td>1</Td><Td isNumeric>${(i+1)*100}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                <Divider my="4" />
                <Flex justify="space-between"><Text>Total</Text><Text fontWeight="bold">$300</Text></Flex>
              </CardBody>
            </Card>

            <Card mt="4">
              <CardHeader>
                <Text fontSize="xl" fontWeight="bold">Customer & Addresses</Text>
              </CardHeader>
              <CardBody>
                <VStack spacing="3">
                  <Input placeholder="Customer Name" value="John Doe" isReadOnly />
                  <Input placeholder="Email" value="john@example.com" isReadOnly />
                  <HStack spacing="3">
                    <Icon as={FaHome} />
                    <Input placeholder="Billing Address" value="123 Main St" />
                  </HStack>
                  <HStack spacing="3">
                    <Icon as={FaTruck} />
                    <Input placeholder="Shipping Address" value="456 Market St" />
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Payment */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Text fontSize="xl" fontWeight="bold">Payment Methods</Text>
              </CardHeader>
              <CardBody>
                <VStack spacing="3">
                  {[
                    {icon: FaCreditCard, label: "Credit/Debit Card"},
                    {icon: FaPaypal, label: "PayPal"},
                    {icon: FaWallet, label: "Store Wallet"},
                  ].map((method, i) => (
                    <Button
                      key={i}
                      leftIcon={<Icon as={method.icon} />}
                      variant="outline"
                      width="full"
                      justifyContent="flex-start"
                    >
                      {method.label}
                    </Button>
                  ))}
                  <Button colorScheme="teal" size="lg" width="full">
                    Confirm & Charge $300
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Transactions */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Text fontSize="xl" fontWeight="bold">Transaction History</Text>
              </CardHeader>
              <CardBody>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>ID</Th><Th>Status</Th><Th isNumeric>Amount</Th><Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {[{id:"1001", status:"Paid", amount:220}, {id:"1002", status:"Pending", amount:145}].map((tx) => (
                      <Tr key={tx.id}>
                        <Td>{tx.id}</Td>
                        <Td>
                          <Badge colorScheme={tx.status==="Paid"?"green":"yellow"}>{tx.status}</Badge>
                        </Td>
                        <Td isNumeric>${tx.amount}</Td>
                        <Td>
                          <HStack spacing="2">
                            <Button size="xs" leftIcon={<FaDownload />}>Invoice</Button>
                            {tx.status==="Pending" && (
                              <Button size="xs" leftIcon={<FaCheckCircle />} colorScheme="green">
                                Mark Paid
                              </Button>
                            )}
                          </HStack>
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
    </Box>
  );
}
