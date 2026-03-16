const Place = require("../models/placeModel");
const { respond, respondObject } = require("../helpers/response");
const { buildMediaUrl, parseActiveFlag } = require("../helpers/common");
const QRCode = require("qrcode");

const mapPlace = (row, { includeQr = false } = {}) => {
	const mapped = {
		...row,
		url_image: buildMediaUrl("image", row.image_path),
		category: row.category_uuid
			? { uuid: row.category_uuid, name: row.category_name }
			: null,
	};

	if (includeQr) {
		mapped.qr_code_image = `${process.env.APP_URL}/api/places/${row.uuid}/qr`;
	}

	return mapped;
};

// GET /api/places?active=1&category_uuid=...&q=...
exports.getPlaces = async (req, res) => {
	try {
		const filters = {
			isActive: parseActiveFlag(req.query.active, true),
			categoryUuid: req.query.category_uuid,
			q: req.query.q || req.query.search || req.query.name || undefined,
		};

		const places = await Place.list(filters);
		return respond(res, 200, "success", places.map((p) => mapPlace(p, { includeQr: true })), "Place list");
	} catch (err) {
		console.error("getPlaces error:", err.message);
		return respond(res, 500, "Failed to fetch places", []);
	}
};

// GET /api/places/:uuid
exports.getPlaceDetail = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respondObject(res, 400, "uuid is required", null);

		const place = await Place.getByUuid(uuid);
		if (!place) return respondObject(res, 404, "Place not found", null);

		return respondObject(
			res,
			200,
			"success",
			mapPlace(place, { includeQr: true }),
			"Place detail",
		);
	} catch (err) {
		console.error("getPlaceDetail error:", err.message);
		return respondObject(res, 500, "Failed to fetch place detail", null);
	}
};

// GET /api/places/:uuid/qr  -> PNG stream
exports.getPlaceQr = async (req, res) => {
	try {
		const { uuid } = req.params;
		if (!uuid) return respond(res, 400, "uuid is required", []);

		const place = await Place.getByUuid(uuid);
		if (!place) return respond(res, 404, "Place not found", []);

		if (!place.google_maps_url) {
			return respond(res, 400, "google_maps_url is empty", []);
		}

		const pngBuffer = await QRCode.toBuffer(place.google_maps_url, {
			type: "png",
			errorCorrectionLevel: "H",
			scale: 8,
			margin: 1,
		});

		res.type("image/png");
		return res.send(pngBuffer);
	} catch (err) {
		console.error("getPlaceQr error:", err.message);
		return respond(res, 500, "Failed to generate QR code", []);
	}
};

exports.mapPlace = mapPlace;
