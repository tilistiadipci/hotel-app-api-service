const Setting = require("../models/settingModel");
const Player = require("../models/playerModel");
const { respond } = require("../helpers/response");
const verifyHotelLicense = require("./hotelLicenseMiddleware");

// Expect `x-api-key` header containing a player token.
// Expect `x-player-license` header containing the player serial number
// (globally unique across all hotels — see `players.serial` unique constraint).
// Middleware enforces:
// 1) Global toggle via settings (`api_key_status` = active)
// 2) Ensure the incoming token + serial exists in `players`
// 3) Ensure the player's hotel has an active license in `hotel_licenses` (see hotelLicenseMiddleware)
module.exports = async (req, res, next) => {
	try {
		if (req.allowAnonymous) return next();

		if (req.path.startsWith("/socket.io")) {
			return next();
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

		const activeSetting = await Setting.getByKey("api_key_status", player.hotel_id);
		if (!activeSetting || activeSetting.value !== "active") {
			return respond(res, 401, "API key inactive", []);
		}

		// TODO: player not checkin can't use API

		req.apiKey = {
			key: apiKey,
			playerId: player.id,
			playerLicense,
		};
		req.player = player;
		return verifyHotelLicense(req, res, next);
	} catch (err) {
		console.error("API key verification error:", err.message);
		return respond(res, 500, "API key verification failed", []);
	}
};
