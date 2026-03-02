const GuideCategory = require("../models/guideCategoryModel");
const Guide = require("../models/guideModel");
const { respond, respondObject } = require("../helpers/response");
const { parseActiveFlag } = require("../helpers/common");
const { mapGuide } = require("./guideController");

// GET /api/guide-categories?active=1
exports.getCategories = async (req, res) => {
	try {
		const categories = await GuideCategory.list({
			isActive: parseActiveFlag(req.query.active, true),
		});
		return respond(res, 200, "success", categories, "Guide categories");
	} catch (err) {
		console.error("getGuideCategories error:", err.message);
		return respond(res, 500, "Failed to fetch guide categories", []);
	}
};

// GET /api/guide-categories/:uuid/guides
exports.getGuidesByCategory = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const category = await GuideCategory.getByUuid(uuid);
		if (!category) return respondObject(res, 404, "Category not found", null);

		const guides = await Guide.list({
			isActive: parseActiveFlag(req.query.active, true),
			categoryUuid: uuid,
		});

		return respond(
			res,
			200,
			"success",
			guides.map(mapGuide),
			"Guides by category",
		);
	} catch (err) {
		console.error("getGuidesByCategory error:", err.message);
		return respond(res, 500, "Failed to fetch guides by category", []);
	}
};
