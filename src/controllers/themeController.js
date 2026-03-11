const Theme = require("../models/themeModel");
const { respond, respondObject } = require("../helpers/response");
const { buildMediaUrl } = require("../helpers/common");

const mapTheme = (row) => ({
	...row,
	image_url: buildMediaUrl("image", row.image_path),
});

exports.getThemes = async (req, res) => {
	try {
		const themes = await Theme.list();
		return respond(
			res,
			200,
			"success",
			themes.map((theme) => mapTheme(theme)),
			"Theme list",
		);
	} catch (err) {
		console.error("getThemes error:", err.message);
		return respond(res, 500, "Failed to fetch themes", []);
	}
};

exports.getThemeDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const rows = await Theme.getDetailByUuid(uuid);
		if (!rows.length) {
			return respondObject(res, 404, "Theme not found", null);
		}

		const [firstRow] = rows;
		const details = rows
			.filter((row) => row.detail_id)
			.map((row) => ({
				id: row.detail_id,
				uuid: row.detail_uuid,
				key: row.detail_key,
				value: row.detail_value,
				created_at: row.detail_created_at,
				updated_at: row.detail_updated_at,
			}));

		const payload = {
			id: firstRow.id,
			uuid: firstRow.uuid,
			name: firstRow.name,
			description: firstRow.description,
			is_default: firstRow.is_default,
			image_id: firstRow.image_id,
			image_url: buildMediaUrl("image", firstRow.image_path),
			created_at: firstRow.created_at,
			updated_at: firstRow.updated_at,
			deleted_at: firstRow.deleted_at,
			created_by: firstRow.created_by,
			updated_by: firstRow.updated_by,
			deleted_by: firstRow.deleted_by,
			details,
		};

		return respondObject(res, 200, "success", payload, "Theme detail");
	} catch (err) {
		console.error("getThemeDetail error:", err.message);
		return respondObject(res, 500, "Failed to fetch theme detail", null);
	}
};
