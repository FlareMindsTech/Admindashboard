import {
  Flex,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import React, { useState } from "react";
import { productsTableData, ordersTableData } from "variables/general.js";

function Tables() {
  const textColor = useColorModeValue("gray.700", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // ✅ Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editData, setEditData] = useState(null);

  // ✅ Handle edit click
  const handleEdit = (row) => {
    setEditData(row);
    onOpen();
  };

  // ✅ Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Flex direction="column" pt={{ base: "120px", md: "75px" }}>
      {/* ✅ Products Table */}
      <Card overflowX={{ sm: "scroll", xl: "hidden" }} pb="0px">
        <CardHeader p="6px 0px 22px 0px">
          <Text fontSize="xl" color={textColor} fontWeight="bold">
            Products Table
          </Text>
        </CardHeader>
        <CardBody>
          <Table variant="simple" color={textColor}>
            <Thead>
              <Tr color="gray.400">
                <Th pl="0px" borderColor={borderColor}>Product</Th>
                <Th borderColor={borderColor}>Category</Th>
                <Th borderColor={borderColor}>Price</Th>
                <Th borderColor={borderColor}>Stock</Th>
                <Th borderColor={borderColor}>Status</Th>
                <Th borderColor={borderColor}>Added On</Th>
                <Th borderColor={borderColor}>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {productsTableData.map((row, index) => (
                <Tr key={index}>
                  <Td>{row.name}</Td>
                  <Td>{row.category}</Td>
                  <Td>{row.price}</Td>
                  <Td>{row.stock}</Td>
                  <Td>{row.status}</Td>
                  <Td>{row.date}</Td>
                  <Td>
                    <Button size="sm" colorScheme="blue" onClick={() => handleEdit(row)}>
                      Edit
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* ✅ Orders Table */}
      <Card my="22px" overflowX={{ sm: "scroll", xl: "hidden" }} pb="0px">
        <CardHeader p="6px 0px 22px 0px">
          <Flex direction="column">
            <Text fontSize="xl" color={textColor} fontWeight="bold">
              Orders Table
            </Text>
          </Flex>
        </CardHeader>
        <CardBody>
          <Table variant="simple" color={textColor}>
            <Thead>
              <Tr color="gray.400">
                <Th pl="0px" borderColor={borderColor}>Order ID</Th>
                <Th borderColor={borderColor}>Customer</Th>
                <Th borderColor={borderColor}>Product</Th>
                <Th borderColor={borderColor}>Amount</Th>
                <Th borderColor={borderColor}>Status</Th>
                <Th borderColor={borderColor}>Date</Th>
                <Th borderColor={borderColor}>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {ordersTableData.map((row, index) => (
                <Tr key={index}>
                  <Td>{row.orderId}</Td>
                  <Td>{row.customer}</Td>
                  <Td>{row.product}</Td>
                  <Td>{row.amount}</Td>
                  <Td>{row.status}</Td>
                  <Td>{row.date}</Td>
                  <Td>
                    <Button size="sm" colorScheme="blue" onClick={() => handleEdit(row)}>
                      Edit
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* ✅ Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Row</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editData && (
              <Flex direction="column" gap="12px">
                {Object.keys(editData).map((key, i) => (
                  <Input
                    key={i}
                    name={key}
                    value={editData[key]}
                    onChange={handleChange}
                    placeholder={key}
                  />
                ))}
              </Flex>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}

export default Tables;
