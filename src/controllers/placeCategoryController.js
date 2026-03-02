const PlaceCategory = require("../models/placeCategoryModel");
const Place = require("../models/placeModel");
const { respond, respondObject } = require("../helpers/response");
const { parseActiveFlag } = require("../helpers/common");
const { mapPlace } = require("./placeController");

// GET /api/place-categories?active=1
exports.getCategories = async (req, res) => {
	try {
		const categories = await PlaceCategory.list({
			isActive: parseActiveFlag(req.query.active, true),
		});
		return respond(res, 200, "success", categories, "Place categories");
	} catch (err) {
		console.error("getPlaceCategories error:", err.message);
		return respond(res, 500, "Failed to fetch place categories", []);
	}
};

// GET /api/place-categories/:uuid/places
exports.getPlacesByCategory = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const category = await PlaceCategory.getByUuid(uuid);
		if (!category) return respondObject(res, 404, "Category not found", null);

		const places = await Place.list({
			isActive: parseActiveFlag(req.query.active, true),
			categoryUuid: uuid,
		});

		return respond(
			res,
			200,
			"success",
			places.map(mapPlace),
			"Places by category",
		);
	} catch (err) {
		console.error("getPlacesByCategory error:", err.message);
		return respond(res, 500, "Failed to fetch places by category", []);
	}
};
