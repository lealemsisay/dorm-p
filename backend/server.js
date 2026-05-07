const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Dormitory Backend Running");
});

// Import routes
const testRoutes = require('./routes/testRoutes');

// Use routes with /api prefix
app.use('/api', testRoutes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});