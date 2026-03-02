const pool = require("../config/database");

const list = async (filters = {}) => {
	const conditions = [];
	const params = [];

	if (filters.type) {
		conditions.push("type = ?");
		params.push(filters.type);
	}

	if (filters.category) {
		conditions.push("category = ?");
		params.push(filters.category);
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

	let sql = "SELECT * FROM medias";
	if (conditions.length) {
		sql += ` WHERE deleted_at IS NULL AND ${conditions.join(" AND ")}`;
	}
	sql += " ORDER BY created_at DESC";

	const [rows] = await pool.execute(sql, params);
	return rows;
};

module.exports = { list };
