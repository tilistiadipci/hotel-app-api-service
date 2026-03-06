const pool = require("../config/database");

const TABLE = "players";

// List players with optional filters
// Filters: isActive (boolean), serial (string), includeDeleted (boolean)
const list = async ({ isActive, serial, includeDeleted = false } = {}) => {
	const conditions = [];
	const params = [];

	if (!includeDeleted) {
		conditions.push("deleted_at IS NULL");
	}

	if (typeof isActive === "boolean") {
		conditions.push("is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	if (serial) {
		conditions.push("serial LIKE ?");
		params.push(`%${serial}%`);
	}

	const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
	const sql = `SELECT * FROM ${TABLE} ${where} ORDER BY id DESC`;
	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getBySerial = async (serial) => {
	const [rows] = await pool.execute(
		`SELECT * FROM ${TABLE} WHERE serial = ? AND deleted_at IS NULL LIMIT 1`,
		[serial],
	);
	return rows[0] || null;
};

const getByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`SELECT * FROM ${TABLE} WHERE uuid = ? AND deleted_at IS NULL LIMIT 1`,
		[uuid],
	);
	return rows[0] || null;
};

module.exports = { list, getBySerial, getByUuid };
