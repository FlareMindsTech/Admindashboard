// AdminProfile.js
import {
    Avatar,
    Box, // Used for the main container and responsive table wrapper
    Button,
    Flex,
    Grid,
    Text,
    VStack,
    HStack,
    Image,
    Divider,
    useColorModeValue,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Spinner,
    Alert,
    AlertIcon,
    useToast,
} from "@chakra-ui/react";
import { FaUsers, FaBoxOpen, FaEdit, FaSignOutAlt } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import storeLogo from "assets/img/Aadvi-logo.png";
import Card from "components/Card/Card";

import React, { useEffect, useState, useCallback } from "react";
// --- CRITICAL CHANGE: Import the dedicated admin instance ---
import { adminAxiosInstance } from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";


// Helper function to safely read and parse admin data from local storage
const getInitialAdminData = () => {
    // 🛑 CRITICAL: Use the admin-specific storage keys
    const token = localStorage.getItem("adminToken");
    const userString = localStorage.getItem("adminUser");
    const userRole = localStorage.getItem("userRole");

    let userData = {};
    let adminId = null;

    try {
        if (userString) {
            userData = JSON.parse(userString);
            // Assuming the user object has an _id field from the database
            adminId = userData._id;
        }
    } catch (e) {
        console.error("Failed to parse admin data from localStorage:", e);
    }

    // Use parsed data or fallbacks for initial display
    const name = userData.name || "Admin User";
    // 🛑 CRITICAL: Use userRole from localStorage if available
    const role = userRole || "Guest";
    const email = userData.email || "admin@example.com";

    return {
        adminId,
        token,
        name,
        role,
        email,
        joined: "N/A",
        avatar: "https://i.pravatar.cc/150?img=32",
        actions: [
            { icon: "users", label: "Manage Users" },
            { icon: "box", label: "Manage Products" },
            { icon: "settings", label: "Settings" },
        ],
        // The `users` key will store the list of all admins/users fetched by the API
        users: [],
    };
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function AdminProfile() {
    const toast = useToast();
    const navigate = useNavigate();
    const textColor = useColorModeValue("gray.700", "white");
    const subTextColor = useColorModeValue("gray.500", "gray.300");
    const cardBg = useColorModeValue("white", "navy.800");

    const initialData = getInitialAdminData();
    const [adminData, setAdminData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentView, setCurrentView] = useState("dashboard");

    const handleLogout = useCallback((showToast = true) => {
        localStorage.removeItem("adminToken"); // Clear admin token
        localStorage.removeItem("adminUser"); // Clear admin user object
        localStorage.removeItem("userRole"); // Clear role
        localStorage.removeItem("token"); // Optional: clear generic token too

        if (showToast) {
            toast({
                title: "Logged Out",
                description: "You have been successfully logged out.",
                status: "info",
                duration: 2000,
                isClosable: true,
            });
        }

        setTimeout(() => {
            navigate("/auth/signin"); // Redirect to the main signin page
        }, 1000);
    }, [navigate, toast]); // Added toast and navigate to dependency array

    // ✅ Fetch Admin Data from backend
    useEffect(() => {
        const fetchAdminData = async () => {
            setLoading(true);
            setError("");

            const { token, adminId, role } = initialData;

            // 🛑 CRITICAL: Enforce Admin/Super Admin access based on role
            if (!token || (role !== "admin" && role !== "super admin")) {
                setError("Access denied. Please log in as Admin.");
                setLoading(false);
                handleLogout(false); // Log out and redirect
                return;
            }
            if (!adminId) {
                setError("Admin ID not found. Cannot fetch profile data.");
                setLoading(false);
                return;
            }

            try {
                // --- 1. Profile API (Specific Admin Details) ---
                const profileRes = await adminAxiosInstance.get(`/admins/byId/${adminId}`);

                // --- 2. Users API (All Admins/Users for Management View) ---
                const usersRes = await adminAxiosInstance.get(`/admins/all`);

                const profileData = profileRes.data.admin; // Assuming the profile endpoint returns { admin: {...} }

                const newAdminData = {
                    ...adminData,
                    // ✅ Update with the latest data from the backend
                    name: profileData.name,
                    role: profileData.role,
                    email: profileData.email,
                    joined: profileData.createdAt?.slice(0, 10),
                    // Assuming the users endpoint returns an array of admins at the root or within an 'admins' property
                    users: usersRes.data.admins || usersRes.data || [],
                };

                setAdminData(newAdminData);

            } catch (err) {
                console.error("❌ API Error:", err.response?.data || err.message);
                setError(err.response?.data?.message || "Failed to load complete admin data from API. Session expired or insufficient privileges.");

                // If the fetch fails due to auth error, clear local storage and redirect
                if (err.response?.status === 401 || err.response?.status === 403) {
                    handleLogout(false); // Clear storage but don't show success toast
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [initialData.adminId, initialData.role, initialData.token, handleLogout]); // Added initialData fields and handleLogout to dep array

    const handleActionClick = (action) => {
        // Navigate to the Product Management page instead of setting a local view
        if (action.label === "Manage Products") {
            // 🛑 CRITICAL: Redirect to product route
            navigate("/admin/products");
        } else if (action.label === "Manage Users") {
            setCurrentView("users");
        } else {
            setCurrentView("dashboard");
        }
    };


    return (
        // Main container with responsive padding
        <Box pt={{ base: "80px", md: "100px" }} px={{ base: 4, md: 8, xl: 10 }}>
            {/* ⚠️ Error Alert */}
            {error && (
                <Alert
                    status="error"
                    position="absolute"
                    top={{ base: "80px", md: "100px" }}
                    left="50%"
                    transform="translateX(-50%)"
                    width={{ base: "90%", md: "50%" }}
                    zIndex="99"
                    borderRadius="lg"
                >
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* Main Content: Column on mobile, Row on tablet/desktop */}
            <Flex
                direction={{ base: "column", lg: "row" }}
                gap={6}
                align={{ base: "center", lg: "flex-start" }} // Center on mobile, align start on desktop
            >
                {/* Left Column (Profile Card) */}
                <Card
                    w={{ base: "100%", sm: "350px", lg: "300px" }} // Wider on mobile/small screens for better tap area
                    bg={cardBg}
                    p={6}
                    borderRadius="20px"
                    shadow="xl"
                    position="relative" // For spinner positioning
                >
                    <Flex direction="column" align="center">

                        {loading && (
                            <Spinner
                                position="absolute"
                                size="xl"
                                thickness="4px"
                                color="blue.500"
                                emptyColor="gray.200"
                                zIndex="1"
                                mt="40px"
                            />
                        )}

                        <Image src={storeLogo} alt="Store Logo" boxSize="80px" mb={4} />
                        <Avatar
                            src={adminData.avatar}
                            size="2xl"
                            mb={4}
                            opacity={loading ? 0.6 : 1}
                        />
                        <Text fontSize="xl" fontWeight="bold" color={textColor} opacity={loading ? 0.6 : 1}>{adminData.name}</Text>
                        {/* Display Role prominently */}
                        <Text
                            fontSize="sm"
                            color={adminData.role === 'super admin' ? 'red.500' : 'blue.500'}
                            fontWeight="bold"
                            textTransform="uppercase"
                            opacity={loading ? 0.6 : 1}
                        >
                            {adminData.role}
                        </Text>
                        <Text fontSize="xs" color={subTextColor} mb={4} opacity={loading ? 0.6 : 1}>
                            {adminData.email} {adminData.joined !== "N/A" ? `• Joined ${adminData.joined}` : ''}
                        </Text>

                        <Divider my={3} />

                        {/* Action Buttons */}
                        <VStack spacing={2} align="start" w="100%" mb={4}>
                            {adminData.actions?.map((action, idx) => (
                                <Button
                                    key={idx}
                                    // Use a subtle variant for all, then change color based on action type
                                    variant="solid" 
                                    colorScheme={action.label.includes("Manage") ? "gray" : "teal"}
                                    bg={action.label.includes("Manage") ? useColorModeValue("gray.100", "gray.700") : "teal.400"}
                                    color={action.label.includes("Manage") ? textColor : "white"}
                                    w="100%"
                                    justifyContent="start"
                                    leftIcon={action.icon === "users" ? <FaUsers /> : action.icon === "box" ? <FaBoxOpen /> : <IoSettingsSharp />}
                                    onClick={() => handleActionClick(action)}
                                    isDisabled={loading}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </VStack>

                        <VStack spacing={2} w="100%">
                            <Button w="100%" leftIcon={<FaEdit />} colorScheme="blue" isDisabled={loading}>Edit Profile</Button>
                            <Button w="100%" leftIcon={<FaSignOutAlt />} colorScheme="red" onClick={() => handleLogout()}>Logout</Button>
                        </VStack>
                    </Flex>
                </Card>

                {/* Right Column (View Area) - Takes up remaining space */}
                <Box flex="1" w={{ base: "100%", lg: "auto" }}> 
                    {currentView === "dashboard" && (
                        <Card p={6} borderRadius="20px" bg={cardBg} shadow="xl" h="100%"> 
                            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">Welcome, {adminData.name}!</Text>
                            <Text fontSize={{ base: "sm", md: "md" }} color={subTextColor} mt={2}>You are logged in as a <Text as="span" fontWeight="semibold" textTransform="uppercase" color={adminData.role === 'super admin' ? 'red.500' : 'blue.500'}>{adminData.role}</Text>. This is your administration overview.</Text>
                        </Card>
                    )}

                    {currentView === "users" && (
                        <Card p={6} borderRadius="20px" bg={cardBg} shadow="xl">
                            <Flex justify="space-between" align="center" mb={4} direction={{ base: "column", sm: "row" }} gap={2}>
                                <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">Manage Administrators ({adminData.users.length})</Text>
                                {loading && <HStack><Spinner size="sm" /> <Text fontSize="sm" color={subTextColor}>Fetching admins...</Text></HStack>}
                            </Flex>
                            
                            {/* Responsive Table Wrapper: Allows horizontal scroll on mobile */}
                            <Box overflowX="auto" w="100%"> 
                                <Table variant="simple" minWidth="600px"> {/* Min-width ensures table content doesn't shrink too much */}
                                    <Thead>
                                        <Tr>
                                            <Th>Name</Th>
                                            <Th>Email</Th>
                                            <Th>Role</Th>
                                            <Th isNumeric>ID</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {adminData.users.length > 0 ? (
                                            adminData.users.map((user) => (
                                                <Tr key={user._id}>
                                                    <Td>{user.name} {user._id === adminData.adminId && <Badge colorScheme="teal">You</Badge>}</Td>
                                                    <Td>{user.email}</Td>
                                                    <Td><Badge colorScheme={user.role === 'super admin' ? 'red' : 'blue'}>{user.role}</Badge></Td>
                                                    <Td isNumeric>{user._id.slice(-4)}</Td>
                                                </Tr>
                                            ))
                                        ) : (
                                            <Tr>
                                                <Td colSpan={4} textAlign="center" color={subTextColor}>
                                                    {loading ? "Loading admin accounts..." : "No admin accounts found."}
                                                </Td>
                                            </Tr>
                                        )}
                                    </Tbody>
                                </Table>
                            </Box>
                        </Card>
                    )}
                    {/* The products view now only triggers a redirect, as intended */}
                    {currentView === "products" && (
                        <Card p={6} borderRadius="20px" bg={cardBg} shadow="xl" h="100%">
                            <Text fontSize="lg" fontWeight="bold">Manage Products</Text>
                            <Text fontSize="sm" color={subTextColor}>Redirecting to product management page...</Text>
                        </Card>
                    )}
                </Box>
            </Flex>
        </Box>
    );
}