const pool = require("../config/database");

const TABLE = "hotel_configurations";

const getByHotelId = async (hotelId) => {
	const [rows] = await pool.execute(
		`SELECT hotel_id, media_disk, media_root
		FROM ${TABLE}
		WHERE hotel_id = ?
		LIMIT 1`,
		[hotelId],
	);

	return rows[0] || null;
};

const getByHotelCode = async (hotelCode) => {
	const [rows] = await pool.execute(
		`SELECT hc.hotel_id, hc.media_disk, hc.media_root
		FROM ${TABLE} hc
		INNER JOIN hotels h ON h.id = hc.hotel_id
		WHERE h.code = ?
			AND h.deleted_at IS NULL
			AND h.is_active = 1
		LIMIT 1`,
		[String(hotelCode).trim().toUpperCase()],
	);

	return rows[0] || null;
};

module.exports = { getByHotelCode, getByHotelId };
