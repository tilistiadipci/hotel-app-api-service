const pool = require("../config/database");

const TABLE = "themes";
const DETAIL_TABLE = "theme_details";
const MEDIA_TABLE = "medias";

const baseSelect = `
	SELECT
		t.*,
		CAST(ht.is_default AS CHAR) AS hotel_is_default,
		m.storage_path AS image_path
	FROM ${TABLE} t
	INNER JOIN hotel_theme ht
		ON ht.theme_id = t.id
	LEFT JOIN ${MEDIA_TABLE} m
		ON m.id = t.image_id
		AND m.deleted_at IS NULL
`;

const list = async (hotelId) => {
	if (!hotelId) return [];

	const [rows] = await pool.execute(
		`
		${baseSelect}
		WHERE ht.hotel_id = ?
			AND t.deleted_at IS NULL
		ORDER BY t.id DESC
		`,
		[hotelId],
	);
	return rows;
};

const getDetailByUuid = async (uuid, hotelId) => {
	if (!hotelId) return [];

	const [rows] = await pool.execute(
		`
		SELECT
			t.*,
			CAST(ht.is_default AS CHAR) AS hotel_is_default,
			m.storage_path AS image_path,
			td.id AS detail_id,
			td.uuid AS detail_uuid,
			td.key AS detail_key,
			td.value AS detail_value,
			td.created_at AS detail_created_at,
			td.updated_at AS detail_updated_at
		FROM ${TABLE} t
		INNER JOIN hotel_theme ht
			ON ht.theme_id = t.id
			AND ht.hotel_id = ?
		LEFT JOIN ${MEDIA_TABLE} m
			ON m.id = t.image_id
			AND m.deleted_at IS NULL
		LEFT JOIN ${DETAIL_TABLE} td
			ON td.theme_id = t.id
		WHERE t.uuid = ?
			AND t.deleted_at IS NULL
		ORDER BY td.id ASC
		`,
		[hotelId, uuid],
	);
	return rows;
};

module.exports = { list, getDetailByUuid };
