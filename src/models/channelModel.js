const pool = require("../config/database");

const listActive = async () => {
	const [rows] = await pool.query(
		"SELECT * FROM channels WHERE is_active = 1",
	);
	return rows;
};

const getActiveStreamByUuid = async (uuid) => {
	const [rows] = await pool.query(
		"SELECT stream_url FROM channels WHERE uuid = ? AND is_active = 1",
		[uuid],
	);
	return rows[0] || null;
};

module.exports = { listActive, getActiveStreamByUuid };
