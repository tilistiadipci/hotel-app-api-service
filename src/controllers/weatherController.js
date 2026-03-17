const { respondObject } = require("../helpers/response");
const { getWeather } = require("../helpers/weather");

// GET /api/weather?lat=-3.8&lon=102.2666
exports.getWeather = async (req, res) => {
	try {
		const result = await getWeather({
			lat: req.query.lat ?? req.query.latitude,
			lon: req.query.lon ?? req.query.longitude,
		});
		return respondObject(res, 200, "success", result, "Weather");
	} catch (err) {
		console.error("getWeather error:", err.message);
		return respondObject(res, 500, "Failed to fetch weather", null);
	}
};
