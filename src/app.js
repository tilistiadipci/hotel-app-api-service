require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const channelRoutes = require("./routes/channelRoutes");
const playerRoutes = require("./routes/playerRoutes");
const apiKeyAuth = require("./middlewares/authMiddleware");

const app = express();
app.use(cors());
app.use(express.json());

// Protect all endpoints with API key header
app.use(apiKeyAuth);

app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/players", playerRoutes);

app.listen(3000, () => {
	console.log("API running on port 3000");
});
