const Player = require("../models/playerModel");
const Setting = require("../models/settingModel");
const Media = require("../models/mediaModel");
const { respond, respondObject } = require("../helpers/response");
const { buildMediaUrl, parseActiveFlag } = require("../helpers/common");

// Build reusable filters from query params
const buildFilters = (req) => {
	const rawActive = req.query.is_active ?? req.query.active;
	const isActive =
		rawActive === undefined ? undefined : parseActiveFlag(rawActive, true);
	const serial = req.query.serial || req.query.q || undefined;

	return { isActive, serial };
};

const mapPlayerDetail = (rows, settings) => {
	const [firstRow] = rows;
	const details = rows
		.filter((row) => row.theme_detail_id)
		.reduce((acc, row) => {
			let value = row.theme_detail_value;

			// handle image
			if (row.theme_detail_key === "image_id_1" && row.media_path_1) {
				value = buildMediaUrl("image", row.media_path_1);
			}

			if (row.theme_detail_key === "image_id_2" && row.media_path_2) {
				value = buildMediaUrl("image", row.media_path_2);
			}

			acc[row.theme_detail_key] = value;

			return acc;
		}, {});

	return {
		id: firstRow.id,
		uuid: firstRow.uuid,
		name: firstRow.name,
		serial: firstRow.serial,
		token: firstRow.token,
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
		settings: settings,
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
			({ theme_ref_id, theme_ref_uuid, theme_ref_name, ...player }) =>
				player,
		);

		return respond(res, 200, "success", sanitizedPayload, "Player list");
	} catch (err) {
		return respond(res, 500, err.message, []);
	}
};

const getPlayerTokenBySerial = async (serial, res) => {
	const player = await Player.getTokenBySerial(serial);
	if (!player) {
		return respondObject(res, 404, "Player not found", null);
	}

	if (!player.token) {
		return respondObject(
			res,
			404,
			"Player is not registered. Please contact support",
			null,
		);
	}

	const rows = await Player.getDetailBySerial(serial);
	if (!rows.length) {
		return respondObject(res, 404, "Player not found", null);
	}

	if (!rows[0].booking_player_id) {
		return respondObject(res, 404, "Player belum checkin", null);
	}

	const settings = await Setting.getAllWithMedia();
	const mapSetting = settings.reduce((acc, setting) => {
		let value = setting.value;

		if (setting.key === "general_app_logo" && setting.storage_path) {
			value = buildMediaUrl("image", setting.storage_path);
		}

		acc[setting.key] = value;
		return acc;
	}, {});

	return respondObject(
		res,
		200,
		"success",
		mapPlayerDetail(rows, mapSetting),
		"Player token",
	);
};

// GET /api/players/:serial
exports.getPlayerTokenBySerial = async (req, res) => {
	try {
		const { serial } = req.params;

		if (!serial) {
			return respondObject(res, 400, "serial is required", null);
		}

		return getPlayerTokenBySerial(serial, res);
	} catch (err) {
		return respondObject(res, 500, err.message, null);
	}
};
