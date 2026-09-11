const HotelLicense = require("../models/hotelLicenseModel");
const Player = require("../models/playerModel");
const { respond } = require("../helpers/response");

const getHeaderValue = (req) => {
	const value = req.headers["x-hotel-license"];
	return Array.isArray(value) ? value[0] : value;
};

const verifyHotelLicense = async (req, res, next) => {
	try {
		const hotelLicense = getHeaderValue(req);
		if (!hotelLicense) {
			return respond(res, 401, "Missing X-Hotel-License header", []);
		}

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

		const license = await HotelLicense.verify(player.hotel_id, hotelLicense);
		if (!license) {
			return respond(res, 403, "Invalid or inactive hotel license", []);
		}

		req.player = player;
		req.hotelId = player.hotel_id;
		req.hotelLicense = license;

		return next();
	} catch (err) {
		console.error("Hotel license verification error:", err.message);
		return respond(res, 500, "Hotel license verification failed", []);
	}
};

module.exports = verifyHotelLicense;
