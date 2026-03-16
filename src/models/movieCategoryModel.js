const pool = require("../config/database");

const TABLE = "movies_categories";

const list = async ({ offset = 0, limit = 20 } = {}) => {
	const conditions = ["deleted_at IS NULL"];
	const params = [];

	let sql = `SELECT * FROM ${TABLE}`;
	if (conditions.length) {
		sql += ` WHERE ${conditions.join(" AND ")}`;
	}
	const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;
	const safeOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
	sql += ` ORDER BY sort_order ASC, name ASC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

	const [rows] = await pool.execute(sql, params);
	const [countRows] = await pool.execute(
		`
		SELECT COUNT(*) AS total
		FROM ${TABLE}
		${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
		`,
		params,
	);

	return {
		items: rows,
		total: countRows[0]?.total || 0,
	};
};

const getByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`SELECT * FROM ${TABLE} WHERE uuid = ? AND deleted_at IS NULL LIMIT 1`,
		[uuid],
	);
	return rows[0] || null;
};

module.exports = { list, getByUuid };
