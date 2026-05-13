const Product = require("../models/productModel");
const redis = require("redis");

// 🚀 PRODUCTION-GRADE REDIS SETUP (With TLS for Cloud/Upstash)
const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true, // Upstash cloud ki idi kachithanga undali
    rejectUnauthorized: false, // Connection errors thagginchadaniki
  },
});

client.on("error", (err) => console.log("Redis Client Error", err));

// Connect to Redis
(async () => {
  try {
    await client.connect();
    console.log("✅ Connected to Upstash Redis Successfully");
  } catch (err) {
    console.error("❌ Redis Connection Failed:", err.message);
  }
})();

/**
 * UTILITY: Clear Specific Cache
 */
const clearCache = async (key) => {
  if (client.isOpen) await client.del(key);
};

/**
 * GET ALL PRODUCTS (with Search, Pagination & Redis Caching)
 */
const getProducts = async (req, res) => {
  try {
    let { page = 1, limit = 6, sort, search } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const cacheKey = `products:page:${page}:limit:${limit}:sort:${sort}:search:${search}`;

    // 1. Try fetching from Redis (Only if client is open)
    if (client.isOpen) {
      const cachedData = await client.get(cacheKey);
      if (cachedData) {
        console.log("Serving from Redis Cache");
        return res.json({ ...JSON.parse(cachedData), source: "cache" });
      }
    }

    // 2. Fetch from MongoDB
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

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalCount = await Product.countDocuments(query);
    const responseData = {
      success: true,
      products,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };

    // 3. Store in Redis
    if (client.isOpen) {
      await client.setEx(cacheKey, 600, JSON.stringify(responseData));
    }

    console.log("Serving from MongoDB Database");
    res.json({ ...responseData, source: "database" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * GET SINGLE PRODUCT BY ID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `product:${id}`;

    if (client.isOpen) {
      const cachedProduct = await client.get(cacheKey);
      if (cachedProduct) {
        return res.json({
          success: true,
          product: JSON.parse(cachedProduct),
          source: "cache",
        });
      }
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (client.isOpen) {
      await client.setEx(cacheKey, 3600, JSON.stringify(product));
    }

    res.json({ success: true, product, source: "database" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * UPDATE PRODUCT (Cache Invalidation)
 */
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (client.isOpen) {
      await client.del(`product:${req.params.id}`);
      const keys = await client.keys("products:page:*");
      if (keys.length > 0) await client.del(keys);
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

/**
 * DELETE PRODUCT
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.deleteOne();

    if (client.isOpen) {
      await client.del(`product:${req.params.id}`);
      const keys = await client.keys("products:page:*");
      if (keys.length > 0) await client.del(keys);
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

const addProducts = async (req, res) => {
  try {
    const products = await Product.insertMany(req.body);
    if (client.isOpen) {
      const keys = await client.keys("products:page:*");
      if (keys.length > 0) await client.del(keys);
    }
    res.status(201).json({ message: "Products added successfully", products });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding products", error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    if (client.isOpen) {
      const keys = await client.keys("products:page:*");
      if (keys.length > 0) await client.del(keys);
    }
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error creating product" });
  }
};

const allProductsToAdmin = async (req, res) => {
  const products = await Product.find({});
  res.json(products);
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
