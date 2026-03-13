const pool = require("../config/database");

const TABLE = "players";
const THEME_TABLE = "themes";
const THEME_DETAIL_TABLE = "theme_details";
const MEDIA_TABLE = "medias";
const BOOKING_TABLE = "bookings";

// List players with optional filters
// Filters: isActive (boolean), serial (string), includeDeleted (boolean)
const list = async ({ isActive, serial, includeDeleted = false } = {}) => {
	const conditions = [];
	const params = [];

	if (!includeDeleted) {
		conditions.push("deleted_at IS NULL");
	}

	if (typeof isActive === "boolean") {
		conditions.push("is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	if (serial) {
		conditions.push("serial LIKE ?");
		params.push(`%${serial}%`);
	}

	const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
	const sql = `SELECT * FROM ${TABLE} ${where} ORDER BY id ASC`;
	const [rows] = await pool.execute(sql, params);
	return rows;
};

const listWithThemeSummary = async ({
	isActive,
	serial,
	includeDeleted = false,
} = {}) => {
	const conditions = [];
	const params = [];

	if (!includeDeleted) {
		conditions.push("p.deleted_at IS NULL");
	}

	if (typeof isActive === "boolean") {
		conditions.push("p.is_active = ?");
		params.push(isActive ? 1 : 0);
	}

	if (serial) {
		conditions.push("p.serial LIKE ?");
		params.push(`%${serial}%`);
	}

	const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
	const sql = `
		SELECT
			p.*,
			t.id AS theme_ref_id,
			t.uuid AS theme_ref_uuid,
			t.name AS theme_ref_name
		FROM ${TABLE} p
		LEFT JOIN ${THEME_TABLE} t
			ON t.id = p.theme_id
			AND t.deleted_at IS NULL
		${where}
		ORDER BY p.id ASC
	`;
	const [rows] = await pool.execute(sql, params);
	return rows;
};

const getBySerial = async (serial) => {
	const [rows] = await pool.execute(
		`SELECT * FROM ${TABLE} WHERE serial = ? AND deleted_at IS NULL LIMIT 1`,
		[serial],
	);
	return rows[0] || null;
};

const getTokenBySerial = async (serial) => {
	const [rows] = await pool.execute(
		`SELECT id, uuid, serial, token, is_active
		FROM ${TABLE}
		WHERE serial = ?
			AND is_active = 1
			AND deleted_at IS NULL
		LIMIT 1`,
		[serial],
	);
	return rows[0] || null;
};

const getByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`SELECT * FROM ${TABLE} WHERE uuid = ? AND deleted_at IS NULL LIMIT 1`,
		[uuid],
	);
	return rows[0] || null;
};

const getByTokenAndSerial = async (token, serial) => {
	const [rows] = await pool.execute(
		`SELECT * FROM ${TABLE}
		WHERE token = ?
			AND serial = ?
			AND is_active = 1
			AND deleted_at IS NULL
		LIMIT 1`,
		[token, serial],
	);
	return rows[0] || null;
};

const getDetailByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`SELECT
			p.*,
			b.guest_name,
			t.id AS theme_ref_id,
			t.uuid AS theme_ref_uuid,
			t.name AS theme_ref_name,
			t.description AS theme_ref_description,
			t.is_default AS theme_ref_is_default,
			t.image_id AS theme_ref_image_id,
			m.storage_path AS theme_ref_image_path,
			td.id AS theme_detail_id,
			td.uuid AS theme_detail_uuid,
			td.key AS theme_detail_key,
			td.value AS theme_detail_value,
			td.created_at AS theme_detail_created_at,
			td.updated_at AS theme_detail_updated_at
		FROM ${TABLE} p
		LEFT JOIN (
			SELECT
				b1.player_id,
				b1.guest_name
			FROM ${BOOKING_TABLE} b1
			WHERE b1.deleted_at IS NULL
				AND b1.checked_out_at IS NULL
				AND b1.id = (
					SELECT MAX(b2.id)
					FROM ${BOOKING_TABLE} b2
					WHERE b2.player_id = b1.player_id
						AND b2.deleted_at IS NULL
						AND b2.checked_out_at IS NULL
				)
		) b
			ON b.player_id = p.id
		LEFT JOIN ${THEME_TABLE} t
			ON t.id = p.theme_id
			AND t.deleted_at IS NULL
		LEFT JOIN ${MEDIA_TABLE} m
			ON m.id = t.image_id
			AND m.deleted_at IS NULL
		LEFT JOIN ${THEME_DETAIL_TABLE} td
			ON td.theme_id = t.id
		WHERE p.uuid = ?
			AND p.deleted_at IS NULL
		ORDER BY td.id ASC`,
		[uuid],
	);
	return rows;
};

const getDetailBySerial = async (serial) => {
	const [rows] = await pool.execute(
		`SELECT
			p.*,
			b.guest_name,
			t.id AS theme_ref_id,
			t.uuid AS theme_ref_uuid,
			t.name AS theme_ref_name,
			t.description AS theme_ref_description,
			t.is_default AS theme_ref_is_default,
			t.image_id AS theme_ref_image_id,
			m.storage_path AS theme_ref_image_path,
			td.id AS theme_detail_id,
			td.uuid AS theme_detail_uuid,
			td.key AS theme_detail_key,
			td.value AS theme_detail_value,
			td.created_at AS theme_detail_created_at,
			td.updated_at AS theme_detail_updated_at
		FROM ${TABLE} p
		LEFT JOIN (
			SELECT
				b1.player_id,
				b1.guest_name
			FROM ${BOOKING_TABLE} b1
			WHERE b1.deleted_at IS NULL
				AND b1.checked_out_at IS NULL
				AND b1.id = (
					SELECT MAX(b2.id)
					FROM ${BOOKING_TABLE} b2
					WHERE b2.player_id = b1.player_id
						AND b2.deleted_at IS NULL
						AND b2.checked_out_at IS NULL
				)
		) b
			ON b.player_id = p.id
		LEFT JOIN ${THEME_TABLE} t
			ON t.id = p.theme_id
			AND t.deleted_at IS NULL
		LEFT JOIN ${MEDIA_TABLE} m
			ON m.id = t.image_id
			AND m.deleted_at IS NULL
		LEFT JOIN ${THEME_DETAIL_TABLE} td
			ON td.theme_id = t.id
		WHERE p.serial = ?
			AND p.is_active = 1
			AND p.deleted_at IS NULL
		ORDER BY td.id ASC`,
		[serial],
	);
	return rows;
};

module.exports = {
	list,
	listWithThemeSummary,
	getBySerial,
	getTokenBySerial,
	getByUuid,
	getByTokenAndSerial,
	getDetailByUuid,
	getDetailBySerial,
};
