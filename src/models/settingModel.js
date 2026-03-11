const pool = require("../config/database");

const getByKey = async (key) => {
	const [rows] = await pool.query(
		"SELECT * FROM settings WHERE `key` = ? AND deleted_at IS NULL LIMIT 1",
		[key],
	);
	return rows[0] || null;
};

const getByKeys = async (keys = []) => {
	if (!Array.isArray(keys) || keys.length === 0) return [];

	const [rows] = await pool.query(
		"SELECT * FROM settings WHERE `key` IN (?) AND deleted_at IS NULL",
		[keys],
	);
	return rows || [];
};

module.exports = { getByKey, getByKeys };
