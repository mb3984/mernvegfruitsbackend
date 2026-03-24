const Product = require("../models/productModel");

/**
 * ADMIN: Add multiple products (bulk upload)
 */
const addProducts = async (req, res) => {
  try {
    const products = await Product.insertMany(req.body);
    res.status(201).json({ message: "Products added successfully", products });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding products", error: error.message });
  }
};

/**
 * USER / ADMIN: Get single product by ID
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * ADMIN: Add single product
 */
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error creating product" });
  }
};

/**
 * ADMIN: Update product (price, stock, etc.)
 */
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

/**
 * ADMIN: Delete product
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

/**
 * ADMIN: Get all products
 */
const allProductsToAdmin = async (req, res) => {
  const products = await Product.find({});
  res.json(products);
};

//   try {
//     const { category, page = 1, limit = 6 } = req.query;
//     const skip = (page - 1) * limit;

//     let query = {};
//     if (category) query.category = category; // Vegetable / Fruit

//     const products = await Product.find(query).skip(skip).limit(Number(limit));

//     const totalCount = await Product.countDocuments(query);

//     res.json({ success: true, products, totalCount });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

const getProducts = async (req, res) => {
  try {
    // 1. Get params and ensure they are Numbers
    let { search, page = 1, limit = 6, sort } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // 2. Search by Name OR Category
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    let sortOption = {};
    if (sort === "asc") sortOption.pricePerKg = 1;
    else if (sort === "desc") sortOption.pricePerKg = -1;

    // 3. Execute Query
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalCount = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  addProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  allProductsToAdmin,
  getProducts,
};
