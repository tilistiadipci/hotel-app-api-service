const Player = require("../models/playerModel");
const { respond, respondObject } = require("../helpers/response");
const { parseActiveFlag } = require("../helpers/common");

// Build reusable filters from query params
const buildFilters = (req) => {
	const rawActive = req.query.is_active ?? req.query.active;
	const isActive = rawActive === undefined ? undefined : parseActiveFlag(rawActive, true);
	const serial = req.query.serial || req.query.q || undefined;

	return { isActive, serial };
};

// GET /api/players?is_active=1&serial=ABC
exports.getPlayers = async (req, res) => {
	try {
		const filters = buildFilters(req);
		const players = await Player.list(filters);
		return respond(res, 200, "success", players, "Player list");
	} catch (err) {
		return respond(res, 500, err.message, []);
	}
};

// GET /api/players/:uuid
exports.getPlayerDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		const player = await Player.getByUuid(uuid);
		
		if (!player) return respondObject(res, 404, "Player not found", null);

		return respondObject(res, 200, "success", player, "Player detail");
	} catch (err) {
		return respondObject(res, 500, err.message, null);
	}
};
