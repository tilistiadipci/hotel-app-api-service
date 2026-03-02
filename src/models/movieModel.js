const pool = require("../config/database");

const MOVIE_TABLE = "movies";
const CATEGORY_TABLE = "movies_categories";
const REL_TABLE = "movie_category_relations";
const MEDIA_TABLE = "medias";

const baseSelect = `
	SELECT
		m.*,
		img.storage_path AS image_path,
		vid.storage_path AS video_path,
		GROUP_CONCAT(DISTINCT mc.uuid) AS category_uuids,
		GROUP_CONCAT(DISTINCT mc.name) AS category_names
	FROM ${MOVIE_TABLE} m
	LEFT JOIN ${MEDIA_TABLE} img ON img.id = m.image_id
	LEFT JOIN ${MEDIA_TABLE} vid ON vid.id = m.video_id
	LEFT JOIN ${REL_TABLE} mcr ON mcr.movie_id = m.id
	LEFT JOIN ${CATEGORY_TABLE} mc ON mc.id = mcr.category_id
`;

const list = async ({ isActive = true, categoryUuid, q } = {}) => {
	const conditions = ["m.deleted_at IS NULL"];
	const params = [];

	if (typeof isActive === "boolean") {
		conditions.push("m.is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	if (categoryUuid) {
		conditions.push("mc.uuid = ?");
		params.push(categoryUuid);
	}

	if (q) {
		const like = `%${q}%`;
		conditions.push("m.title LIKE ?");
		params.push(like);
	}

	let sql = baseSelect;
	if (conditions.length) {
		sql += ` WHERE ${conditions.join(" AND ")}`;
	}
	sql += " GROUP BY m.id ORDER BY m.title ASC";

	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`
		${baseSelect}
		WHERE m.uuid = ? AND m.deleted_at IS NULL
		GROUP BY m.id
		LIMIT 1
		`,
		[uuid],
	);
	return rows[0] || null;
};

module.exports = { list, getByUuid };
