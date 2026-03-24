const express = require("express");
const {
  addProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  allProductsToAdmin,
  getProducts,
} = require("../controllers/productController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// --- ADMIN ROUTES ---
// Move static admin routes to the top
router.get("/admin/all", protect, admin, allProductsToAdmin);
router.post("/bulk-add", protect, admin, addProducts);
router.post("/", protect, admin, createProduct);

// --- USER/PUBLIC ROUTES ---
router.get("/", getProducts); // Publicly view all products (with your pagination)
router.get("/:id", getProductById); // Publicly view a single product

// --- PROTECTED ACTIONS ---
// Put dynamic ID routes for admin at the bottom
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;
