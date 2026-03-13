require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const socket = require("./helpers/socket");

const app = express();
const server = http.createServer(app); // ✔ setelah app dibuat

const authRoutes = require("./routes/authRoutes");
const channelRoutes = require("./routes/channelRoutes");
const playerRoutes = require("./routes/playerRoutes");
const themeRoutes = require("./routes/themeRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const tvChannelRoutes = require("./routes/tvChannelRoutes");
const songRoutes = require("./routes/songRoutes");
const movieRoutes = require("./routes/movieRoutes");
const movieCategoryRoutes = require("./routes/movieCategoryRoutes");
const guideRoutes = require("./routes/guideRoutes");
const guideCategoryRoutes = require("./routes/guideCategoryRoutes");
const placeRoutes = require("./routes/placeRoutes");
const placeCategoryRoutes = require("./routes/placeCategoryRoutes");
const menuCategoryRoutes = require("./routes/menuCategoryRoutes");
const menuItemRoutes = require("./routes/menuItemRoutes");
const menuTransactionRoutes = require("./routes/menuTransactionRoutes");
const apiKeyAuth = require("./middlewares/authMiddleware");
const allowAnonymous = require("./middlewares/allowAnonymous");

app.use(cors());
app.use(express.json());

// Media routes now handle auth per-route (see mediaRoutes)
app.use("/api/media", mediaRoutes);

// Allow anonymous access for place QR before global apiKeyAuth
app.use("/api/places/:uuid/qr", allowAnonymous);
app.use("/api/players/:serial", allowAnonymous);
app.use("/api/menu-transactions/notifications/midtrans", allowAnonymous);
app.use("/api/menu-transactions/payment-finish", allowAnonymous);
app.use("/api/menu-transactions/:uuid/payment-page", allowAnonymous);
app.use("/api/menu-transactions/:uuid/payment-finish", allowAnonymous);

// Other routes: protected
app.use(apiKeyAuth);
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/themes", themeRoutes);
app.use("/api/tvchannels", tvChannelRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/movie-categories", movieCategoryRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/guide-categories", guideCategoryRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/place-categories", placeCategoryRoutes);
app.use("/api/menu-categories", menuCategoryRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/menu-transactions", menuTransactionRoutes);

socket.init(server);

server.listen(process.env.PORT || 3000, () => {
	console.log("API running on port " + (process.env.PORT || 3000));
});

console.log("QR PROXY ENV:", {
	MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION,
	serverKeyPrefix: (process.env.MIDTRANS_SERVER_KEY || "").slice(0, 15),
});
