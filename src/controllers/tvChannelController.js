const TvChannel = require("../models/tvChannelModel");
const { respond, respondObject } = require("../helpers/response");
const { parseActiveFlag } = require("../helpers/common");

// GET /api/tvchannels?type=digital&region=national
exports.getTvChannels = async (req, res) => {
	try {
		const allowedTypes = ["digital", "streaming"];
		const allowedRegions = ["national", "international"];

		const rawType = req.query.type;
		const rawRegion = req.query.region;
		const rawActive = req.query.active;

		const type =
			rawType && allowedTypes.includes(String(rawType).toLowerCase())
				? String(rawType).toLowerCase()
				: undefined;

		const region =
			rawRegion && allowedRegions.includes(String(rawRegion).toLowerCase())
				? String(rawRegion).toLowerCase()
				: undefined;

		const isActive = parseActiveFlag(rawActive, true);

		const channels = await TvChannel.list({ type, region, isActive });
		return respond(res, 200, "success", channels, "TV channel list");
	} catch (err) {
		console.error("getTvChannels error:", err.message);
		return respond(res, 500, "Failed to fetch TV channels", []);
	}
};

// GET /api/tvchannels/:uuid
exports.getTvChannelDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respond(res, 400, "uuid is required", []);

		const channel = await TvChannel.getByUuid(uuid);
		if (!channel) return respondObject(res, 404, "Channel not found", null);

		return respondObject(res, 200, "success", channel, "TV channel detail");
	} catch (err) {
		console.error("getTvChannelDetail error:", err.message);
		return respondObject(res, 500, "Failed to fetch TV channel detail", null);
	}
};
