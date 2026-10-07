const pool = require("../config/database");

const getByKey = async (key, hotelId = null) => {
	const hotelFilter = hotelId ? " AND hotel_id = ?" : "";
	const params = hotelId ? [key, hotelId] : [key];
	const [rows] = await pool.query(
		`SELECT * FROM settings WHERE \`key\` = ?${hotelFilter} AND deleted_at IS NULL LIMIT 1`,
		params,
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

const getAllWithMedia = async (hotelId) => {
	if (!hotelId) return [];

	const sql = `
		SELECT 
			s.id,
			s.key,
			s.value,
			m.storage_path,
			m2.storage_path as storage_path2
		FROM settings s
		LEFT JOIN medias m 
			ON s.value = m.id 
			AND s.key = 'general_app_logo'
			AND m.hotel_id = s.hotel_id
			AND m.deleted_at IS NULL
		LEFT JOIN medias m2
			ON s.value = m2.id
			AND s.key = 'general_app_logo2'
			AND m2.hotel_id = s.hotel_id
			AND m2.deleted_at IS NULL
		WHERE s.hotel_id = ?
			AND s.deleted_at IS NULL
	`;

	const [rows] = await pool.query(sql, [hotelId]);
	return rows;
};

const getPlayerOverridesWithMedia = async (playerId) => {
	if (!playerId) return [];

	const sql = `
		SELECT
			pso.id,
			pso.setting_key AS \`key\`,
			pso.value,
			m.storage_path,
			m2.storage_path as storage_path2
		FROM player_setting_overrides pso
		INNER JOIN players p
			ON p.id = pso.player_id
			AND p.deleted_at IS NULL
		LEFT JOIN medias m
			ON pso.value = m.id
			AND pso.setting_key = 'general_app_logo'
			AND m.hotel_id = p.hotel_id
			AND m.deleted_at IS NULL
		LEFT JOIN medias m2
			ON pso.value = m2.id
			AND pso.setting_key = 'general_app_logo2'
			AND m2.hotel_id = p.hotel_id
			AND m2.deleted_at IS NULL
		WHERE pso.player_id = ?
	`;

	const [rows] = await pool.query(sql, [playerId]);
	return rows;
};

module.exports = {
	getByKey,
	getByKeys,
	getAll,
	getAllWithMedia,
	getPlayerOverridesWithMedia,
};
