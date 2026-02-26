const Setting = require("../models/settingModel");
const { respond } = require("../helpers/response");
const Secure = require("../helpers/secure.min");
const secure = new Secure();

// Expect `x-api-key` header containing plain token.
// Middleware enforces:
// 1) Global toggle via settings (`api_key_active` = active)
// 2) Decrypt stored setting (`api_key_value`) and compare to header token
module.exports = async (req, res, next) => {
	try {
		// Check global API key toggle and value from settings
		const activeSetting = await Setting.getByKey("api_key_status");
		if (!activeSetting || activeSetting.value !== "active") {
			return respond(res, 401, "API key inactive", []);
		}

		const valueSetting = await Setting.getByKey("api_key_value");
		if (!valueSetting || !valueSetting.value) {
			return respond(res, 401, "API key not configured", []);
		}

		const apiKey = req.headers["x-api-key"];
		if (!apiKey) {
			return respond(res, 401, "Missing API key", []);
		}

		let storedKey;
		try {
			storedKey = secure.decrypt(valueSetting.value);
		} catch (e) {
			return respond(res, 401, "Invalid stored API key format", []);
		}

		if (apiKey !== storedKey) {
			return respond(res, 401, "Invalid API key", []);
		}

		req.apiKey = { key: apiKey };
		next();
	} catch (err) {
		console.error("API key verification error:", err.message);
		return respond(res, 500, "API key verification failed", []);
	}
};
