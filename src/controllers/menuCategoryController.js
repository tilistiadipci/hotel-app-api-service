const MenuCategory = require("../models/menuCategoryModel");
const MenuItem = require("../models/menuItemModel");
const { respond, respondObject } = require("../helpers/response");
const { parseActiveFlag, buildMediaUrl } = require("../helpers/common");

const mapItem = (row) => ({
	...row,
	url_image: buildMediaUrl("image", row.image_path),
	category: row.category_uuid ? { uuid: row.category_uuid, name: row.category_name } : null,
});

// GET /api/menu-categories?active=1
exports.getCategories = async (req, res) => {
	try {
		const categories = await MenuCategory.list({
			isActive: parseActiveFlag(req.query.active, true),
		});
		return respond(res, 200, "success", categories, "Menu categories");
	} catch (err) {
		console.error("getMenuCategories error:", err.message);
		return respond(res, 500, "Failed to fetch menu categories", []);
	}
};

// GET /api/menu-categories/:uuid/items
exports.getItemsByCategory = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const category = await MenuCategory.getByUuid(uuid);
		if (!category) return respondObject(res, 404, "Category not found", null);

		const items = await MenuItem.list({
			isAvailable: parseActiveFlag(req.query.available, true),
			categoryUuid: uuid,
			q: req.query.q || req.query.search || req.query.name || undefined,
		});

		return respond(res, 200, "success", items.map(mapItem), "Menu items by category");
	} catch (err) {
		console.error("getItemsByCategory error:", err.message);
		return respond(res, 500, "Failed to fetch menu items by category", []);
	}
};
