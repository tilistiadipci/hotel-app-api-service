const midtransClient = require("midtrans-client");
const crypto = require("crypto");

const parseBoolean = (value) => String(value).toLowerCase() === "true";
const normalizeAmount = (value) => Number(Number(value || 0).toFixed(2));
const DEFAULT_CUSTOMER_EMAIL = "tiliztiadi@gmail.com";
const shouldTrustNotificationPayload = () =>
	parseBoolean(process.env.MIDTRANS_NOTIFICATION_TRUST_PAYLOAD);

const getSnapClient = () => {
	const isProduction = parseBoolean(process.env.MIDTRANS_IS_PRODUCTION);
	const serverKey = isProduction ? process.env.MIDTRANS_SERVER_KEY_PRODUCTION : process.env.MIDTRANS_SERVER_KEY_DEVELOPMENT;
	const clientKey = isProduction ? process.env.MIDTRANS_CLIENT_KEY_PRODUCTION : process.env.MIDTRANS_CLIENT_KEY_DEVELOPMENT;


	if (!serverKey || !clientKey) {
		throw new Error("MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY are required");
	}

	return new midtransClient.Snap({
		isProduction: parseBoolean(process.env.MIDTRANS_IS_PRODUCTION),
		serverKey,
		clientKey,
	});
};

const getSnapJsUrl = () =>
	parseBoolean(process.env.MIDTRANS_IS_PRODUCTION)
		? "https://app.midtrans.com/snap/snap.js"
		: "https://app.sandbox.midtrans.com/snap/snap.js";

const generateSignatureKey = ({
	order_id,
	status_code,
	gross_amount,
	server_key,
}) => {
	const isProduction = parseBoolean(process.env.MIDTRANS_IS_PRODUCTION);
	const resolvedServerKey =
		server_key ||
		(isProduction
			? process.env.MIDTRANS_SERVER_KEY_PRODUCTION
			: process.env.MIDTRANS_SERVER_KEY_DEVELOPMENT);

	if (!order_id) throw new Error("order_id is required to generate signature_key");
	if (!status_code) throw new Error("status_code is required to generate signature_key");
	if (!gross_amount) throw new Error("gross_amount is required to generate signature_key");
	if (!resolvedServerKey) throw new Error("Midtrans server key is required");

	return crypto
		.createHash("sha512")
		.update(
			String(order_id) +
				String(status_code) +
				String(gross_amount) +
				String(resolvedServerKey),
		)
		.digest("hex");
};

const buildSnapPayload = ({
	orderId,
	grossAmount,
	items = [],
	customer = {},
	expiryDuration,
	expiryUnit
}) => {
	const payload = {
		transaction_details: {
			order_id: orderId,
			gross_amount: normalizeAmount(grossAmount),
		},
		item_details: items.map((item) => ({
			id: String(item.id),
			price: normalizeAmount(item.price),
			quantity: Number(item.quantity || 0),
			name: String(item.name || "").slice(0, 50) || "Item",
		})),
		customer_details: {
			first_name: customer.first_name || "Guest",
			last_name: customer.last_name || "",
			email: customer.email || DEFAULT_CUSTOMER_EMAIL,
			phone: customer.phone || "081234567890",
		},
	};

	const resolvedExpiryDuration = Number(expiryDuration || process.env.MIDTRANS_QRIS_EXPIRY_DURATION || 15);
	const resolvedExpiryUnit = expiryUnit || process.env.MIDTRANS_QRIS_EXPIRY_UNIT || "minute";

	if (resolvedExpiryDuration > 0) {
		payload.custom_expiry = {
			expiry_duration: resolvedExpiryDuration,
			unit: resolvedExpiryUnit,
		};
	}

	return payload;
};

const createTransaction = async (params) => {
	const snap = getSnapClient();
	const payload = buildSnapPayload(params);
	const response = await snap.createTransaction(payload);
	const MIDTRANS_AUTO_QRIS_PAYMENT = process.env.MIDTRANS_AUTO_QRIS_PAYMENT || "false";

	console.log("createTransaction response:", response);

	return {
		order_id: payload.transaction_details.order_id,
		gross_amount: payload.transaction_details.gross_amount,
		currency: "IDR",
		transaction_status: "pending",
		snap_token: response?.token || null,
		payment_page_url: MIDTRANS_AUTO_QRIS_PAYMENT === "false" ? response?.redirect_url : response?.redirect_url + "#/other-qris",
		status_code: "201",
		status_message: "Transaction is created",
	};
};

const parseNotificationStatus = (notification) => {
	const transactionStatus = String(notification?.transaction_status || "").toLowerCase();
	const fraudStatus = String(notification?.fraud_status || "").toLowerCase();

	if (transactionStatus === "capture") {
		if (fraudStatus === "challenge") {
			return {
				paymentStatus: "pending",
				status: "ordered",
				isPaid: false,
			};
		}

		return {
			paymentStatus: "paid",
			status: "paid",
			isPaid: true,
		};
	}

	if (transactionStatus === "settlement") {
		return {
			paymentStatus: "paid",
			status: "processing",
			isPaid: true,
		};
	}

	if (transactionStatus === "pending") {
		return {
			paymentStatus: "pending",
			status: "ordered",
			isPaid: false,
		};
	}

	if (["deny", "cancel", "expire", "failure"].includes(transactionStatus)) {
		return {
			paymentStatus: "failed",
			status: "cancelled",
			isPaid: false,
		};
	}

	return {
		paymentStatus: "pending",
		status: "ordered",
		isPaid: false,
	};
};

const handleNotification = async (notificationPayload) => {
	const payload = { ...(notificationPayload || {}) };

	if (!payload.signature_key && payload.order_id && payload.status_code && payload.gross_amount) {
		payload.signature_key = generateSignatureKey(payload);
	}

	if (shouldTrustNotificationPayload()) {
		return {
			notification: payload,
			mappedStatus: parseNotificationStatus(payload),
		};
	}

	const snap = getSnapClient();
	const notification = await snap.transaction.notification(payload);

	return {
		notification,
		mappedStatus: parseNotificationStatus(notification),
	};
};

const getTransactionStatus = async (transactionIdOrOrderId) => {
	const snap = getSnapClient();
	return snap.transaction.status(transactionIdOrOrderId);
};

module.exports = {
	buildSnapPayload,
	createTransaction,
	parseNotificationStatus,
	generateSignatureKey,
	getTransactionStatus,
	handleNotification,
	getSnapJsUrl,
};
