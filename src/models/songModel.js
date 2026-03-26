const pool = require("../config/database");

const TABLE = "songs";
const MEDIA_TABLE = "medias";
const ARTIST_TABLE = "artists";
const ALBUM_TABLE = "albums";
const PLAYLIST_TABLE = "song_playlists";

// List songs with optional filters; joins artists and albums
const list = async ({
	isActive = true,
	q,
	offset = 0,
	limit = 20,
} = {}) => {
	const conditions = ["s.deleted_at IS NULL"];
	const params = [];

	if (typeof isActive === "boolean") {
		conditions.push("s.is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	if (q) {
		const like = `%${q}%`;
		conditions.push("(s.title LIKE ?)");
		params.push(like);
	}
	const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;
	const safeOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;

	let sql = `
		SELECT
			s.*,
			ar.uuid AS artist_uuid,
			ar.name AS artist_name,
			al.uuid AS album_uuid,
			al.title AS album_title,
			sp.uuid AS song_playlist_uuid,
			sp.name AS song_playlist_name,
			m.storage_path AS image_path,
			ma.storage_path AS audio_path
		FROM ${TABLE} s
		LEFT JOIN ${ARTIST_TABLE} ar ON ar.id = s.artist_id
		LEFT JOIN ${ALBUM_TABLE} al ON al.id = s.album_id
		LEFT JOIN ${PLAYLIST_TABLE} sp ON sp.id = s.song_playlist_id
		LEFT JOIN ${MEDIA_TABLE} m ON m.id = s.image_id
		LEFT JOIN ${MEDIA_TABLE} ma ON ma.id = s.song_id
	`;

	if (conditions.length) {
		sql += ` WHERE ${conditions.join(" AND ")}`;
	}

	sql += ` ORDER BY s.sort_order ASC, s.title ASC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

	const [rows] = await pool.execute(sql, params);

	const [countRows] = await pool.execute(
		`
		SELECT COUNT(*) AS total
		FROM ${TABLE} s
		${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
		`,
		params,
	);

	return {
		items: rows,
		total: countRows[0]?.total || 0,
	};
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
			sp.uuid AS song_playlist_uuid,
			sp.name AS song_playlist_name,
			m.storage_path AS image_path,
			ma.storage_path AS audio_path
		FROM ${TABLE} s
		LEFT JOIN ${ARTIST_TABLE} ar ON ar.id = s.artist_id
		LEFT JOIN ${ALBUM_TABLE} al ON al.id = s.album_id
		LEFT JOIN ${PLAYLIST_TABLE} sp ON sp.id = s.song_playlist_id
		LEFT JOIN ${MEDIA_TABLE} m ON m.id = s.image_id
		LEFT JOIN ${MEDIA_TABLE} ma ON ma.id = s.song_id
		WHERE s.uuid = ? AND s.deleted_at IS NULL
		LIMIT 1
		`,
		[uuid],
	);
	return rows[0] || null;
};

const listAlbums = async ({
	albumName,
	isActive = true,
	offset = 0,
	limit = 20,
} = {}) => {
	const conditions = ["s.deleted_at IS NULL", "al.id IS NOT NULL"];
	const params = [];

	if (typeof isActive === "boolean") {
		conditions.push("s.is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	if (albumName) {
		conditions.push("al.title LIKE ?");
		params.push(`%${albumName}%`);
	}

	const whereSql = `WHERE ${conditions.join(" AND ")}`;
	const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;
	const safeOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;

	const [albumRows] = await pool.execute(
		`
		SELECT
			al.id,
			al.uuid,
			al.title,
			COUNT(s.id) AS total_songs
		FROM ${TABLE} s
		LEFT JOIN ${ARTIST_TABLE} ar ON ar.id = s.artist_id
		LEFT JOIN ${ALBUM_TABLE} al ON al.id = s.album_id
		${whereSql}
		GROUP BY al.id, al.uuid, al.title
		ORDER BY al.title ASC
		LIMIT ${safeLimit} OFFSET ${safeOffset}
		`,
		params,
	);

	const [countRows] = await pool.execute(
		`
		SELECT COUNT(*) AS total
		FROM (
			SELECT al.id
			FROM ${TABLE} s
			LEFT JOIN ${ARTIST_TABLE} ar ON ar.id = s.artist_id
			LEFT JOIN ${ALBUM_TABLE} al ON al.id = s.album_id
			${whereSql}
			GROUP BY al.id
		) grouped_albums
		`,
		params,
	);

	if (!albumRows.length) {
		return {
			items: [],
			total: countRows[0]?.total || 0,
		};
	}

	return {
		items: albumRows.map((album) => ({
			uuid: album.uuid,
			title: album.title,
			total_songs: Number(album.total_songs) || 0,
			list_song_url: `${process.env.APP_URL}/api/songs/albums/${album.uuid}?active=${isActive}&offset=${offset}&limit=${limit}`,
		})),
		total: countRows[0]?.total || 0,
	};
};

const listByAlbumUuid = async ({
	albumUuid,
	isActive = true,
	q,
	offset = 0,
	limit = 20,
} = {}) => {
	if (!albumUuid) {
		return { items: [], total: 0 };
	}

	const conditions = ["s.deleted_at IS NULL", "al.uuid = ?"];
	const params = [albumUuid];

	if (typeof isActive === "boolean") {
		conditions.push("s.is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	if (q) {
		const like = `%${q}%`;
		conditions.push("(s.title LIKE ?)");
		params.push(like);
	}

	const whereSql = `WHERE ${conditions.join(" AND ")}`;
	const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;
	const safeOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;

	const [rows] = await pool.execute(
		`
		SELECT
			s.*,
			ar.uuid AS artist_uuid,
			ar.name AS artist_name,
			al.uuid AS album_uuid,
			al.title AS album_title,
			sp.uuid AS song_playlist_uuid,
			sp.name AS song_playlist_name,
			m.storage_path AS image_path,
			ma.storage_path AS audio_path
		FROM ${TABLE} s
		LEFT JOIN ${ARTIST_TABLE} ar ON ar.id = s.artist_id
		LEFT JOIN ${ALBUM_TABLE} al ON al.id = s.album_id
		LEFT JOIN ${PLAYLIST_TABLE} sp ON sp.id = s.song_playlist_id
		LEFT JOIN ${MEDIA_TABLE} m ON m.id = s.image_id
		LEFT JOIN ${MEDIA_TABLE} ma ON ma.id = s.song_id
		${whereSql}
		ORDER BY s.sort_order ASC, s.title ASC
		LIMIT ${safeLimit} OFFSET ${safeOffset}
		`,
		params,
	);

	const [countRows] = await pool.execute(
		`
		SELECT COUNT(*) AS total
		FROM ${TABLE} s
		LEFT JOIN ${ALBUM_TABLE} al ON al.id = s.album_id
		${whereSql}
		`,
		params,
	);

	return {
		items: rows,
		total: countRows[0]?.total || 0,
	};
};

module.exports = { list, getByUuid, listAlbums, listByAlbumUuid };
