const bcrypt = require("bcrypt");
const pool = require("../config/database");

const getActiveByHotelId = async (hotelId) => {
	const [rows] = await pool.execute(
		`SELECT
			hl.id,
			hl.hotel_id,
			hl.license_key_hash,
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
			AND hl.license_key_hash IS NOT NULL
			AND (hl.starts_at IS NULL OR hl.starts_at <= NOW())
			AND (hl.expires_at IS NULL OR hl.expires_at > NOW())
		ORDER BY hl.starts_at DESC, hl.created_at DESC`,
		[hotelId],
	);

	return rows;
};

const verify = async (hotelId, licenseKey) => {
	if (!hotelId || !licenseKey) return null;

	const licenses = await getActiveByHotelId(hotelId);

	for (const license of licenses) {
		// Laravel/PHP emits the compatible $2y$ bcrypt prefix while node-bcrypt
		// expects $2b$. Only the version marker differs.
		const compatibleHash = license.license_key_hash.replace(/^\$2y\$/, "$2b$");
		if (await bcrypt.compare(licenseKey, compatibleHash)) {
			const { license_key_hash, ...safeLicense } = license;
			return safeLicense;
		}
	}

	return null;
};

module.exports = { getActiveByHotelId, verify };
