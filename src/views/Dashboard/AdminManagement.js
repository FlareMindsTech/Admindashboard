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
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  Heading,
  Badge,
  Text,
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import React, { useState, useEffect } from "react";
import { FaUsers } from "react-icons/fa";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { MdAdminPanelSettings } from "react-icons/md";
import { adminAxiosInstance, getAllAdmins } from "views/utils/axiosInstance";

function AdminManagement() {
  // Chakra color mode
  const textColor = useColorModeValue("gray.700", "white");
  const iconTeal = useColorModeValue("teal.300", "teal.300");
  const iconBoxInside = useColorModeValue("white", "white");
  const bgButton = useColorModeValue("gray.100", "gray.100");
  const tableHeaderBg = useColorModeValue("gray.100", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "Admin",
    department: "",
    password: "",
  });
  
  const [adminData, setAdminData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || (storedUser.role !== "admin" && storedUser.role !== "super admin")) {
      toast({
        title: "Access Denied",
        description: "Only admin or super admin users can access this page.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setCurrentUser(storedUser);
  }, [toast]);

  // Fetch admins from backend
  useEffect(() => {
    const fetchAdmins = async () => {
      if (!currentUser) return;

      try {
        const data = await getAllAdmins();
        console.log("Fetched admins:", data);
        setAdminData(data.admins || []); // assuming API returns { admins: [...] }
      } catch (err) {
        console.error("Error fetching admins:", err);
        setError(err.message || "Failed to load admin list.");
        toast({
          title: "Fetch Error",
          description: err.message || "Failed to load admin list.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    if (currentUser) {
      fetchAdmins();
    }
  }, [currentUser, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin((prev) => ({ ...prev, [name]: value }));
  };

  // API call to create admin
  const handleSubmit = async () => {
    // Frontend validation
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      return toast({
        title: "Validation Error",
        description: "All fields are required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdmin.email)) {
      return toast({
        title: "Validation Error",
        description: "Invalid email format",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newAdmin.password)) {
      return toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters, include uppercase, lowercase, and a number",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const res = await adminAxiosInstance.post("/admins/create", newAdmin);

      toast({
        title: "Admin Created",
        description: `Admin ${res.data.admin.name} created successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setAdminData((prev) => [...prev, res.data.admin]);
      setNewAdmin({
        name: "",
        email: "",
        role: "Admin",
        department: "",
        password: "",
      });
      setSuccess("Admin created successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "API error. Try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  // API call to delete admin
  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this administrator?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await adminAxiosInstance.delete(`/admins/${adminId}`);
      
      if (res.status === 200 || res.data.success) {
        setAdminData((prev) => prev.filter(admin => admin._id !== adminId));
        setSuccess("Admin deleted successfully!");
        toast({
          title: "Success",
          description: "Admin deleted successfully!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        setError(res.data.message || "Failed to delete admin.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "API error. Try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "green";
      case "Inactive": return "red";
      case "Pending": return "yellow";
      default: return "gray";
    }
  };

  if (!currentUser) {
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Text>Loading...</Text>
      </Flex>
    );
  }

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
      

      {/* Admin Table with new styling */}
      <Card p={5} shadow="xl">
        <CardHeader p="6px 0px 22px 0px">
          <Flex justify="space-between" align="center">
            <Heading size="md">👤 Administrators Table</Heading>
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
          <Table variant="striped" colorScheme="blue">
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Department</Th>
                <Th>Status</Th>
                <Th>Last Active</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {adminData.map((admin, index) => (
                <Tr key={admin._id || index}>
                  <Td>{index + 1}</Td>
                  <Td>{admin.name}</Td>
                  <Td>{admin.email}</Td>
                  <Td>{admin.role}</Td>
                  <Td>{admin.department || "N/A"}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(admin.status)}>
                      {admin.status || "Active"}
                    </Badge>
                  </Td>
                  <Td>{admin.lastActive || "2023-10-15"}</Td>
                  <Td>
                    <Button
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleDeleteAdmin(admin._id)}
                      isLoading={loading}
                    >
                      Delete
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          
          {adminData.length === 0 && !loading && (
            <Text textAlign="center" py={4} color="gray.500">
              No administrators found.
            </Text>
          )}
          
          {loading && (
            <Text textAlign="center" py={4} color="gray.500">
              Loading administrators...
            </Text>
          )}
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