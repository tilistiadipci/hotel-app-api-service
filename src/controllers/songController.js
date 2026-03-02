const Song = require("../models/songModel");
const { respond, respondObject } = require("../helpers/response");

const buildImageUrl = (path) =>
	path ? `/api/media?type=image&path=${encodeURIComponent(path)}` : null;
const buildAudioUrl = (path) =>
	path ? `/api/media?type=audio&path=${encodeURIComponent(path)}` : null;

const mapWithImage = (rows) =>
	rows.map((row) => ({
		...row,
		storage_image: buildImageUrl(row.image_path),
		storage_audio: buildAudioUrl(row.audio_path),
	}));

// GET /api/songs?artist_uuid=...&album_uuid=...&active=1&q=love
exports.getSongs = async (req, res) => {
	try {
		const rawActive = req.query.active;
		const isActive =
			rawActive === undefined
				? true
				: ["1", "true", "yes", "on"].includes(String(rawActive).toLowerCase())
					? true
					: ["0", "false", "no", "off"].includes(String(rawActive).toLowerCase())
						? false
						: true;

		const filters = {
			artistUuid: req.query.artist_uuid,
			albumUuid: req.query.album_uuid,
			isActive,
			q: req.query.q || req.query.search || undefined,
		};

		const songs = await Song.list(filters);
		return respond(res, 200, "success", mapWithImage(songs), "Song list");
	} catch (err) {
		console.error("getSongs error:", err.message);
		return respond(res, 500, "Failed to fetch songs", []);
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
