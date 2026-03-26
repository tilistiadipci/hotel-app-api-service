const SongPlaylist = require("../models/songPlaylistModel");
const { respondObject, respondPagination } = require("../helpers/response");
const { parseActiveFlag } = require("../helpers/common");

const parsePaginationNumber = (rawValue, defaultValue) => {
	const parsed = Number.parseInt(rawValue, 10);
	if (Number.isNaN(parsed) || parsed < 0) return defaultValue;
	return parsed;
};

// GET /api/song-playlists?active=1&is_favorit=1&q=chill&page=1&limit=20
exports.getSongPlaylists = async (req, res) => {
	try {
		const isActive = parseActiveFlag(req.query.active, true);
		const isFavorit =
			req.query.is_favorit === undefined
				? undefined
				: parseActiveFlag(req.query.is_favorit, false);
		const page = parsePaginationNumber(req.query.page, 1) || 1;
		const limit = parsePaginationNumber(req.query.limit, 20) || 20;
		const offset = Math.max((page - 1) * limit, 0);

		const result = await SongPlaylist.list({
			isActive,
			isFavorit,
			q: req.query.q || req.query.search || undefined,
			offset,
			limit,
		});

		return respondPagination(
			res,
			200,
			"success",
			result.items,
			{
				page,
				offset,
				limit,
				total: Number(result.total) || 0,
			},
			"Song playlist list",
		);
	} catch (err) {
		console.error("getSongPlaylists error:", err.message);
		return respondObject(res, 500, "Failed to fetch song playlists", null);
	}
};

// GET /api/song-playlists/:uuid
exports.getSongPlaylistDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const playlist = await SongPlaylist.getByUuid(uuid);
		if (!playlist) {
			return respondObject(res, 404, "Song playlist not found", null);
		}

		return respondObject(
			res,
			200,
			"success",
			playlist,
			"Song playlist detail",
		);
	} catch (err) {
		console.error("getSongPlaylistDetail error:", err.message);
		return respondObject(res, 500, "Failed to fetch song playlist detail", null);
	}
};
