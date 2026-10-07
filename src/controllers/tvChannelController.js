const TvChannel = require("../models/tvChannelModel");
const { respondPagination, respondObject } = require("../helpers/response");
const { buildStreamUrl, parseActiveFlag } = require("../helpers/common");

const parsePositiveInteger = (rawValue, defaultValue, maxValue) => {
	const parsed = Number.parseInt(rawValue, 10);
	if (!Number.isInteger(parsed) || parsed < 1) return defaultValue;
	return maxValue ? Math.min(parsed, maxValue) : parsed;
};

const mapChannel = (channel) => {
	const streamUrl = buildStreamUrl(channel.stream_url);

	return {
		...channel,
		stream_url: streamUrl,
		stream_urls: streamUrl ? [streamUrl] : [],
	};
};

// GET /api/tvchannels?type=digital&region=national&page=1&limit=20
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
		const page = parsePositiveInteger(req.query.page, 1);
		const limit = parsePositiveInteger(req.query.limit, 20, 100);
		const offset = (page - 1) * limit;

		const hotelId = req.hotelId || req.player?.hotel_id;
		const playerId = req.player?.id || req.apiKey?.playerId;
		const result = await TvChannel.list({
			type,
			region,
			isActive,
			hotelId,
			playerId,
			offset,
			limit,
		});
		return respondPagination(
			res,
			200,
			"success",
			result.items.map(mapChannel),
			{
				page,
				offset,
				limit,
				total: Number(result.total) || 0,
			},
			"TV channel list",
		);
	} catch (err) {
		console.error("getTvChannels error:", err.message);
		return respondObject(res, 500, "Failed to fetch TV channels", null);
	}
};

// GET /api/tvchannels/:uuid
exports.getTvChannelDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const channel = await TvChannel.getByUuid(
			uuid,
			req.hotelId || req.player?.hotel_id,
			req.player?.id || req.apiKey?.playerId,
		);
		if (!channel) return respondObject(res, 404, "Channel not found", null);

		return respondObject(res, 200, "success", mapChannel(channel), "TV channel detail");
	} catch (err) {
		console.error("getTvChannelDetail error:", err.message);
		return respondObject(res, 500, "Failed to fetch TV channel detail", null);
	}
};
