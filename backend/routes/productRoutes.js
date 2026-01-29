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

// ADMIN routes
router.post("/bulk-add", protect, admin, addProducts);
router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);
router.get("/admin/all", protect, admin, allProductsToAdmin);

// USER routes
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;
