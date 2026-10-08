const pool = require("../config/database");

const SELECT_FIELDS = `
	tv.id,
	tv.uuid,
	COALESCE(htc.custom_name, tv.name) AS name,
	tv.slug,
	COALESCE(htc.custom_image_id, tv.image_id) AS image_id,
	image.storage_path AS image_path,
	COALESCE(htc.custom_type, tv.type) AS type,
	COALESCE(htc.custom_region, tv.region) AS region,
	COALESCE(htc.custom_stream_url, tv.stream_url) AS stream_url,
	COALESCE(htc.custom_frequency, tv.frequency) AS frequency,
	COALESCE(htc.custom_quality, tv.quality) AS quality,
	CASE
		WHEN p.use_custom_channels = 1 THEN ptc.sort_order
		ELSE htc.sort_order
	END AS sort_order,
	CASE
		WHEN p.use_custom_channels = 1 THEN ptc.is_active
		ELSE htc.is_active
	END AS is_active,
	CASE WHEN ptc.id IS NULL THEN 0 ELSE 1 END AS is_player_assigned,
	p.use_custom_channels,
	tv.created_by,
	tv.updated_by,
	tv.deleted_by,
	tv.created_at,
	tv.updated_at,
	tv.deleted_at,
	htc.hotel_id AS hotel_id
`;

const buildListConditions = ({ type, region, isActive, hotelId, playerId }) => {
	const conditions = [
		"htc.hotel_id = ?",
		"p.id = ?",
		"p.hotel_id = htc.hotel_id",
		"p.deleted_at IS NULL",
		"tv.deleted_at IS NULL",
		"(p.use_custom_channels = 0 OR ptc.id IS NOT NULL)",
	];
	const params = [hotelId, playerId];

	if (type) {
		conditions.push("COALESCE(htc.custom_type, tv.type) = ?");
		params.push(type);
	}
	if (region) {
		conditions.push("COALESCE(htc.custom_region, tv.region) = ?");
		params.push(region);
	}
	if (typeof isActive === "boolean") {
		conditions.push(`CASE
			WHEN p.use_custom_channels = 1 THEN ptc.is_active
			ELSE htc.is_active
		END = ?`);
		params.push(isActive ? 1 : 0);
	}

	return { conditions, params };
};

const list = async ({
	type,
	region,
	isActive = true,
	hotelId,
	playerId,
	offset = 0,
	limit = 20,
} = {}) => {
	if (!hotelId || !playerId) return { items: [], total: 0 };

	const { conditions, params } = buildListConditions({
		type,
		region,
		isActive,
		hotelId,
		playerId,
	});
	const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
	const safeOffset = Math.max(0, Number(offset) || 0);
	const joins = `
		FROM tv_channels tv
		INNER JOIN hotel_tv_channel htc ON htc.tv_channel_id = tv.id
		INNER JOIN players p ON p.id = ?
		LEFT JOIN player_tv_channel ptc
			ON ptc.player_id = p.id
			AND ptc.tv_channel_id = tv.id
		LEFT JOIN medias image
			ON image.id = COALESCE(htc.custom_image_id, tv.image_id)
			AND image.deleted_at IS NULL
	`;

	const sql = `
		SELECT ${SELECT_FIELDS}
		${joins}
		WHERE ${conditions.join(" AND ")}
		ORDER BY sort_order ASC, COALESCE(htc.custom_name, tv.name) ASC
		LIMIT ${safeLimit} OFFSET ${safeOffset}
	`;
	// The player id is used once by the JOIN and once by the WHERE clause.
	const queryParams = [playerId, ...params];
	const [rows] = await pool.execute(sql, queryParams);
	const [countRows] = await pool.execute(
		`SELECT COUNT(DISTINCT tv.id) AS total
		 ${joins}
		 WHERE ${conditions.join(" AND ")}`,
		queryParams,
	);

	return { items: rows, total: countRows[0]?.total || 0 };
};

const getByUuid = async (uuid, hotelId, playerId) => {
	if (!hotelId || !playerId) return null;

	const [rows] = await pool.execute(
		`SELECT ${SELECT_FIELDS}
		 FROM tv_channels tv
		 INNER JOIN hotel_tv_channel htc ON htc.tv_channel_id = tv.id
		 INNER JOIN players p ON p.id = ?
		 LEFT JOIN player_tv_channel ptc
			ON ptc.player_id = p.id
			AND ptc.tv_channel_id = tv.id
		 LEFT JOIN medias image
			ON image.id = COALESCE(htc.custom_image_id, tv.image_id)
			AND image.deleted_at IS NULL
		 WHERE tv.uuid = ?
			AND htc.hotel_id = ?
			AND p.hotel_id = htc.hotel_id
			AND p.deleted_at IS NULL
			AND tv.deleted_at IS NULL
			AND (p.use_custom_channels = 0 OR (ptc.id IS NOT NULL AND ptc.is_active = 1))
		 LIMIT 1`,
		[playerId, uuid, hotelId],
	);
	return rows[0] || null;
};

module.exports = { list, getByUuid };
