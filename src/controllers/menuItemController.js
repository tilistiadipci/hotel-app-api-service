const MenuItem = require("../models/menuItemModel");
const { respond, respondObject } = require("../helpers/response");
const { buildMediaUrl, parseActiveFlag } = require("../helpers/common");

const mapItem = (row) => ({
	...row,
	storage_image: buildMediaUrl("image", row.image_path),
	category: row.category_uuid ? { uuid: row.category_uuid, name: row.category_name } : null,
});

// GET /api/menu-items
exports.getMenuItems = async (req, res) => {
	try {
		const items = await MenuItem.list({
			isAvailable: parseActiveFlag(req.query.available, true),
			categoryUuid: req.query.category_uuid,
			q: req.query.q || req.query.search || req.query.name || undefined,
		});
		return respond(res, 200, "success", items.map(mapItem), "Menu items");
	} catch (err) {
		console.error("getMenuItems error:", err.message);
		return respond(res, 500, "Failed to fetch menu items", []);
	}
};

// GET /api/menu-items/:uuid
exports.getMenuItemDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const item = await MenuItem.getByUuid(uuid);
		if (!item) return respondObject(res, 404, "Menu item not found", null);

		return respondObject(res, 200, "success", mapItem(item), "Menu item detail");
	} catch (err) {
		console.error("getMenuItemDetail error:", err.message);
		return respondObject(res, 500, "Failed to fetch menu item detail", null);
	}
};

exports.mapMenuItem = mapItem;
