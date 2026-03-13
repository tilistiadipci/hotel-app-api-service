const Guide = require("../models/guideModel");
const { respond, respondObject } = require("../helpers/response");
const { buildMediaUrl, parseActiveFlag } = require("../helpers/common");

const mapGuide = (row) => ({
	...row,
	url_image: buildMediaUrl("image", row.image_path),
	category: row.category_uuid
		? { uuid: row.category_uuid, name: row.category_name }
		: null,
});

// GET /api/guides?active=1&category_uuid=...&q=...
exports.getGuides = async (req, res) => {
	try {
		const filters = {
			isActive: parseActiveFlag(req.query.active, true),
			categoryUuid: req.query.category_uuid,
			q: req.query.q || req.query.search || req.query.title || undefined,
		};

		const guides = await Guide.list(filters);
		return respond(res, 200, "success", guides.map(mapGuide), "Guide list");
	} catch (err) {
		console.error("getGuides error:", err.message);
		return respond(res, 500, "Failed to fetch guides", []);
	}
};

// GET /api/guides/:uuid
exports.getGuideDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const guide = await Guide.getByUuid(uuid);
		if (!guide) return respondObject(res, 404, "Guide not found", null);

		return respondObject(res, 200, "success", mapGuide(guide), "Guide detail");
	} catch (err) {
		console.error("getGuideDetail error:", err.message);
		return respondObject(res, 500, "Failed to fetch guide detail", null);
	}
};

exports.mapGuide = mapGuide;
