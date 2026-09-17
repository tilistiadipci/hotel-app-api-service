const { respondObject } = require("../helpers/response");
const { getWeather } = require("../helpers/weather");
const Player = require("../models/playerModel");
const Hotel = require("../models/hotelModel");

// adm4 jakarta barat = 31.71.01.1001
// GET /api/weather?adm4=31.71.01.1001
exports.getWeather = async (req, res) => {
	try {
		let adm4 = req.query.adm4;

		if (!adm4) {
			const serial = req.headers["x-player-license"];
			const player = req.player || (serial ? await Player.getBySerial(serial) : null);
			const hotel = player ? await Hotel.getWeatherLocation(player.hotel_id) : null;
			adm4 = hotel?.adm4;
		}

		const result = await getWeather({
			adm4,
		});
		return respondObject(res, 200, "success", result, "Weather");
	} catch (err) {
		console.error("getWeather error:", err.message);
		return respondObject(res, 500, "Failed to fetch weather", null);
	}
};
