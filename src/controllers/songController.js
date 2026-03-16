const Song = require("../models/songModel");
const { respond, respondObject, respondPagination } = require("../helpers/response");
const { buildMediaUrl, parseActiveFlag } = require("../helpers/common");

const mapWithImage = (rows) =>
	rows.map((row) => ({
		...row,
		url_image: buildMediaUrl("image", row.image_path),
		storage_audio: buildMediaUrl("audio", row.audio_path),
	}));

const parsePaginationNumber = (rawValue, defaultValue) => {
	const parsed = Number.parseInt(rawValue, 10);
	if (Number.isNaN(parsed) || parsed < 0) return defaultValue;
	return parsed;
};

// GET /api/songs?active=1&q=love&page=1&limit=20
exports.getSongs = async (req, res) => {
	try {
		const isActive = parseActiveFlag(req.query.active, true);
		const page = parsePaginationNumber(req.query.page, 1) || 1;
		const limit = parsePaginationNumber(req.query.limit, 20) || 20;
		const offset = Math.max((page - 1) * limit, 0);

		const filters = {
			isActive,
			q: req.query.q || req.query.search || undefined,
			offset,
			limit,
		};

		const result = await Song.list(filters);
		return respondPagination(
			res,
			200,
			"success",
			mapWithImage(result.items),
			{
				page,
				offset,
				limit,
				total: Number(result.total) || 0,
			},
			"Song list",
		);
	} catch (err) {
		console.error("getSongs error:", err.message);
		return respondObject(res, 500, "Failed to fetch songs", null);
	}
};

// GET /api/songs/albums?album_name=...&active=1&page=1&limit=20
exports.getAlbumList = async (req, res) => {
	try {
		const isActive = parseActiveFlag(req.query.active, true);
		const page = parsePaginationNumber(req.query.page, 1) || 1;
		const limit = parsePaginationNumber(req.query.limit, 20) || 20;
		const offset = Math.max((page - 1) * limit, 0);

		const filters = {
			albumName: req.query.album_name,
			isActive,
			offset,
			limit,
		};

		const result = await Song.listAlbums(filters);

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
			"Song list grouped by album",
		);
	} catch (err) {
		console.error("getAlbumList error:", err.message);
		return respondObject(res, 500, "Failed to fetch songs grouped by album", null);
	}
};

// GET /api/songs/albums/:album_uuid?active=1&q=...&page=1&limit=20
exports.getSongsByAlbumUuid = async (req, res) => {
	try {
		const { album_uuid: albumUuid } = req.params;
		if (!albumUuid) return respond(res, 400, "album_uuid is required", []);

		const isActive = parseActiveFlag(req.query.active, true);
		const page = parsePaginationNumber(req.query.page, 1) || 1;
		const limit = parsePaginationNumber(req.query.limit, 20) || 20;
		const offset = Math.max((page - 1) * limit, 0);

		const result = await Song.listByAlbumUuid({
			albumUuid,
			isActive,
			q: req.query.q || req.query.search || undefined,
			offset,
			limit,
		});

		return respondPagination(
			res,
			200,
			"success",
			mapWithImage(result.items),
			{
				page,
				offset,
				limit,
				total: Number(result.total) || 0,
			},
			"Song list by album",
		);
	} catch (err) {
		console.error("getSongsByAlbumUuid error:", err.message);
		return respondObject(res, 500, "Failed to fetch songs by album", null);
	}
};

// GET /api/songs/:uuid
exports.getSongDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respond(res, 400, "uuid is required", []);

		const song = await Song.getByUuid(uuid);
		if (!song) return respondObject(res, 404, "Song not found", null);

		return respondObject(
			res,
			200,
			"success",
			mapWithImage([song])[0],
			"Song detail",
		);
	} catch (err) {
		console.error("getSongDetail error:", err.message);
		return respondObject(res, 500, "Failed to fetch song detail", null);
	}
};
