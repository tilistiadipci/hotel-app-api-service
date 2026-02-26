const pool = require("../config/database");

const listActive = async () => {
	const [rows] = await pool.query(
		"SELECT * FROM players",
	);
	return rows;
};

const listNonDeleted = async () => {
	const [rows] = await pool.query(
		"SELECT * FROM players WHERE deleted_at IS NULL",
	);
	return rows;
};

module.exports = { listActive, listNonDeleted };
