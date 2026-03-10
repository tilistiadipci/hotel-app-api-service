const pool = require("../config/database");
const { randomUUID } = require("crypto");

const TX_TABLE = "menu_transactions";
const DETAIL_TABLE = "menu_transaction_details";
const INVOICE_TABLE = "menu_transaction_invoices";
const PAYMENT_GATEWAY_TABLE = "menu_transaction_payment_gateways";
const ITEM_TABLE = "menu_items";
const MEDIA_TABLE = "medias";

const ensurePaymentGatewayTable = async (executor) => {
	await executor.query(
		`CREATE TABLE IF NOT EXISTS ${PAYMENT_GATEWAY_TABLE} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			uuid CHAR(36) NOT NULL,
			menu_transaction_id BIGINT UNSIGNED NOT NULL,
			provider VARCHAR(50) NOT NULL,
			order_id VARCHAR(100) NULL,
			transaction_id VARCHAR(100) NULL,
			payment_type VARCHAR(50) NULL,
			transaction_status VARCHAR(50) NULL,
			qr_image_url TEXT NULL,
			qr_code_base64 LONGTEXT NULL,
			payload_json LONGTEXT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP NULL DEFAULT NULL,
			PRIMARY KEY (id),
			UNIQUE KEY uq_${PAYMENT_GATEWAY_TABLE}_uuid (uuid),
			KEY idx_${PAYMENT_GATEWAY_TABLE}_tx (menu_transaction_id)
		)`
	);
};

const savePaymentGateway = async (menuTransactionId, paymentResult, conn) => {
	if (!paymentResult || !menuTransactionId) return;

	const executor = conn || pool;
	await ensurePaymentGatewayTable(executor);

	const payloadJson = JSON.stringify(paymentResult);
	const [existingRows] = await executor.query(
		`SELECT id FROM ${PAYMENT_GATEWAY_TABLE}
		 WHERE menu_transaction_id = ? AND provider = ? AND deleted_at IS NULL
		 LIMIT 1`,
		[menuTransactionId, "midtrans"],
	);

	if (existingRows.length > 0) {
		await executor.execute(
			`UPDATE ${PAYMENT_GATEWAY_TABLE}
			 SET order_id = ?,
				 transaction_id = ?,
				 payment_type = ?,
				 transaction_status = ?,
				 qr_image_url = ?,
				 qr_code_base64 = ?,
				 payload_json = ?
			 WHERE id = ?`,
			[
				paymentResult.order_id || null,
				paymentResult.transaction_id || null,
				paymentResult.payment_type || null,
				paymentResult.transaction_status || null,
				paymentResult.redirect_url || paymentResult.payment_page_url || null,
				paymentResult.qr_code_base64 || null,
				payloadJson,
				existingRows[0].id,
			],
		);
		return;
	}

	await executor.execute(
		`INSERT INTO ${PAYMENT_GATEWAY_TABLE} (
			uuid,
			menu_transaction_id,
			provider,
			order_id,
			transaction_id,
			payment_type,
			transaction_status,
			qr_image_url,
			qr_code_base64,
			payload_json
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			randomUUID(),
			menuTransactionId,
			"midtrans",
			paymentResult.order_id || null,
			paymentResult.transaction_id || null,
			paymentResult.payment_type || null,
			paymentResult.transaction_status || null,
			paymentResult.redirect_url || paymentResult.payment_page_url || null,
			paymentResult.qr_code_base64 || null,
			payloadJson,
		],
	);
};

const generateInvoiceNumber = (txId) => {
	const now = new Date();
	const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
	const paddedId = String(txId).padStart(3, "0");
	return `INV-${datePart}-${paddedId}`;
};

const getItemsByUuids = async (uuids, conn) => {
	const executor = conn || pool;

	if (!uuids || uuids.length === 0) return [];

	const [rows] = await executor.query(
		`SELECT id, uuid, name, price, discount_price, image_id
		FROM ${ITEM_TABLE}
		WHERE uuid IN (?) AND deleted_at IS NULL`,
		[uuids],
	);

	return rows || [];
};

// Create a menu transaction and its detail rows based on the current schema
const createTransaction = async ({
    playerId,
    guestName,
    paymentMethod,
    paymentStatus = "pending",
    status = "ordered",
    paidAt = null,
    taxAmount = 0,
    serviceAmount = 0,
    items,
    paymentHook, // optional async hook executed before commit (e.g., Midtrans charge)
}) => {
	const conn = await pool.getConnection();
	try {
		await conn.beginTransaction();
		let paymentResult = null;

		if (!playerId) throw new Error("player_id is required");

		const normalizedMethod = String(paymentMethod || "").toLowerCase();
		if (!["qris", "bill"].includes(normalizedMethod)) {
			throw new Error("payment_method must be either 'qris' or 'bill'");
		}
		const normalizedPaymentStatus = String(paymentStatus || "pending").toLowerCase();
		const normalizedStatus = String(status || "ordered").toLowerCase();

		// validate items
		if (!Array.isArray(items) || items.length === 0) {
			throw new Error("items is required");
		}

		// normalize
		const normalized = items.map((it) => ({
			uuid: it.menu_item_uuid || it.menu_uuid || it.menuId || it.menu_id,
			qty: Number(it.qty ?? it.quantity ?? 0),
			notes: it.notes || null,
		}));

		for (const it of normalized) {
			if (!it.uuid) throw new Error("menu_item_uuid is required");
			if (!Number.isFinite(it.qty) || it.qty <= 0) {
				throw new Error(`Invalid qty for item ${it.uuid}`);
			}
		}

		// 1) SELECT items once
		const uuids = [...new Set(normalized.map((x) => x.uuid))];
		const menus = await getItemsByUuids(uuids, conn);
		const menuMap = new Map(menus.map((m) => [m.uuid, m]));

		// ensure all uuids exist
		for (const u of uuids) {
			if (!menuMap.has(u)) throw new Error(`Menu item not found: ${u}`);
		}

		// 2) compute totals + prepare detail rows
		let totalAmount = 0;

		const detailRows = normalized.map(({ uuid, qty, notes }) => {
			const menu = menuMap.get(uuid);

			const unitPrice =
				menu.discount_price !== null && Number(menu.discount_price) > 0
					? Number(menu.discount_price)
					: Number(menu.price);

			const subtotal = unitPrice * qty;
			totalAmount += subtotal;

			return {
				menuId: menu.id,
				menuName: menu.name,
				price: unitPrice,
				quantity: qty,
				subtotal,
				notes,
			};
		});

		const taxVal = Number(taxAmount) || 0;
		const serviceVal = Number(serviceAmount) || 0;
		const grandTotal = totalAmount + taxVal + serviceVal;
		const txUuid = randomUUID();
		const resolvedPaidAt = normalizedPaymentStatus === "paid" && !paidAt ? new Date() : paidAt || null;

		// 3) insert transaction
		const [txRes] = await conn.execute(
			`INSERT INTO ${TX_TABLE} (
				uuid,
				player_id,
				guest_name,
				total_amount,
				tax_amount,
				service_amount,
				grand_total,
				payment_method,
				payment_status,
				status,
				paid_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				txUuid,
				playerId,
				guestName || null,
				totalAmount,
				taxVal,
				serviceVal,
				grandTotal,
				normalizedMethod,
				normalizedPaymentStatus,
				normalizedStatus,
				resolvedPaidAt,
			],
		);
		const txId = txRes.insertId;

		// 4) bulk insert details
		const detailValues = detailRows.map((r) => [
			txId,
			r.menuId,
			r.menuName,
			r.price,
			r.quantity,
			r.subtotal,
			r.notes,
			"ordered",
		]);

		await conn.query(
			`INSERT INTO ${DETAIL_TABLE} (
				menu_transaction_id,
				menu_id,
				menu_name,
				price,
				quantity,
				subtotal,
				notes,
				status
			) VALUES ?`,
			[detailValues],
		);

		const invoiceUuid = randomUUID();
		const invoiceNumber = generateInvoiceNumber(txId);

		await conn.execute(
			`INSERT INTO ${INVOICE_TABLE} (
				uuid,
				menu_transaction_id,
				invoice_number,
				created_by,
				updated_by
			) VALUES (?, ?, ?, ?, ?)`,
			[invoiceUuid, txId, invoiceNumber, null, null],
		);

		// External payment hook (e.g., Midtrans charge). Throwing here will rollback DB inserts.
		if (typeof paymentHook === "function") {
			paymentResult = await paymentHook({
				conn,
				txId,
				txUuid,
				invoiceUuid,
				invoiceNumber,
				grandTotal,
				totalAmount,
				taxVal,
				serviceVal,
				guestName: guestName || null,
				detailRows,
				paymentMethod: normalizedMethod,
			});
			await savePaymentGateway(txId, paymentResult, conn);
		}

		await conn.commit();
		return {
			id: txId,
			uuid: txUuid,
			invoice_uuid: invoiceUuid,
			invoice_number: invoiceNumber,
			total_amount: totalAmount,
			tax_amount: taxVal,
			service_amount: serviceVal,
			grand_total: grandTotal,
			payment: paymentResult,
		};
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}
};

const getByUuid = async (uuid) => {
	const [rows] = await pool.execute(
		`SELECT * FROM ${TX_TABLE} WHERE uuid = ? AND deleted_at IS NULL LIMIT 1`,
		[uuid],
	);
	return rows[0] || null;
};

const getInvoiceByTxId = async (txId) => {
	const [rows] = await pool.execute(
		`SELECT uuid, invoice_number
		 FROM ${INVOICE_TABLE}
		 WHERE menu_transaction_id = ? AND deleted_at IS NULL
		 LIMIT 1`,
		[txId],
	);
	return rows[0] || null;
};

const getByInvoiceNumber = async (invoiceNumber) => {
	const [rows] = await pool.execute(
		`SELECT
			t.*,
			i.uuid AS invoice_uuid,
			i.invoice_number
		FROM ${TX_TABLE} t
		INNER JOIN ${INVOICE_TABLE} i ON i.menu_transaction_id = t.id
		WHERE i.invoice_number = ?
			AND t.deleted_at IS NULL
			AND i.deleted_at IS NULL
		LIMIT 1`,
		[invoiceNumber],
	);
	return rows[0] || null;
};

const updatePaymentStatusById = async (txId, { paymentStatus, status, paidAt }) => {
	const paidAtVal = paidAt || null;
	await pool.execute(
		`UPDATE ${TX_TABLE}
		 SET payment_status = ?, status = ?, paid_at = ?
		 WHERE id = ? AND deleted_at IS NULL`,
		[paymentStatus, status, paidAtVal, txId],
	);
};

const getPaymentGatewayByTxId = async (txId) => {
	await ensurePaymentGatewayTable(pool);
	const [rows] = await pool.execute(
		`SELECT *
		 FROM ${PAYMENT_GATEWAY_TABLE}
		 WHERE menu_transaction_id = ? AND provider = ? AND deleted_at IS NULL
		 LIMIT 1`,
		[txId, "midtrans"],
	);
	return rows[0] || null;
};

const updatePaymentGatewayByTxId = async (txId, paymentData = {}) => {
	await ensurePaymentGatewayTable(pool);
	const payloadJson =
		paymentData && Object.keys(paymentData).length > 0
			? JSON.stringify(paymentData)
			: null;

	await pool.execute(
		`UPDATE ${PAYMENT_GATEWAY_TABLE}
		 SET order_id = COALESCE(?, order_id),
		 	 transaction_id = COALESCE(?, transaction_id),
		 	 payment_type = COALESCE(?, payment_type),
		 	 transaction_status = COALESCE(?, transaction_status),
		 	 qr_image_url = COALESCE(?, qr_image_url),
		 	 payload_json = COALESCE(?, payload_json)
		 WHERE menu_transaction_id = ? AND provider = ? AND deleted_at IS NULL`,
		[
			paymentData.order_id || null,
			paymentData.transaction_id || null,
			paymentData.payment_type || null,
			paymentData.transaction_status || null,
			paymentData.redirect_url || paymentData.payment_page_url || null,
			payloadJson,
			txId,
			"midtrans",
		],
	);
};

const listDetailsByTxId = async (txId) => {
	const [rows] = await pool.execute(
		`SELECT
			d.*,
			mi.uuid AS menu_uuid,
			mi.image_id,
			m.storage_path AS image_path
		FROM ${DETAIL_TABLE} d
		LEFT JOIN ${ITEM_TABLE} mi ON mi.id = d.menu_id
		LEFT JOIN ${MEDIA_TABLE} m ON m.id = mi.image_id
		WHERE d.menu_transaction_id = ? AND d.deleted_at IS NULL`,
		[txId],
	);
	return rows;
};

module.exports = {
	createTransaction,
	getByUuid,
	getInvoiceByTxId,
	getByInvoiceNumber,
	updatePaymentStatusById,
	listDetailsByTxId,
	getPaymentGatewayByTxId,
	updatePaymentGatewayByTxId,
};
