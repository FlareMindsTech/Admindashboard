// Chakra imports
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import TablesTableRow from "components/Tables/TablesTableRow";
import React, { useState } from "react";
import { FaUsers } from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdAdminPanelSettings } from "react-icons/md";
import axiosInstance from "views/utils/axiosInstance";

function AdminManagement() {
  // Chakra color mode
  const textColor = useColorModeValue("gray.700", "white");
  const iconTeal = useColorModeValue("teal.300", "teal.300");
  const iconBoxInside = useColorModeValue("white", "white");
  const bgButton = useColorModeValue("gray.100", "gray.100");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "Admin",
    department: "",
    password: "",
  });
  const [adminData, setAdminData] = useState([
    {
      id: 1, // Added ID for reliable deletion
      name: "John Smith",
      role: "Super Admin",
      department: "IT",
      status: "Active",
      lastActive: "2023-10-11",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "Admin",
      department: "HR",
      status: "Active",
      lastActive: "2023-10-10",
    },
    {
      id: 3,
      name: "Mike Wilson",
      role: "Admin",
      department: "Finance",
      status: "Inactive",
      lastActive: "2023-10-09",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin((prev) => ({ ...prev, [name]: value }));
  };

  // API call to create admin
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Assuming the API returns the new admin object, including an 'id'
      const res = await axiosInstance.post("/api/admins", newAdmin);
      if (res.data && res.data.success) {
        // Use a temporary ID for the demo if the API response is not complete
        const newAdminWithId = {
            ...res.data.admin,
            id: res.data.admin.id || Date.now(),
        }
        setAdminData((prev) => [...prev, newAdminWithId]);
        setSuccess("Admin created successfully!");
        setNewAdmin({
          name: "",
          email: "",
          role: "Admin",
          department: "",
          password: "",
        });
        onClose();
      } else {
        setError(res.data.message || "Failed to create admin.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "API error. Try again.");
    }
    setLoading(false);
  };

  // --- NEW FUNCTION: API call to delete admin ---
  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this administrator?")) {
        return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Replace '/api/admins/:id' with your actual endpoint
      const res = await axiosInstance.delete(`/api/admins/${adminId}`);
      
      if (res.status === 200 || res.data.success) {
        // Remove the admin from the local state
        setAdminData((prev) => prev.filter(admin => admin.id !== adminId));
        setSuccess("Admin deleted successfully!");
      } else {
        setError(res.data.message || "Failed to delete admin.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "API error. Try again.");
    }
    setLoading(false);
  };
  // ---------------------------------------------


  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
      {/* Statistics Cards */}
      <Grid
        templateColumns={{ sm: "1fr", md: "1fr 1fr 1fr" }}
        gap="24px"
        mb="24px"
      >
        <Card minH="83px">
          <CardBody>
            <Flex flexDirection="row" align="center" justify="center" w="100%">
              <Stat me="auto">
                <StatLabel
                  fontSize="sm"
                  color="gray.400"
                  fontWeight="bold"
                  pb="2px"
                >
                  Total Admins
                </StatLabel>
                <Flex>
                  <StatNumber fontSize="lg" color={textColor}>
                    {/* Updated to reflect actual data length */}
                    {adminData.length} 
                  </StatNumber>
                </Flex>
              </Stat>
              <IconBox as="box" h={"45px"} w={"45px"} bg={iconTeal}>
                <Icon as={FaUsers} h={"24px"} w={"24px"} color={iconBoxInside} />
              </IconBox>
            </Flex>
          </CardBody>
        </Card>
        <Card minH="83px">
          <CardBody>
            <Flex flexDirection="row" align="center" justify="center" w="100%">
              <Stat me="auto">
                <StatLabel
                  fontSize="sm"
                  color="gray.400"
                  fontWeight="bold"
                  pb="2px"
                >
                  Active Admins
                </StatLabel>
                <Flex>
                  <StatNumber fontSize="lg" color={textColor}>
                    {/* Count only 'Active' status for demonstration */}
                    {adminData.filter(a => a.status === "Active").length}
                  </StatNumber>
                </Flex>
              </Stat>
              <IconBox as="box" h={"45px"} w={"45px"} bg="green.300">
                <Icon
                  as={IoCheckmarkDoneCircleSharp}
                  h={"24px"}
                  w={"24px"}
                  color={iconBoxInside}
                />
              </IconBox>
            </Flex>
          </CardBody>
        </Card>
        <Card minH="83px">
          <CardBody>
            <Flex flexDirection="row" align="center" justify="center" w="100%">
              <Stat me="auto">
                <StatLabel
                  fontSize="sm"
                  color="gray.400"
                  fontWeight="bold"
                  pb="2px"
                >
                  Super Admins
                </StatLabel>
                <Flex>
                  <StatNumber fontSize="lg" color={textColor}>
                    {/* Count only 'Super Admin' role for demonstration */}
                    {adminData.filter(a => a.role === "Super Admin").length}
                  </StatNumber>
                </Flex>
              </Stat>
              <IconBox as="box" h={"45px"} w={"45px"} bg="blue.300">
                <Icon
                  as={MdAdminPanelSettings}
                  h={"24px"}
                  w={"24px"}
                  color={iconBoxInside}
                />
              </IconBox>
            </Flex>
          </CardBody>
        </Card>
      </Grid>
      
      {/* Success/Error Message Display */}
      {error && <Text color="red.500" mb={4} p={3} border="1px" borderColor="red.200" borderRadius="md">{error}</Text>}
      {success && <Text color="green.500" mb={4} p={3} border="1px" borderColor="green.200" borderRadius="md">{success}</Text>}
      

      {/* Admin Table */}
      <Card overflowX={{ sm: "scroll", xl: "hidden" }} pb="0px">
        <CardHeader p="6px 0px 22px 0px">
          <Flex justify="space-between" align="center">
            <Text fontSize="xl" color={textColor} fontWeight="bold">
              Administrators Table
            </Text>
            <Button
              colorScheme="blue"
              onClick={onOpen}
              fontSize="sm"
              borderRadius="8px"
            >
              + Add Admin
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          <Table variant="simple" color={textColor}>
            <Thead>
              <Tr my=".8rem" pl="0px" color="gray.400">
                <Th pl="0px" color="gray.400">
                  Name
                </Th>
                <Th color="gray.400">Role</Th>
                <Th color="gray.400">Department</Th>
                <Th color="gray.400">Status</Th>
                <Th color="gray.400">Last Active</Th>
                {/* Added column for Actions */}
                <Th color="gray.400">Actions</Th> 
              </Tr>
            </Thead>
            <Tbody>
              {adminData.map((row, index) => {
                return (
                  <TablesTableRow
                    key={row.id} // Use ID as key
                    id={row.id} // Pass ID for deletion
                    name={row.name}
                    role={row.role}
                    department={row.department}
                    status={row.status}
                    lastActive={row.lastActive}
                    // Pass the new handler to the row component
                    onDelete={() => handleDeleteAdmin(row.id)} 
                  />
                );
              })}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Add Admin Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Admin</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb="24px">
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input
                id="name"
                name="name"
                placeholder="Admin Name"
                onChange={handleInputChange}
                value={newAdmin.name}
              />
            </FormControl>
            <FormControl mb="24px">
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                name="email"
                placeholder="Admin Email"
                onChange={handleInputChange}
                value={newAdmin.email}
              />
            </FormControl>
            <FormControl mb="24px">
              <FormLabel htmlFor="role">Role</FormLabel>
              <Select
                id="role"
                name="role"
                placeholder="Select role"
                onChange={handleInputChange}
                value={newAdmin.role}
              >
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
              </Select>
            </FormControl>
            <FormControl mb="24px">
              <FormLabel htmlFor="department">Department</FormLabel>
              <Input
                id="department"
                name="department"
                placeholder="Admin Department"
                onChange={handleInputChange}
                value={newAdmin.department}
              />
            </FormControl>
            <FormControl mb="24px">
              <FormLabel htmlFor="password">Password</FormLabel>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Admin Password"
                onChange={handleInputChange}
                value={newAdmin.password}
              />
            </FormControl>
            {/* Removed redundant error/success display from modal, moved to main body */}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSubmit} isLoading={loading}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}

// Custom IconBox component
function IconBox({ children, ...rest }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="12px"
      {...rest}
    >
      {children}
    </Box>
  );
}

export default AdminManagement; 