const pool = require("../config/database");
const tableName = "tv_channels";

// List TV channels with optional filters (type, region, isActive)
const list = async ({ type, region, isActive = true } = {}) => {
	const conditions = [];
	const params = [];

	if (type) {
		conditions.push("type = ?");
		params.push(type);
	}

	if (region) {
		conditions.push("region = ?");
		params.push(region);
	}

	if (typeof isActive === "boolean") {
		conditions.push("is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	let sql = `SELECT * FROM ${tableName} WHERE deleted_at IS NULL`;
	if (conditions.length) {
		sql += ` AND ${conditions.join(" AND ")}`;
	}
	sql += " ORDER BY sort_order ASC, name ASC";

	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`SELECT * FROM ${tableName} WHERE uuid = ? AND deleted_at IS NULL LIMIT 1`,
		[uuid],
	);
	return rows[0] || null;
};

module.exports = { list, getByUuid };
