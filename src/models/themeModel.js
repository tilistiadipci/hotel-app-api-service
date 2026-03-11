const pool = require("../config/database");

const TABLE = "themes";
const DETAIL_TABLE = "theme_details";
const MEDIA_TABLE = "medias";

const baseSelect = `
	SELECT
		t.*,
		m.storage_path AS image_path
	FROM ${TABLE} t
	LEFT JOIN ${MEDIA_TABLE} m
		ON m.id = t.image_id
		AND m.deleted_at IS NULL
`;

const list = async () => {
	const [rows] = await pool.execute(
		`
		${baseSelect}
		WHERE t.deleted_at IS NULL
		ORDER BY t.id DESC
		`,
	);
	return rows;
};

const getDetailByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`
		SELECT
			t.*,
			m.storage_path AS image_path,
			td.id AS detail_id,
			td.uuid AS detail_uuid,
			td.key AS detail_key,
			td.value AS detail_value,
			td.created_at AS detail_created_at,
			td.updated_at AS detail_updated_at
		FROM ${TABLE} t
		LEFT JOIN ${MEDIA_TABLE} m
			ON m.id = t.image_id
			AND m.deleted_at IS NULL
		LEFT JOIN ${DETAIL_TABLE} td
			ON td.theme_id = t.id
		WHERE t.uuid = ?
			AND t.deleted_at IS NULL
		ORDER BY td.id ASC
		`,
		[uuid],
	);
	return rows;
};

module.exports = { list, getDetailByUuid };
