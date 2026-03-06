const pool = require("../config/database");

const TABLE = "menu_categories";

const list = async ({ isActive = true } = {}) => {
	const conditions = ["deleted_at IS NULL"];
	const params = [];

	if (typeof isActive === "boolean") {
		conditions.push("is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	let sql = `SELECT * FROM ${TABLE}`;
	if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`;
	sql += " ORDER BY sort_order ASC, name ASC";

	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`SELECT * FROM ${TABLE} WHERE uuid = ? AND deleted_at IS NULL LIMIT 1`,
		[uuid],
	);
	return rows[0] || null;
};

module.exports = { list, getByUuid };
