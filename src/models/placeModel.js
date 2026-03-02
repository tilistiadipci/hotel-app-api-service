const pool = require("../config/database");

const TABLE = "places";
const CATEGORY_TABLE = "places_categories";
const MEDIA_TABLE = "medias";

const baseSelect = `
	SELECT
		p.*,
		c.uuid AS category_uuid,
		c.name AS category_name,
		m.storage_path AS image_path
	FROM ${TABLE} p
	LEFT JOIN ${CATEGORY_TABLE} c ON c.id = p.category_id
	LEFT JOIN ${MEDIA_TABLE} m ON m.id = p.image_id
`;

const list = async ({ isActive = true, categoryUuid, q } = {}) => {
	const conditions = ["p.deleted_at IS NULL"];
	const params = [];

	if (typeof isActive === "boolean") {
		conditions.push("p.is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	if (categoryUuid) {
		conditions.push("c.uuid = ?");
		params.push(categoryUuid);
	}

	if (q) {
		const like = `%${q}%`;
		conditions.push("(p.name LIKE ? OR p.description LIKE ?)");
		params.push(like, like);
	}

	let sql = baseSelect;
	if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`;
	sql += " ORDER BY p.name ASC";

	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`
		${baseSelect}
		WHERE p.uuid = ? AND p.deleted_at IS NULL
		LIMIT 1
		`,
		[uuid],
	);
	return rows[0] || null;
};

module.exports = { list, getByUuid };
