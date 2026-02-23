require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const channelRoutes = require("./routes/channelRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);

app.listen(3000, () => {
	console.log("API running on port 3000");
});