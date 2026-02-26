const pool = require("../config/database");

const getByKey = async (key) => {
	const [rows] = await pool.query(
		"SELECT * FROM settings WHERE `key` = ? AND deleted_at IS NULL LIMIT 1",
		[key],
	);
	return rows[0] || null;
};

module.exports = { getByKey };
