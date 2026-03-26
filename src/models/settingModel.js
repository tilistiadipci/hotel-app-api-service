const pool = require("../config/database");

const getByKey = async (key) => {
	const [rows] = await pool.query(
		"SELECT * FROM settings WHERE `key` = ? AND deleted_at IS NULL LIMIT 1",
		[key],
	);
	return rows[0] || null;
};

const getByKeys = async (keys = []) => {
	if (!Array.isArray(keys) || keys.length === 0) return [];

	const [rows] = await pool.query(
		"SELECT * FROM settings WHERE `key` IN (?) AND deleted_at IS NULL",
		[keys],
	);
	return rows || [];
};

const getAll = async (columns = []) => {
	let query = "SELECT * FROM settings WHERE deleted_at IS NULL";

	if (columns.length > 0) {
		const safeColumns = columns.map((col) => `\`${col}\``);
		query = `SELECT ${safeColumns.join(", ")} FROM settings WHERE deleted_at IS NULL`;
	}
	const [rows] = await pool.query(query);
	return rows || [];
};

const getAllWithMedia = async () => {
	const sql = `
		SELECT 
			s.id,
			s.key,
			s.value,
			m.storage_path
		FROM settings s
		LEFT JOIN medias m 
			ON s.value = m.id 
			AND s.key = 'general_app_logo'
			AND m.deleted_at IS NULL
		WHERE s.deleted_at IS NULL
	`;

	const [rows] = await pool.query(sql);
	return rows;
};

module.exports = { getByKey, getByKeys, getAll, getAllWithMedia };
