const MenuTx = require("../models/menuTransactionModel");
const Player = require("../models/playerModel");
const { respond, respondObject } = require("../helpers/response");
const { buildMediaUrl } = require("../helpers/common");

// POST /api/menu-transactions
// body: { player_uuid, guest_name?, payment_method, payment_status?, status?, tax_amount?, service_amount?, items: [{ menu_item_uuid, qty, notes? }] }
exports.createTransaction = async (req, res) => {
	try {
		const {
			player_uuid,
			guest_name,
			payment_method,
			payment_status,
			status,
			paid_at,
			tax_amount,
			service_amount,
			items,
		} = req.body || {};

		if (!player_uuid)
			return respond(res, 400, "player_uuid is required", []);
		if (!payment_method)
			return respond(res, 400, "payment_method is required", []);
		if (!Array.isArray(items) || items.length === 0) {
			return respond(res, 400, "items is required", []);
		}

		const player = await Player.getByUuid(player_uuid);
		if (!player) return respond(res, 404, "Player not found", []);

		let qrisData = null;

		const result = await MenuTx.createTransaction({
			playerId: player.id,
			guestName: guest_name,
			paymentMethod: payment_method,
			paymentStatus: payment_status,
			status,
			paidAt: paid_at,
			taxAmount: tax_amount,
			serviceAmount: service_amount,
			items
		});

		return respond(res, 201, "success", result, "Menu transaction created");

	} catch (err) {
		console.error("createTransaction error:", err.message);
		const msg = err.message || "Failed to create transaction";
		const isBadRequest = /(required|must|invalid|not found)/i.test(msg);
		return respond(res, isBadRequest ? 400 : 500, msg, []);
	}
};

// GET /api/menu-transactions/:uuid
exports.getTransactionDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const tx = await MenuTx.getByUuid(uuid);
		if (!tx) return respondObject(res, 404, "Transaction not found", null);

		const invoice = await MenuTx.getInvoiceByTxId(tx.id);

		const details = await MenuTx.listDetailsByTxId(tx.id);
		const mappedDetails = details.map((d) => ({
			menu_uuid: d.menu_uuid || null,
			menu_id: d.menu_id,
			name: d.menu_name,
			storage_image: buildMediaUrl("image", d.image_path),
			qty: d.quantity,
			quantity: d.quantity,
			price: d.price,
			subtotal: d.subtotal,
			notes: d.notes,
			status: d.status,
		}));

		const payload = {
			...tx,
			invoice_uuid: invoice?.uuid || null,
			invoice_number: invoice?.invoice_number || null,
			details: mappedDetails,
		};

		return respondObject(
			res,
			200,
			"success",
			payload,
			"Transaction detail",
		);
	} catch (err) {
		console.error("getTransactionDetail error:", err.message);
		return respondObject(
			res,
			500,
			"Failed to fetch transaction detail",
			null,
		);
	}
};
