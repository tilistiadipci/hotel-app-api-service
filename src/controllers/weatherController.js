const { respondObject } = require("../helpers/response");
const { getWeather } = require("../helpers/weather");

// adm4 jakarta barat = 31.71.01.1001
// GET /api/weather?adm4=31.71.01.1001
exports.getWeather = async (req, res) => {
	try {
		const result = await getWeather({
			adm4: req.query.adm4
		});
		return respondObject(res, 200, "success", result, "Weather");
	} catch (err) {
		console.error("getWeather error:", err.message);
		return respondObject(res, 500, "Failed to fetch weather", null);
	}
};
