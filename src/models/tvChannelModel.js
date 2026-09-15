const pool = require("../config/database");

const SELECT_FIELDS = `
	tv.id,
	tv.uuid,
	COALESCE(htc.custom_name, tv.name) AS name,
	tv.slug,
	tv.image_id,
	tv.type,
	tv.region,
	tv.stream_url,
	tv.frequency,
	tv.quality,
	htc.sort_order AS sort_order,
	htc.is_active AS is_active,
	tv.created_by,
	tv.updated_by,
	tv.deleted_by,
	tv.created_at,
	tv.updated_at,
	tv.deleted_at,
	htc.hotel_id AS hotel_id
`;

const list = async ({ type, region, isActive = true, hotelId } = {}) => {
	if (!hotelId) return [];

	const conditions = ["htc.hotel_id = ?", "tv.deleted_at IS NULL"];
	const params = [hotelId];

	if (type) {
		conditions.push("tv.type = ?");
		params.push(type);
	}
	if (region) {
		conditions.push("tv.region = ?");
		params.push(region);
	}
	if (typeof isActive === "boolean") {
		conditions.push("htc.is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	const sql = `
		SELECT ${SELECT_FIELDS}
		FROM tv_channels tv
		INNER JOIN hotel_tv_channel htc ON htc.tv_channel_id = tv.id
		WHERE ${conditions.join(" AND ")}
		ORDER BY htc.sort_order ASC, COALESCE(htc.custom_name, tv.name) ASC
	`;
	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getByUuid = async (uuid, hotelId) => {
	if (!hotelId) return null;

	const [rows] = await pool.execute(
		`SELECT ${SELECT_FIELDS}
		 FROM tv_channels tv
		 INNER JOIN hotel_tv_channel htc ON htc.tv_channel_id = tv.id
		 WHERE tv.uuid = ? AND htc.hotel_id = ? AND tv.deleted_at IS NULL
		 LIMIT 1`,
		[uuid, hotelId],
	);
	return rows[0] || null;
};

module.exports = { list, getByUuid };
