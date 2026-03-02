const pool = require("../config/database");

const TABLE = "songs";
const MEDIA_TABLE = "medias";
const ARTIST_TABLE = "artists";
const ALBUM_TABLE = "albums";

// List songs with optional filters; joins artists and albums
const list = async ({ artistUuid, albumUuid, isActive = true, q } = {}) => {
	const conditions = ["s.deleted_at IS NULL"];
	const params = [];

	if (typeof isActive === "boolean") {
		conditions.push("s.is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	if (artistUuid) {
		conditions.push("ar.uuid = ?");
		params.push(artistUuid);
	}

	if (albumUuid) {
		conditions.push("al.uuid = ?");
		params.push(albumUuid);
	}

	if (q) {
		const like = `%${q}%`;
		conditions.push("(s.title LIKE ?)");
		params.push(like);
	}

	let sql = `
		SELECT
			s.*,
			ar.uuid AS artist_uuid,
			ar.name AS artist_name,
			al.uuid AS album_uuid,
			al.title AS album_title,
			m.storage_path AS image_path,
			ma.storage_path AS audio_path
		FROM ${TABLE} s
		LEFT JOIN ${ARTIST_TABLE} ar ON ar.id = s.artist_id
		LEFT JOIN ${ALBUM_TABLE} al ON al.id = s.album_id
		LEFT JOIN ${MEDIA_TABLE} m ON m.id = s.image_id
		LEFT JOIN ${MEDIA_TABLE} ma ON ma.id = s.song_id
	`;

	if (conditions.length) {
		sql += ` WHERE ${conditions.join(" AND ")}`;
	}

	sql += " ORDER BY s.sort_order ASC, s.title ASC";

	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`
		SELECT
			s.*,
			ar.uuid AS artist_uuid,
			ar.name AS artist_name,
			al.uuid AS album_uuid,
			al.title AS album_title,
			m.storage_path AS image_path,
			ma.storage_path AS audio_path
		FROM ${TABLE} s
		LEFT JOIN ${ARTIST_TABLE} ar ON ar.id = s.artist_id
		LEFT JOIN ${ALBUM_TABLE} al ON al.id = s.album_id
		LEFT JOIN ${MEDIA_TABLE} m ON m.id = s.image_id
		LEFT JOIN ${MEDIA_TABLE} ma ON ma.id = s.song_id
		WHERE s.uuid = ? AND s.deleted_at IS NULL
		LIMIT 1
		`,
		[uuid],
	);
	return rows[0] || null;
};

module.exports = { list, getByUuid };
