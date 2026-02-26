const Player = require("../models/playerModel");
const { respond } = require("../helpers/response");

exports.getPlayers = async (_req, res) => {
	try {
		const players = await Player.listNonDeleted();
		return respond(res, 200, "success", players, "Player list");
	} catch (err) {
		return respond(res, 500, err.message, []);
	}
};
