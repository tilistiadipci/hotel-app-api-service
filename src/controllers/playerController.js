const Player = require("../models/playerModel");
const { respond, respondObject } = require("../helpers/response");
const { buildMediaUrl, parseActiveFlag } = require("../helpers/common");

// Build reusable filters from query params
const buildFilters = (req) => {
	const rawActive = req.query.is_active ?? req.query.active;
	const isActive = rawActive === undefined ? undefined : parseActiveFlag(rawActive, true);
	const serial = req.query.serial || req.query.q || undefined;

	return { isActive, serial };
};

// GET /api/players?is_active=1&serial=ABC
exports.getPlayers = async (req, res) => {
	try {
		const filters = buildFilters(req);
		const players = await Player.listWithThemeSummary(filters);
		const payload = players.map((player) => ({
			...player,
			theme: player.theme_ref_id
				? {
						id: player.theme_ref_id,
						uuid: player.theme_ref_uuid,
						name: player.theme_ref_name,
					}
				: null,
		}));

		const sanitizedPayload = payload.map(
			({
				theme_ref_id,
				theme_ref_uuid,
				theme_ref_name,
				...player
			}) => player,
		);

		return respond(res, 200, "success", sanitizedPayload, "Player list");
	} catch (err) {
		return respond(res, 500, err.message, []);
	}
};

// GET /api/players/:uuid
exports.getPlayerDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		const rows = await Player.getDetailByUuid(uuid);
		
		if (!rows.length) return respondObject(res, 404, "Player not found", null);

		const [firstRow] = rows;
		const details = rows
			.filter((row) => row.theme_detail_id)
			.map((row) => ({
				id: row.theme_detail_id,
				uuid: row.theme_detail_uuid,
				key: row.theme_detail_key,
				value: row.theme_detail_value,
				created_at: row.theme_detail_created_at,
				updated_at: row.theme_detail_updated_at,
			}));

		const player = {
			id: firstRow.id,
			uuid: firstRow.uuid,
			name: firstRow.name,
			serial: firstRow.serial,
			is_active: firstRow.is_active,
			theme_id: firstRow.theme_id,
			created_by: firstRow.created_by,
			updated_by: firstRow.updated_by,
			deleted_by: firstRow.deleted_by,
			created_at: firstRow.created_at,
			updated_at: firstRow.updated_at,
			deleted_at: firstRow.deleted_at,
			alias: firstRow.alias,
			guest_name: firstRow.guest_name,
			theme: firstRow.theme_ref_id
				? {
						id: firstRow.theme_ref_id,
						uuid: firstRow.theme_ref_uuid,
						name: firstRow.theme_ref_name,
						description: firstRow.theme_ref_description,
						is_default: firstRow.theme_ref_is_default,
						image_id: firstRow.theme_ref_image_id,
						image_url: buildMediaUrl(
							"image",
							firstRow.theme_ref_image_path,
						),
						details,
					}
				: null,
		};

		return respondObject(res, 200, "success", player, "Player detail");
	} catch (err) {
		return respondObject(res, 500, err.message, null);
	}
};
