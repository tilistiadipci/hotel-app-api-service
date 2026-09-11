const pool = require("../config/database");

const TENANT_TABLE = "menu_tenants";
const PLAYER_TABLE = "players";
const MEDIA_TABLE = "medias";
const TENANT_GROUP_TABLE = "menu_tenant_player_group";
const TENANT_PLAYER_TABLE = "menu_tenant_player";

const listByPlayerSerial = async (serial) => {
	const [playerRows] = await pool.execute(
		`SELECT id, uuid, hotel_id, name, serial, player_group_id, is_active
		FROM ${PLAYER_TABLE}
		WHERE serial = ?
			AND is_active = 1
			AND deleted_at IS NULL
		LIMIT 1`,
		[serial],
	);

	const player = playerRows[0] || null;
	if (!player) return null;

	const [tenants] = await pool.execute(
		`SELECT
			mt.id,
			mt.uuid,
			mt.name,
			mt.slug,
			mt.description,
			mt.location,
			mt.service_charge,
			mt.sort_order,
			mt.is_active,
			mt.target_mode,
			mt.image_id,
			m.storage_path AS image_path
		FROM ${TENANT_TABLE} mt
		LEFT JOIN ${MEDIA_TABLE} m
			ON m.id = mt.image_id
			AND m.deleted_at IS NULL
		WHERE mt.is_active = 1
			AND mt.hotel_id = ?
			AND mt.deleted_at IS NULL
			AND (
				mt.target_mode = 'all'
				OR (
					mt.target_mode = 'groups'
					AND ? IS NOT NULL
					AND EXISTS (
						SELECT 1
						FROM ${TENANT_GROUP_TABLE} mtpg
						WHERE mtpg.menu_tenant_id = mt.id
							AND mtpg.player_group_id = ?
					)
				)
				OR (
					mt.target_mode = 'players'
					AND EXISTS (
						SELECT 1
						FROM ${TENANT_PLAYER_TABLE} mtp
						WHERE mtp.menu_tenant_id = mt.id
							AND mtp.player_id = ?
					)
				)
			)
		ORDER BY mt.sort_order ASC, mt.name ASC`,
		[player.hotel_id, player.player_group_id, player.player_group_id, player.id],
	);

	return { player, tenants };
};

module.exports = { listByPlayerSerial };
