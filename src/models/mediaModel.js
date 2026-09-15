const pool = require("../config/database");
const TABLE = "medias";

const list = async (filters = {}) => {
	const conditions = [];
	const params = [];

	if (filters.type) {
		conditions.push("type = ?");
		params.push(filters.type);
	}

	if (filters.hotelId) {
		conditions.push("(hotel_id = ? OR hotel_id IS NULL)");
		params.push(filters.hotelId);
	}

	if (typeof filters.isActive === "boolean") {
		conditions.push("is_active = ?");
		params.push(filters.isActive ? 1 : 0);
	}

	if (filters.q) {
		const like = `%${filters.q}%`;
		conditions.push("(title LIKE ? OR name LIKE ? OR description LIKE ?)");
		params.push(like, like, like);
	}

	let sql = `SELECT * FROM ${TABLE} WHERE deleted_at IS NULL`;
	if (conditions.length) {
		sql += ` AND ${conditions.join(" AND ")}`;
	}
	sql += " ORDER BY created_at DESC";

	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getMediaById = async (id) => {
	const sql = `SELECT * FROM ${TABLE} WHERE id = ? AND deleted_at IS NULL`;
	const [rows] = await pool.execute(sql, [id]);
	return rows[0];
};

const getAccessibleByStoragePath = async (storagePath, hotelId = null) => {
	const conditions = ["media.storage_path = ?", "media.deleted_at IS NULL"];
	const params = [storagePath];

	if (hotelId) {
		conditions.push(`(
			media.hotel_id = ?
			OR media.hotel_id IS NULL
			OR EXISTS (
				SELECT 1
				FROM hotel_theme ht
				INNER JOIN themes theme ON theme.id = ht.theme_id AND theme.deleted_at IS NULL
				LEFT JOIN theme_details detail ON detail.theme_id = theme.id
				WHERE ht.hotel_id = ?
					AND (
						theme.image_id = media.id
						OR detail.value = CAST(media.id AS CHAR)
						OR FIND_IN_SET(
							CAST(media.id AS CHAR),
							REPLACE(REPLACE(REPLACE(REPLACE(detail.value, '[', ''), ']', ''), '"', ''), ' ', '')
						) > 0
					)
			)
			OR EXISTS (
				SELECT 1
				FROM hotel_tv_channel htc
				INNER JOIN tv_channels tv ON tv.id = htc.tv_channel_id AND tv.deleted_at IS NULL
				WHERE htc.hotel_id = ?
					AND tv.image_id = media.id
			)
		)`);
		params.push(hotelId, hotelId, hotelId);
	} else {
		conditions.push("media.hotel_id IS NULL");
	}

	const sql = `
		SELECT media.id, media.hotel_id, media.storage_path
		FROM ${TABLE} media
		WHERE ${conditions.join(" AND ")}
		ORDER BY CASE
			WHEN media.hotel_id = ? THEN 0
			WHEN media.hotel_id IS NULL THEN 1
			ELSE 2
		END
		LIMIT 1
	`;
	if (hotelId) params.push(hotelId);
	else params.push("");
	const [rows] = await pool.execute(sql, params);

	return rows[0] || null;
};

const getMediaByIds = async (ids = []) => {
	const normalizedIds = [...new Set(ids.map(String).filter(Boolean))];
	if (!normalizedIds.length) {
		return [];
	}

	const placeholders = normalizedIds.map(() => "?").join(", ");
	const sql = `
		SELECT id, storage_path
		FROM ${TABLE}
		WHERE id IN (${placeholders})
			AND deleted_at IS NULL
	`;
	const [rows] = await pool.execute(sql, normalizedIds);
	return rows;
};

module.exports = {
	list,
	getAccessibleByStoragePath,
	getMediaById,
	getMediaByIds,
};
