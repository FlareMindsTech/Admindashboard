import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  Textarea,
  Radio,
  RadioGroup,
  Stack,
  Select,
  Image,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useState } from "react";

function AddProductForm() {
  const [size, setSize] = useState("");
  const [gender, setGender] = useState("Men");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["Jacket", "Shirt", "Pants"]);

  const [editIndex, setEditIndex] = useState(null);
  const [productImages, setProductImages] = useState([]);

  // Product fields
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stock, setStock] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [category, setCategory] = useState("");

  // Category fields
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  // Modal controls
  const { isOpen: isProductOpen, onOpen: onProductOpen, onClose: onProductClose } = useDisclosure();
  const { isOpen: isCategoryOpen, onOpen: onCategoryOpen, onClose: onCategoryClose } = useDisclosure();

  const bgCard = useColorModeValue("white", "gray.700");

  // Handle multiple image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setProductImages((prev) => [...prev, ...urls]);
  };

  // Add or update product
  const handleSubmit = () => {
    const productData = {
      productName,
      productDescription,
      size,
      gender,
      basePrice,
      stock,
      discount,
      discountType,
      category,
      productImages,
    };

    if (editIndex !== null) {
      const updatedProducts = [...products];
      updatedProducts[editIndex] = productData;
      setProducts(updatedProducts);
      setEditIndex(null);
    } else {
      setProducts([...products, productData]);
    }

    // Clear form
    setProductName("");
    setProductDescription("");
    setSize("");
    setGender("Men");
    setBasePrice("");
    setStock("");
    setDiscount("");
    setDiscountType("");
    setCategory("");
    setProductImages([]);
    onProductClose();
  };

  // Edit product
  const handleEdit = (index) => {
    const p = products[index];
    setProductName(p.productName);
    setProductDescription(p.productDescription);
    setSize(p.size);
    setGender(p.gender);
    setBasePrice(p.basePrice);
    setStock(p.stock);
    setDiscount(p.discount);
    setDiscountType(p.discountType);
    setCategory(p.category);
    setProductImages(p.productImages || []);
    setEditIndex(index);
    onProductOpen();
  };

  // Delete product
  const handleDelete = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  // Add category dynamically
  const handleAddCategory = () => {
    if (categoryName && !categories.includes(categoryName)) {
      setCategories([...categories, categoryName]);
    }
    setCategoryName("");
    setCategoryDescription("");
    onCategoryClose();
  };

  return (
    <Box p="9">
      {/* Header */}
      <Flex justify="space-between" mb="6">
        <Button colorScheme="blue" onClick={onProductOpen}>
          Add Product
        </Button>
      </Flex>

      {/* Product Table */}
      {products.length > 0 && (
        <Table variant="simple" mt="6" boxShadow="md" borderRadius="md" overflow="hidden">
          <Thead bg="gray.100">
            <Tr>
              <Th>Image</Th>
              <Th>Name</Th>
              <Th>Size</Th>
              <Th>Gender</Th>
              <Th>Price</Th>
              <Th>Stock</Th>
              <Th>Discount</Th>
              <Th>Category</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {products.map((p, index) => (
              <Tr key={index} _hover={{ bg: "gray.50" }}>
                <Td>
                  {p.productImages?.[0] ? (
                    <Image src={p.productImages[0]} boxSize="50px" objectFit="cover" borderRadius="md" />
                  ) : (
                    <Box w="50px" h="50px" bg="gray.200" borderRadius="md" />
                  )}
                </Td>
                <Td>{p.productName}</Td>
                <Td>{p.size}</Td>
                <Td>{p.gender}</Td>
                <Td>₹{p.basePrice}</Td>
                <Td>{p.stock}</Td>
                <Td>{p.discount ? `${p.discount} (${p.discountType})` : "-"}</Td>
                <Td>{p.category}</Td>
                <Td>
                  <Button size="sm" colorScheme="yellow" mr="2" onClick={() => handleEdit(index)}>
                    Edit
                  </Button>
                  <Button size="sm" colorScheme="red" onClick={() => handleDelete(index)}>
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Product Modal */}
      <Modal isOpen={isProductOpen} onClose={onProductClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editIndex !== null ? "Edit Product" : "Add Product"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap="6">
              {/* Left Side */}
              <GridItem>
                <Box bg={bgCard} p="6" borderRadius="md" shadow="sm" mb="6">
                  <Text fontWeight="bold" mb="4">
                    General Information
                  </Text>
                  <Input placeholder="Product Name" mb="3" value={productName} onChange={(e) => setProductName(e.target.value)} />
                  <Textarea placeholder="Product Description" mb="3" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} />

                  <Flex gap="4" mb="3">
                    <Box>
                      <Text mb="1">Size</Text>
                      <Stack direction="row">
                        {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                          <Button key={s} size="sm" colorScheme={size === s ? "green" : "gray"} onClick={() => setSize(s)}>
                            {s}
                          </Button>
                        ))}
                      </Stack>
                    </Box>

                    <Box>
                      <Text mb="1">Gender</Text>
                      <RadioGroup onChange={setGender} value={gender}>
                        <Stack direction="row">
                          <Radio value="Men">Men</Radio>
                          <Radio value="Woman">Woman</Radio>
                          <Radio value="Unisex">Unisex</Radio>
                        </Stack>
                      </RadioGroup>
                    </Box>
                  </Flex>
                </Box>

                <Box bg={bgCard} p="6" borderRadius="md" shadow="sm">
                  <Text fontWeight="bold" mb="4">
                    Pricing & Stock
                  </Text>
                  <Input placeholder="Base Price" mb="3" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
                  <Input placeholder="Stock" mb="3" value={stock} onChange={(e) => setStock(e.target.value)} />
                  <Input placeholder="Discount" mb="3" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                  <Select placeholder="Discount Type" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                    <option>Chinese New Year Discount</option>
                    <option>Summer Sale</option>
                  </Select>
                </Box>
              </GridItem>

              {/* Right Side */}
              <GridItem>
                {/* Images */}
                <Box bg={bgCard} p="6" borderRadius="md" shadow="sm" mb="6">
                  <Text fontWeight="bold" mb="4">
                    Upload Images
                  </Text>

                  {productImages.length > 0 ? (
                    <Image src={productImages[0]} mb="3" borderRadius="md" maxH="200px" objectFit="cover" />
                  ) : (
                    <Box h="200px" bg="gray.100" mb="3" borderRadius="md" />
                  )}

                  <Flex gap="2">
                    {productImages.map((img, idx) => (
                      <Box
                        key={idx}
                        border={idx === 0 ? "2px solid green" : "1px solid gray"}
                        borderRadius="md"
                        w="50px"
                        h="50px"
                        overflow="hidden"
                        cursor="pointer"
                        onClick={() => setProductImages([img, ...productImages.filter((_, i) => i !== idx)])}
                      >
                        <Image src={img} objectFit="cover" w="100%" h="100%" />
                      </Box>
                    ))}

                    {/* Add Image */}
                    <Box
                      w="50px"
                      h="50px"
                      border="1px dashed gray"
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      position="relative"
                    >
                      <Input type="file" accept="image/*" multiple opacity="0" position="absolute" w="50px" h="50px" onChange={handleImageChange} />
                      <Text fontSize="xl" color="gray.500">
                        +
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                {/* Category */}
                <Box bg={bgCard} p="6" borderRadius="md" shadow="sm">
                  <Text fontWeight="bold" mb="4">
                    Category
                  </Text>
                  <Select placeholder="Select Product Category" mb="3" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                  <Button colorScheme="green" onClick={onCategoryOpen}>
                    Add Category
                  </Button>
                </Box>
              </GridItem>
            </Grid>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={handleSubmit}>
              {editIndex !== null ? "Update Product" : "Submit Product"}
            </Button>
            <Button variant="ghost" onClick={onProductClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={isCategoryOpen} onClose={onCategoryClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Category</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb="2">Category Name</Text>
            <Input placeholder="Weatherwear" mb="4" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
            <Text mb="2">Description</Text>
            <Textarea placeholder="Description for the category" value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" onClick={handleAddCategory}>
              Add Category
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default AddProductForm;
