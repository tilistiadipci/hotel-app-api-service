require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const channelRoutes = require("./routes/channelRoutes");
const playerRoutes = require("./routes/playerRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const tvChannelRoutes = require("./routes/tvChannelRoutes");
const songRoutes = require("./routes/songRoutes");
const movieRoutes = require("./routes/movieRoutes");
const movieCategoryRoutes = require("./routes/movieCategoryRoutes");
const apiKeyAuth = require("./middlewares/authMiddleware");
const allowAnonymous = require("./middlewares/allowAnonymous");

const app = express();
app.use(cors());
app.use(express.json());

// Media routes now handle auth per-route (see mediaRoutes)
app.use("/api/media", mediaRoutes);

// Other routes: protected
app.use(apiKeyAuth);
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/tvchannels", tvChannelRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/movie-categories", movieCategoryRoutes);

app.listen(3000, () => {
	console.log("API running on port 3000");
});
