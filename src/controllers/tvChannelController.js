const TvChannel = require("../models/tvChannelModel");
const { respond } = require("../helpers/response");

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

		const isActive =
			rawActive === undefined
				? true // default to active channels only
				: ["1", "true", "yes", "on"].includes(String(rawActive).toLowerCase())
					? true
					: ["0", "false", "no", "off"].includes(String(rawActive).toLowerCase())
						? false
						: true;

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
		if (!channel) return respond(res, 404, "Channel not found", []);

		return respond(res, 200, "success", channel, "TV channel detail");
	} catch (err) {
		console.error("getTvChannelDetail error:", err.message);
		return respond(res, 500, "Failed to fetch TV channel detail", []);
	}
};
