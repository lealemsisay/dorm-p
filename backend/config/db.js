const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("🔄 Connecting to MongoDB...");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ DB Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;