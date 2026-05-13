const Product = require("../models/productModel");
const redis = require("redis");

// 🚀 STABLE CLOUD REDIS SETUP
const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    // tls: true,
    rejectUnauthorized: false,
    keepAlive: 5000, // Connection ni active ga ఉంచుతుంది
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error("Redis Max Retries Reached");
      return Math.min(retries * 100, 3000); // Reconnect attempt faster ga chesthundi
    },
  },
  pingInterval: 1000, // Prathi second ki connection check chesthundhi
});

client.on("error", (err) => {
  // Socket closed errors ni ignore chesi simplified log isthundi
  if (err.message.includes("Socket closed")) {
    console.log("🔄 Redis reconnecting...");
  } else {
    console.log("Redis Client Error", err);
  }
});

// Connect to Redis
(async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log("✅ Connected to Upstash Redis Successfully");
    }
  } catch (err) {
    console.error("❌ Redis Connection Failed:", err.message);
  }
})();

/**
 * UTILITY: Clear Specific Cache
 */
const clearCache = async (key) => {
  if (client.isOpen) {
    try {
      await client.del(key);
    } catch (e) {
      console.error("Cache clear error", e);
    }
  }
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
      try {
        const cachedData = await client.get(cacheKey);
        if (cachedData) {
          console.log("Serving from Redis Cache ⚡");
          return res.json({ ...JSON.parse(cachedData), source: "cache" });
        }
      } catch (cacheErr) {
        console.log("Redis Get Error:", cacheErr.message);
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
      try {
        await client.setEx(cacheKey, 600, JSON.stringify(responseData));
      } catch (cacheSetErr) {
        console.log("Redis Set Error:", cacheSetErr.message);
      }
    }

    console.log("Serving from MongoDB Database 🗄️");
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
