const HotelLicense = require("../models/hotelLicenseModel");
const Player = require("../models/playerModel");
const { respond } = require("../helpers/response");

// Resolves the player from `req.player` (set by authMiddleware) or from the
// serial (`:serial` param or `x-player-license` header), then checks the
// database for an active hotel license tied to that player's hotel.
const verifyHotelLicense = async (req, res, next) => {
	try {
		let player = req.player;
		if (!player) {
			const serial = req.params.serial || req.headers["x-player-license"];
			if (!serial) {
				return respond(res, 401, "Player identity is required", []);
			}

			player = await Player.getBySerial(serial);
		}

		if (!player || !player.is_active || !player.hotel_id) {
			return respond(res, 401, "Player is not registered to an active hotel", []);
		}

		const licenses = await HotelLicense.getActiveByHotelId(player.hotel_id);
		if (!licenses.length) {
			return respond(res, 401, "Hotel does not have a license", []);
		}

		req.player = player;
		req.hotelId = player.hotel_id;
		req.hotelLicense = licenses[0];

		return next();
	} catch (err) {
		console.error("Hotel license verification error:", err.message);
		return respond(res, 500, "Hotel license verification failed", []);
	}
};

module.exports = verifyHotelLicense;
