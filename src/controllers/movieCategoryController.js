const MovieCategory = require("../models/movieCategoryModel");
const Movie = require("../models/movieModel");
const { respondObject, respondPagination } = require("../helpers/response");

// GET /api/movie-categories?page=1&limit=20
exports.getCategories = async (req, res) => {
	try {
		const page = Number.parseInt(req.query.page, 10) || 1;
		const limit = Number.parseInt(req.query.limit, 10) || 20;
		const offset = Math.max((page - 1) * limit, 0);

		const result = await MovieCategory.list({ offset, limit });
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
			"Movie categories",
		);
	} catch (err) {
		console.error("getCategories error:", err.message);
		return respondObject(res, 500, "Failed to fetch categories", null);
	}
};

// GET /api/movie-categories/:uuid/movies?page=1&limit=20
exports.getMoviesByCategory = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const category = await MovieCategory.getByUuid(uuid);
		if (!category) return respondObject(res, 404, "Category not found", null);

		const page = Number.parseInt(req.query.page, 10) || 1;
		const limit = Number.parseInt(req.query.limit, 10) || 20;
		const offset = Math.max((page - 1) * limit, 0);

		const result = await Movie.list({ categoryUuid: uuid, offset, limit });
		return respondPagination(
			res,
			200,
			"success",
			result.items.map(require("./movieController").mapMovie),
			{
				page,
				offset,
				limit,
				total: Number(result.total) || 0,
			},
			"Movies by category",
		);
	} catch (err) {
		console.error("getMoviesByCategory error:", err.message);
		return respondObject(res, 500, "Failed to fetch movies by category", null);
	}
};
