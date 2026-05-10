console.log("🚀 Server file is running...");
console.log("🔥 SERVER FILE:", __filename);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// ======================
// ROOT TEST ROUTE
// ======================
app.get("/", (req, res) => {
    res.send("Dormitory Backend Running");
});

// ======================
// CONNECT DATABASE FIRST
// ======================
(async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await connectDB();
        console.log("✅ MongoDB Connected Successfully");

        // ======================
        // ROUTES IMPORT
        // ======================
        const testRoutes = require("./routes/testRoutes");
        const studentRoutes = require("./routes/studentRoutes");
        const roomRoutes = require("./routes/roomRoutes");
        const blockRoutes = require("./routes/blockRoutes");
        const allocationRoutes = require("./routes/allocationRoutes");
        const importRoutes = require("./routes/importRoutes");
        const authRoutes = require("./routes/authRoutes");

        console.log("👉 Registering routes...");
        console.log("Auth routes loaded:", typeof authRoutes);

        // ======================
        // ROUTES USE
        // ======================
        app.use("/api/test", testRoutes);
        app.use("/api/auth", authRoutes);
        app.use("/api/students", studentRoutes);
        app.use("/api/rooms", roomRoutes);
        app.use("/api/blocks", blockRoutes);
        app.use("/api/allocations", allocationRoutes);
        app.use("/api/import", importRoutes);

        console.log("✅ Routes registered successfully");

        // ======================
        // 404 HANDLER
        // ======================
        app.use((req, res) => {
            res.status(404).json({
                success: false,
                message: "Route not found"
            });
        });

        // ======================
        // START SERVER
        // ======================
        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("❌ Server startup failed:", error);
        process.exit(1);
    }
})();