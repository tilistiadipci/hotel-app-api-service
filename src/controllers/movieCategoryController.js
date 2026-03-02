const MovieCategory = require("../models/movieCategoryModel");
const Movie = require("../models/movieModel");
const { respond, respondObject } = require("../helpers/response");
const { parseActiveFlag } = require("../helpers/common");

// GET /api/movie-categories?active=1
exports.getCategories = async (req, res) => {
	try {
		const isActive = parseActiveFlag(req.query.active, true);
		const categories = await MovieCategory.list({ isActive });
		return respond(res, 200, "success", categories, "Movie categories");
	} catch (err) {
		console.error("getCategories error:", err.message);
		return respond(res, 500, "Failed to fetch categories", []);
	}
};

// GET /api/movie-categories/:uuid/movies
exports.getMoviesByCategory = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const category = await MovieCategory.getByUuid(uuid);
		if (!category) return respondObject(res, 404, "Category not found", null);

		const isActive = parseActiveFlag(req.query.active, true);
		const movies = await Movie.list({ isActive, categoryUuid: uuid });
		return respond(
			res,
			200,
			"success",
			movies.map(require("./movieController").mapMovie),
			"Movies by category",
		);
	} catch (err) {
		console.error("getMoviesByCategory error:", err.message);
		return respond(res, 500, "Failed to fetch movies by category", []);
	}
};
