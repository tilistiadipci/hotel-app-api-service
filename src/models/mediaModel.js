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

const getAccessibleByStoragePath = async (storagePath) => {
	const conditions = ["media.storage_path = ?", "media.deleted_at IS NULL"];
	const params = [storagePath];

	const sql = `
		SELECT media.id, media.hotel_id, media.storage_path
		FROM ${TABLE} media
		WHERE ${conditions.join(" AND ")}
		ORDER BY media.id DESC
		LIMIT 1
	`;
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
