const pool = require("../config/database");

const TABLE = "guide_items";
const CATEGORY_TABLE = "guide_categories";
const MEDIA_TABLE = "medias";

const baseSelect = `
	SELECT
		g.*,
		c.uuid AS category_uuid,
		c.name AS category_name,
		m.storage_path AS image_path
	FROM ${TABLE} g
	LEFT JOIN ${CATEGORY_TABLE} c ON c.id = g.category_id
	LEFT JOIN ${MEDIA_TABLE} m ON m.id = g.image_id
`;

const list = async ({ isActive = true, categoryUuid, q } = {}) => {
	const conditions = ["g.deleted_at IS NULL"];
	const params = [];

	if (typeof isActive === "boolean") {
		conditions.push("g.is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	if (categoryUuid) {
		conditions.push("c.uuid = ?");
		params.push(categoryUuid);
	}

	if (q) {
		const like = `%${q}%`;
		conditions.push("(g.title LIKE ? OR g.description LIKE ?)");
		params.push(like, like);
	}

	let sql = baseSelect;
	if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`;
	sql += " ORDER BY g.sort_order ASC, g.title ASC";

	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`
		${baseSelect}
		WHERE g.uuid = ? AND g.deleted_at IS NULL
		LIMIT 1
		`,
		[uuid],
	);
	return rows[0] || null;
};

module.exports = { list, getByUuid };
