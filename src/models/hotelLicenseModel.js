const pool = require("../config/database");

const getActiveByHotelId = async (hotelId) => {
	const [rows] = await pool.execute(
		`SELECT
			hl.id,
			hl.hotel_id,
			hl.plan_code,
			hl.status,
			hl.starts_at,
			hl.expires_at,
			hl.grace_ends_at
		FROM hotel_licenses hl
		INNER JOIN hotels h
			ON h.id = hl.hotel_id
			AND h.is_active = 1
			AND h.status = 'active'
			AND h.deleted_at IS NULL
		WHERE hl.hotel_id = ?
			AND hl.status IN ('active', 'trial')
			AND (hl.starts_at IS NULL OR hl.starts_at <= NOW())
			AND (hl.expires_at IS NULL OR hl.expires_at > NOW())
		ORDER BY hl.starts_at DESC, hl.created_at DESC`,
		[hotelId],
	);

	return rows;
};

module.exports = { getActiveByHotelId };
