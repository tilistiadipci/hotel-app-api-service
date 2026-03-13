const Setting = require("../models/settingModel");
const Player = require("../models/playerModel");
const { respond } = require("../helpers/response");

// Expect `x-api-key` header containing a player token.
// Expect `x-player-license` header containing the player serial number.
// Middleware enforces:
// 1) Global toggle via settings (`api_key_status` = active)
// 2) Ensure the incoming token + serial exists in `players`
module.exports = async (req, res, next) => {
	try {
		if (req.allowAnonymous) return next();

		if (req.path.startsWith("/socket.io")) {
			return next();
		}

		// Check global API key toggle
		const activeSetting = await Setting.getByKey("api_key_status");
		if (!activeSetting || activeSetting.value !== "active") {
			return respond(res, 401, "API key inactive", []);
		}

		const apiKey = req.headers["x-api-key"];
		if (!apiKey) {
			return respond(res, 401, "Missing API key", []);
		}

		const playerLicense = req.headers["x-player-license"];
		if (!playerLicense) {
			return respond(res, 401, "Missing player license", []);
		}

		const player = await Player.getByTokenAndSerial(apiKey, playerLicense);
		if (!player) {
			return respond(res, 401, "player unregistered license", []);
		}

		req.apiKey = {
			key: apiKey,
			playerId: player.id,
			playerLicense,
		};
		req.player = player;
		next();
	} catch (err) {
		console.error("API key verification error:", err.message);
		return respond(res, 500, "API key verification failed", []);
	}
};
