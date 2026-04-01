const socket = require("../helpers/socket");
const { respondObject } = require("../helpers/response");

const buildBasePayload = (payload = {}) => ({
	...payload,
	triggered_at: payload.triggered_at || new Date().toISOString(),
});

const emitEvent = (eventName, payload = {}) => {
	const io = socket.getIO();
	const normalizedPayload = buildBasePayload(payload);

	io.emit(eventName, normalizedPayload);

	return {
		event: eventName,
		payload: normalizedPayload,
	};
};

const emitNewOrder = (payload = {}) => emitEvent("new-order", payload);

const emitAlarmWarning = (payload = {}) => {
	const io = socket.getIO();
	const normalizedPayload = buildBasePayload(payload);

	const { player_serials = [] } = normalizedPayload;

	player_serials.forEach((serial) => {
		const roomName = `player-${serial}`;

		io.to(roomName).emit("alarm-warning", normalizedPayload);

		console.log(`🚨 Emit ke ${roomName}`);
	});

	return {
		event: "alarm-warning",
		total_target: player_serials.length,
		payload: normalizedPayload,
	};
};

const triggerNewOrder = async (req, res) => {
	try {
		const { invoice_number, status, player_alias, ...rest } =
			req.body || {};

		if (!invoice_number) {
			return respondObject(res, 400, "invoice_number is required", null);
		}

		const result = emitNewOrder({
			invoice_number,
			status: status || "pending",
			player_alias: player_alias || null,
			...rest,
		});

		return respondObject(
			res,
			200,
			"success",
			result,
			"Websocket new-order triggered",
		);
	} catch (err) {
		console.error("triggerNewOrder error:", err.message);
		return respondObject(
			res,
			500,
			err?.message || "Failed to trigger websocket new-order",
			null,
		);
	}
};

const triggerAlarmWarning = async (req, res) => {
	try {
		const {
			type = "general",
			priority = "normal",
			message = null,
			schedule_mode = "immediate",
			player_serials = [],
		} = req.body || {};

		if (!message) {
			return res.status(400).json({
				success: false,
				message: "message is required",
			});
		}

		if (!Array.isArray(player_serials) || player_serials.length === 0) {
			return res.status(400).json({
				success: false,
				message: "player_serials is required",
			});
		}

		const result = emitAlarmWarning({
			type,
			priority,
			message,
			schedule_mode,
			player_serials,
		});

		return res.json({
			success: true,
			data: result,
		});
	} catch (err) {
		console.error("triggerAlarmWarning error:", err.message);

		return res.status(500).json({
			success: false,
			message: err.message,
		});
	}
};

module.exports = {
	emitNewOrder,
	emitAlarmWarning,
	triggerNewOrder,
	triggerAlarmWarning,
};
