// ---------------- PRODUCTS TABLE ----------------
export const productsTableData = [
  {
    name: "Laptop",
    description: "High performance laptop with 16GB RAM",
    category: "Electronics",
    price: 1200,
    mrp: 1400,
    images: ["https://via.placeholder.com/150"],
    stock: 20,
  },
  {
    name: "Headphones",
    description: "Noise cancelling wireless headphones",
    category: "Accessories",
    price: 200,
    mrp: 250,
    images: ["https://via.placeholder.com/150"],
    stock: 50,
  },
  {
    name: "Keyboard",
    description: "Mechanical keyboard RGB backlight",
    category: "Electronics",
    price: 150,
    mrp: 180,
    images: ["https://via.placeholder.com/150"],
    stock: 10,
  },
  {
    name: "Shoes",
    description: "Comfortable running shoes",
    category: "Fashion",
    price: 80,
    mrp: 100,
    images: ["https://via.placeholder.com/150"],
    stock: 100,
  },
  {
    name: "Smartphone",
    description: "Latest 5G smartphone with AMOLED display",
    category: "Electronics",
    price: 800,
    mrp: 950,
    images: ["https://via.placeholder.com/150"],
    stock: 0,
  },
];

// ---------------- ORDERS TABLE ----------------
export const ordersTableData = [
  {
    address: "64a7b2c3d4e5f67890123456", // ObjectId format for mock
    items: [
      {
        product: "64a7b2c3d4e5f67890123411",
        quantity: 1,
        price: 1200,
      },
    ],
    subtotal: 1200,
    discount: 0,
    total: 1200,
    customer: "Esthera Jackson", // 👈 extra for table display
    date: "05/09/2025",
  },
  {
    address: "64a7b2c3d4e5f67890123457",
    items: [
      {
        product: "64a7b2c3d4e5f67890123412",
        quantity: 2,
        price: 200,
      },
    ],
    subtotal: 400,
    discount: 20,
    total: 380,
    customer: "Alexa Liras",
    date: "04/09/2025",
  },
  {
    address: "64a7b2c3d4e5f67890123458",
    items: [
      {
        product: "64a7b2c3d4e5f67890123413",
        quantity: 1,
        price: 150,
      },
    ],
    subtotal: 150,
    discount: 0,
    total: 150,
    customer: "Laurent Michael",
    date: "03/09/2025",
  },
];
// Dummy data for Dashboard.js
export const pageVisits = [
  { pageName: "/home", visitors: 4569, uniqueUsers: 3400, bounceRate: "46,53%" },
  { pageName: "/products", visitors: 3985, uniqueUsers: 3192, bounceRate: "36,49%" },
  { pageName: "/about", visitors: 3513, uniqueUsers: 2942, bounceRate: "26,85%" },
  { pageName: "/contact", visitors: 2050, uniqueUsers: 1900, bounceRate: "46,53%" },
  { pageName: "/blog", visitors: 1795, uniqueUsers: 1400, bounceRate: "36,49%" },
];

export const socialTraffic = [
  { referral: "Facebook", visitors: 1480, percentage: 60, color: "blue" },
  { referral: "Instagram", visitors: 760, percentage: 30, color: "pink" },
  { referral: "Twitter", visitors: 690, percentage: 20, color: "twitter" },
  { referral: "LinkedIn", visitors: 440, percentage: 15, color: "linkedin" },
];
