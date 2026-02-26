const Channel = require("../models/channelModel");
const { respond } = require("../helpers/response");

exports.getChannels = async (req, res) => {
	try {
		const rows = await Channel.listActive();
		return respond(res, 200, "success", rows, "Channel list");
	} catch (err) {
		return respond(res, 500, err.message, []);
	}
};

exports.getStream = async (req, res) => {
	try {
		const stream = await Channel.getActiveStreamByUuid(req.params.uuid);
		if (!stream) return respond(res, 404, "Channel not found", []);
		return respond(res, 200, "success", stream, "Channel stream");
	} catch (err) {
		return respond(res, 500, err.message, []);
	}
};
