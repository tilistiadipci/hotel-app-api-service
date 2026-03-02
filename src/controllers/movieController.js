const Movie = require("../models/movieModel");
const { respond, respondObject } = require("../helpers/response");
const { buildMediaUrl, parseActiveFlag } = require("../helpers/common");

const parseCategories = (uuids, names) => {
	if (!uuids || !names) return [];
	const uuidArr = uuids.split(",");
	const nameArr = names.split(",");
	return uuidArr.map((u, idx) => ({ uuid: u, name: nameArr[idx] || null }));
};

const mapMovie = (row) => ({
	...row,
	storage_image: buildMediaUrl("image", row.image_path),
	storage_video: buildMediaUrl("video", row.video_path),
	categories: parseCategories(row.category_uuids, row.category_names),
});

// Export mapper for reuse
exports.mapMovie = mapMovie;

// GET /api/movies?active=1&category_uuid=...&q=title
exports.getMovies = async (req, res) => {
	try {
		const isActive = parseActiveFlag(req.query.active, true);

		const filters = {
			isActive,
			categoryUuid: req.query.category_uuid,
			q: req.query.q || req.query.title || undefined,
		};

		const movies = await Movie.list(filters);
		return respond(res, 200, "success", movies.map(mapMovie), "Movie list");
	} catch (err) {
		console.error("getMovies error:", err.message);
		return respond(res, 500, "Failed to fetch movies", []);
	}
};

// GET /api/movies/:uuid
exports.getMovieDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const movie = await Movie.getByUuid(uuid);
		if (!movie) return respondObject(res, 404, "Movie not found", null);

		return respondObject(res, 200, "success", mapMovie(movie), "Movie detail");
	} catch (err) {
		console.error("getMovieDetail error:", err.message);
		return respondObject(res, 500, "Failed to fetch movie detail", null);
	}
};
