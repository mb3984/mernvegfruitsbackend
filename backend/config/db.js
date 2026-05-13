const mongoose = require("mongoose");
const dns = require("dns");

// 🚀 MASTER FIX: Force Node.js to use Google DNS
// Idi ISP (Internet) problems ni bypass chestundi
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4, // Force IPv4
    });

    console.log("✅ MongoDB Connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);

    // Troubleshooting hint for you
    if (error.message.includes("ECONNREFUSED")) {
      console.log(
        "Hint: Try restarting your Router or using a Mobile Hotspot.",
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;
