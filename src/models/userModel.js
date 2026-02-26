const pool = require("../config/database");

const getByEmail = async (email) => {
	const [rows] = await pool.query(
		"SELECT * FROM users WHERE email = ? LIMIT 1",
		[email],
	);
	return rows[0] || null;
};

module.exports = { getByEmail };
