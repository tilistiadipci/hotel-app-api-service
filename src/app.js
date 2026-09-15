require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const axios = require("axios");
const fs = require("fs/promises");
const path = require("path");
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
const songPlaylistRoutes = require("./routes/songPlaylistRoutes");
const movieRoutes = require("./routes/movieRoutes");
const movieCategoryRoutes = require("./routes/movieCategoryRoutes");
const guideRoutes = require("./routes/guideRoutes");
const guideCategoryRoutes = require("./routes/guideCategoryRoutes");
const placeRoutes = require("./routes/placeRoutes");
const placeCategoryRoutes = require("./routes/placeCategoryRoutes");
const menuCategoryRoutes = require("./routes/menuCategoryRoutes");
const menuItemRoutes = require("./routes/menuItemRoutes");
const menuTransactionRoutes = require("./routes/menuTransactionRoutes");
const websocketRoutes = require("./routes/websocketRoutes");
const runningTextRoutes = require("./routes/runningTextRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const apiKeyAuth = require("./middlewares/authMiddleware");
const allowAnonymous = require("./middlewares/allowAnonymous");
const hotelLicenseAuth = require("./middlewares/hotelLicenseMiddleware");

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
	res.status(404).type("text/plain").send("API not found");
});
// app.get("/playlist", async (req, res) => {
// 	try {
// 		const response = await axios.get("https://bestplay.my.id/may7152", {
// 			headers: {
// 				"User-Agent": req.get("user-agent") || "OTT Navigator/1.7.0.2.4 (Linux;Android 16; en; 73b005)",
// 				Accept: req.get("accept") || "*/*",
// 			},
// 			responseType: "arraybuffer",
// 			timeout: 30000,
// 			maxRedirects: 5,
// 			validateStatus: () => true,
// 		});

// 		if (response.headers["content-type"]) {
// 			res.set("Content-Type", response.headers["content-type"]);
// 		}

// 		const responseBody = Buffer.from(response.data);
// 		const resultFile = path.resolve(__dirname, "../results.txt");

// 		await fs.writeFile(resultFile, responseBody);

// 		return res.status(response.status).send(responseBody);
// 	} catch (error) {
// 		const isTimeout = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";

// 		console.error("BestPlay proxy error:", error.message);
// 		return res.status(isTimeout ? 504 : 502).json({
// 			message: isTimeout ? "BestPlay request timed out" : "Failed to fetch BestPlay response",
// 		});
// 	}
// });


// Media routes now handle auth per-route (see mediaRoutes)
app.use("/api/media", mediaRoutes);

// Allow anonymous access for place QR before global apiKeyAuth
app.use("/api/places/:uuid/qr", allowAnonymous);
app.use("/api/players/:serial", allowAnonymous, hotelLicenseAuth);
app.use("/api/menu-transactions/notifications/midtrans", allowAnonymous);
app.use("/api/menu-transactions/payment-finish", allowAnonymous);
app.use("/api/menu-transactions/:uuid/payment-page", allowAnonymous);
app.use("/api/menu-transactions/:uuid/payment-finish", allowAnonymous);
app.use("/api/weather", allowAnonymous);

// Other API routes: protected
app.use("/api", apiKeyAuth);
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/themes", themeRoutes);
app.use("/api/tvchannels", tvChannelRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/song-playlists", songPlaylistRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/movie-categories", movieCategoryRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/guide-categories", guideCategoryRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/place-categories", placeCategoryRoutes);
app.use("/api/menu-categories", menuCategoryRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/menu-transactions", menuTransactionRoutes);
app.use("/api/websocket", websocketRoutes);
app.use("/api/running-texts", runningTextRoutes);
app.use("/api/weather", weatherRoutes);

socket.init(server);

server.listen(process.env.PORT || 3000, () => {
	console.log("API running on port " + (process.env.PORT || 3000));
});

console.log("QR PROXY ENV:", {
	MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION,
	serverKeyPrefix: (process.env.MIDTRANS_SERVER_KEY || "").slice(0, 15),
});
