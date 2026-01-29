const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    image_url: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["Vegetable", "Fruit"],
      required: true,
    },

    pricePerKg: {
      type: Number,
      required: true,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
    },

    isSeasonal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Create Product model
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
