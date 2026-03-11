const MenuTx = require("../models/menuTransactionModel");
const Player = require("../models/playerModel");
const socket = require("../helpers/socket");
const { respond, respondObject } = require("../helpers/response");
const { buildMediaUrl } = require("../helpers/common");
const {
	createTransaction: createMidtransTransaction,
	getTransactionStatus,
	handleNotification,
	getSnapJsUrl,
	parseNotificationStatus,
} = require("../helpers/midtrans");

// POST /api/menu-transactions
// body: { player_uuid, guest_name?, payment_method, payment_status?, status?, items: [{ menu_item_uuid, qty, notes? }] }
exports.createTransaction = async (req, res) => {
	try {
		const {
			player_uuid,
			guest_name,
			payment_method,
			payment_status,
			status,
			paid_at,
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

		const normalizedPaymentMethod = String(
			payment_method || "",
		).toLowerCase();

		const result = await MenuTx.createTransaction({
			playerId: player.id,
			guestName: guest_name,
			paymentMethod: payment_method,
			paymentStatus: payment_status,
			status,
			paidAt: paid_at,
			items,
			paymentHook:
				normalizedPaymentMethod === "qris"
					? async ({
							invoiceNumber,
							grandTotal,
							taxVal,
							serviceVal,
							detailRows,
							guestName: resolvedGuestName,
						}) => {
							const itemDetails = detailRows.map((item) => ({
								id: item.menuId,
								price: item.price,
								quantity: item.quantity,
								name: item.menuName,
							}));

							if (taxVal > 0) {
								itemDetails.push({
									id: "tax",
									price: taxVal,
									quantity: 1,
									name: "Tax",
								});
							}

							if (serviceVal > 0) {
								itemDetails.push({
									id: "service",
									price: serviceVal,
									quantity: 1,
									name: "Service Charge",
								});
							}

							return createMidtransTransaction({
								orderId: invoiceNumber,
								grossAmount: grandTotal,
								items: itemDetails,
								customer: {
									first_name:
										resolvedGuestName ||
										player.name ||
										player.device_name ||
										"Guest",
								},
								expiryDuration: req.body?.qris_expiry_duration,
								expiryUnit: req.body?.qris_expiry_unit,
							});
						}
					: undefined,
		});

		if (result?.payment && result?.uuid) {
			result.payment.payment_page_url_local = `/api/menu-transactions/${result.uuid}/payment-page`;
			result.payment.snap_html_url = `/api/menu-transactions/${result.uuid}/payment-page`;
			result.payment.payment_finish_url_local = `/api/menu-transactions/payment-finish?order_id=${encodeURIComponent(result.invoice_number)}`;
		}

		const io = socket.getIO();
		io.emit("new-order", {
			invoice_number: result.invoice_number,
			status: result.status,
			player_alias: player.alias,
		});

		return respond(res, 201, "success", result, "Menu transaction created");
	} catch (err) {
		console.error("createTransaction error:", err.message);
		const msg =
			err?.ApiResponse?.status_message ||
			err?.message ||
			"Failed to create transaction";
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

		const paymentGateway = await MenuTx.getPaymentGatewayByTxId(tx.id);
		if (paymentGateway) {
			let gatewayPayload = null;
			try {
				gatewayPayload = paymentGateway.payload_json
					? JSON.parse(paymentGateway.payload_json)
					: null;
			} catch (err) {
				gatewayPayload = null;
			}

			payload.payment = {
				transaction_id: paymentGateway.transaction_id,
				order_id: paymentGateway.order_id,
				payment_type: paymentGateway.payment_type,
				transaction_status: paymentGateway.transaction_status,
				snap_token: gatewayPayload?.snap_token || null,
				redirect_url: gatewayPayload?.redirect_url || null,
				payment_page_url: gatewayPayload?.payment_page_url || null,
				payment_page_url_local: `/api/menu-transactions/${tx.uuid}/payment-page`,
				snap_html_url: `/api/menu-transactions/${tx.uuid}/payment-page`,
				payment_finish_url_local: `/api/menu-transactions/payment-finish?order_id=${encodeURIComponent(invoice.invoice_number)}`,
				enabled_payments: gatewayPayload?.enabled_payments || null,
			};
		}

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

// POST /api/menu-transactions/notifications/midtrans
exports.handleMidtransNotification = async (req, res) => {
	try {
		const { notification, mappedStatus } = await handleNotification(
			req.body || {},
		);
		const orderId = notification?.order_id;

		if (!orderId) {
			return respondObject(
				res,
				400,
				"Midtrans order_id is required",
				null,
			);
		}

		const tx = await MenuTx.getByInvoiceNumber(orderId);
		if (!tx) {
			return respondObject(res, 404, "Transaction not found", null);
		}

		console.log("notification:", notification);
		console.log("mappedStatus:", mappedStatus);
		console.log("tx:", tx);

		await MenuTx.updatePaymentStatusById(tx.id, {
			paymentStatus: mappedStatus.paymentStatus,
			status: mappedStatus.status,
			paidAt: mappedStatus.isPaid ? new Date() : null,
		});
		await MenuTx.updatePaymentGatewayByTxId(tx.id, notification);

		return respondObject(
			res,
			200,
			"success",
			{
				order_id: orderId,
				transaction_uuid: tx.uuid,
				payment_status: mappedStatus.paymentStatus,
				status: mappedStatus.status,
				midtrans_status: notification?.transaction_status || null,
			},
			"Midtrans notification handled",
		);
	} catch (err) {
		console.error("handleMidtransNotification error:", err);
		const msg =
			err?.ApiResponse?.status_message ||
			err?.message ||
			"Failed to handle Midtrans notification";
		return respondObject(res, 500, msg, null);
	}
};

const renderPaymentPage = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respond(res, 400, "uuid is required", []);

		const tx = await MenuTx.getByUuid(uuid);
		if (!tx) return respond(res, 404, "Transaction not found", []);
		if (String(tx.payment_method || "").toLowerCase() !== "qris") {
			return respond(
				res,
				400,
				"Transaction payment_method is not qris",
				[],
			);
		}

		const paymentGateway = await MenuTx.getPaymentGatewayByTxId(tx.id);
		let gatewayPayload = null;
		try {
			gatewayPayload = paymentGateway?.payload_json
				? JSON.parse(paymentGateway.payload_json)
				: null;
		} catch (err) {
			gatewayPayload = null;
		}

		let targetUrl =
			gatewayPayload?.payment_page_url ||
			gatewayPayload?.redirect_url ||
			paymentGateway?.qr_image_url ||
			null;
		const snapToken = gatewayPayload?.snap_token || null;

		if (!targetUrl && paymentGateway?.order_id) {
			const midtransStatus = await getTransactionStatus(
				paymentGateway.order_id,
			);
			targetUrl = midtransStatus?.redirect_url || null;
		}

		if (!snapToken && !targetUrl) {
			return respond(res, 404, "Payment page is not available", []);
		}

		const snapJsUrl = getSnapJsUrl();
		const clientKey = process.env.MIDTRANS_CLIENT_KEY || "";
		const finishUrl = `/api/menu-transactions/payment-finish?order_id=${encodeURIComponent(
			paymentGateway?.order_id || tx.invoice_number || "",
		)}`;

		return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Page</title>
  <script src="${snapJsUrl}" data-client-key="${clientKey}"></script>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      font-family: Arial, sans-serif;
    }
    .card {
      background: #fff;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      text-align: center;
      max-width: 420px;
      width: 100%;
    }
    iframe {
      width: 100%;
      height: 640px;
      border: 0;
      border-radius: 8px;
      margin: 0 auto 16px;
    }
    button {
      border: 0;
      border-radius: 999px;
      background: #111;
      color: #fff;
      padding: 12px 18px;
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 16px;
    }
    p {
      margin: 0;
      color: #444;
      font-size: 14px;
      word-break: break-all;
    }
    a {
      color: #0a66c2;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    ${
		snapToken
			? `<button id="pay-button" type="button">Open Payment</button>
    <p><a href="${targetUrl || "#"}" target="_blank" rel="noreferrer">Open payment page directly</a></p>`
			: `<iframe src="${targetUrl}" title="Payment Page"></iframe>
    <p><a href="${targetUrl}" target="_blank" rel="noreferrer">Open payment page directly</a></p>`
	}
  </div>
  ${
		snapToken
			? `<script>
    window.addEventListener('load', function () {
      var payButton = document.getElementById('pay-button');
      var openSnap = function () {
        window.snap.pay('${snapToken}', {
          onSuccess: function () {
            window.location.href = '${finishUrl}';
          },
          onPending: function () {
            window.location.href = '${finishUrl}';
          },
          onError: function () {
            window.location.href = '${finishUrl}';
          },
          onClose: function () {
            window.location.href = '${finishUrl}';
          }
        });
      };
      if (payButton) payButton.addEventListener('click', openSnap);
      setTimeout(openSnap, 300);
    });
  </script>`
			: ""
  }
</body>
</html>`);
	} catch (err) {
		console.error("renderPaymentPage error:", err);
		const msg =
			err?.ApiResponse?.status_message ||
			err?.message ||
			"Failed to fetch payment page";
		return respond(res, 500, msg, []);
	}
};

exports.getTransactionPaymentPage = renderPaymentPage;
exports.getTransactionQrisImage = renderPaymentPage;

const renderPaymentFinish = async ({ orderId }, res) => {
	try {
		if (!orderId) return respond(res, 400, "order_id is required", []);

		const tx = await MenuTx.getByInvoiceNumber(orderId);
		if (!tx) return respond(res, 404, "Transaction not found", []);

		const midtransStatus = await getTransactionStatus(orderId);
		const mappedStatus = parseNotificationStatus(midtransStatus);

		await MenuTx.updatePaymentStatusById(tx.id, {
			paymentStatus: mappedStatus.paymentStatus,
			status: mappedStatus.status,
			paidAt: mappedStatus.isPaid ? new Date() : null,
		});
		await MenuTx.updatePaymentGatewayByTxId(tx.id, midtransStatus);

		const transactionStatus =
			midtransStatus?.transaction_status || "pending";
		const paymentType = midtransStatus?.payment_type || "snap";
		const resolvedOrderId = midtransStatus?.order_id || orderId;

		return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Result</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      font-family: Arial, sans-serif;
      color: #111;
    }
    .card {
      width: 100%;
      max-width: 460px;
      background: #fff;
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.08);
    }
    h1 {
      margin: 0 0 12px;
      font-size: 22px;
    }
    p {
      margin: 8px 0;
      color: #444;
      word-break: break-word;
    }
    .badge {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      background: ${
			mappedStatus.isPaid
				? "#d9fbe5"
				: transactionStatus === "pending"
					? "#fff4cc"
					: "#ffe2e2"
		};
      color: ${
			mappedStatus.isPaid
				? "#116329"
				: transactionStatus === "pending"
					? "#7a5a00"
					: "#9f1d1d"
		};
      font-weight: 700;
      text-transform: uppercase;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Payment Result</h1>
    <p><span class="badge">${transactionStatus}</span></p>
    <p>Order ID: ${resolvedOrderId}</p>
    <p>Payment Type: ${paymentType}</p>
    <p>Local Payment Status: ${mappedStatus.paymentStatus}</p>
    <p>Local Order Status: ${mappedStatus.status}</p>
  </div>
</body>
</html>`);
	} catch (err) {
		console.error("renderPaymentFinish error:", err);
		const msg =
			err?.ApiResponse?.status_message ||
			err?.message ||
			"Failed to fetch payment status";
		return respond(res, 500, msg, []);
	}
};

// GET /api/menu-transactions/payment-finish?order_id=INV-...
exports.getTransactionPaymentFinish = async (req, res) =>
	renderPaymentFinish({ orderId: req.query?.order_id }, res);

// GET /api/menu-transactions/:uuid/payment-finish
exports.getTransactionPaymentFinishByUuid = async (req, res) => {
	const { uuid } = req.params;
	if (!uuid) return respond(res, 400, "uuid is required", []);

	const tx = await MenuTx.getByUuid(uuid);
	if (!tx) return respond(res, 404, "Transaction not found", []);

	const invoice = await MenuTx.getInvoiceByTxId(tx.id);
	if (!invoice?.invoice_number) {
		return respond(res, 404, "Invoice not found", []);
	}

	return renderPaymentFinish({ orderId: invoice.invoice_number }, res);
};
