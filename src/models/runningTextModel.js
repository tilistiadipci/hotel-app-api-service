const pool = require("../config/database");

const TABLE = "running_texts";

const list = async ({ offset = 0, limit = 20 } = {}) => {
	const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;
	const safeOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;

	const [rows] = await pool.execute(
		`
		SELECT
			id,
			uuid,
			title,
			description,
			sort_order,
			created_at,
			updated_at
		FROM ${TABLE}
		WHERE deleted_at IS NULL
		AND is_active = 1
		ORDER BY sort_order ASC, created_at DESC
		LIMIT ${safeLimit} OFFSET ${safeOffset}
		`,
	);

	const [countRows] = await pool.execute(
		`
		SELECT COUNT(*) AS total
		FROM ${TABLE}
		WHERE deleted_at IS NULL
		AND is_active = 1
		`,
	);

	return {
		items: rows,
		total: countRows[0]?.total || 0,
	};
};

module.exports = { list };
