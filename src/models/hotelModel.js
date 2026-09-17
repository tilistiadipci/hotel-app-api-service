const pool = require("../config/database");

const getWeatherLocation = async (hotelId) => {
	if (!hotelId) return null;

	const [rows] = await pool.execute(
		`SELECT id, adm4
		 FROM hotels
		 WHERE id = ?
			AND deleted_at IS NULL
		 LIMIT 1`,
		[hotelId],
	);

	return rows[0] || null;
};

module.exports = { getWeatherLocation };
