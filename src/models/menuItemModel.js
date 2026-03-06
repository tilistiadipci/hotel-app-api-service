const pool = require("../config/database");

const TABLE = "menu_items";
const CATEGORY_TABLE = "menu_categories";
const MEDIA_TABLE = "medias";

const baseSelect = `
	SELECT
		mi.*,
		mc.uuid AS category_uuid,
		mc.name AS category_name,
		m.storage_path AS image_path
	FROM ${TABLE} mi
	LEFT JOIN ${CATEGORY_TABLE} mc ON mc.id = mi.category_id
	LEFT JOIN ${MEDIA_TABLE} m ON m.id = mi.image_id
`;

const list = async ({ isAvailable, categoryId, q } = {}) => {
	const conditions = ["mi.deleted_at IS NULL"];
	const params = [];

	if (typeof isAvailable === "boolean") {
		conditions.push("mi.is_available = ?");
		params.push(isAvailable ? 1 : 0);
	}

	if (categoryId) {
		conditions.push("mi.category_id = ?");
		params.push(categoryId);
	}

	if (q) {
		const like = `%${q}%`;
		conditions.push("(mi.name LIKE ? OR mi.description LIKE ?)");
		params.push(like, like);
	}

	let sql = baseSelect;
	if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`;
	sql += " ORDER BY mi.sort_order ASC, mi.name ASC";

	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`
		${baseSelect}
		WHERE mi.uuid = ? AND mi.deleted_at IS NULL
		LIMIT 1
		`,
		[uuid],
	);
	return rows[0] || null;
};

module.exports = { list, getByUuid };
