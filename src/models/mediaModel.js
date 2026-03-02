const pool = require("../config/database");

const list = async (filters = {}) => {
	const conditions = [];
	const params = [];

	if (filters.type) {
		conditions.push("type = ?");
		params.push(filters.type);
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

	let sql = "SELECT * FROM medias WHERE deleted_at IS NULL";
	if (conditions.length) {
		sql += ` AND ${conditions.join(" AND ")}`;
	}
	sql += " ORDER BY created_at DESC";

	const [rows] = await pool.execute(sql, params);
	return rows;
};

module.exports = { list };
