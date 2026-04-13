const { buildMediaUrl } = require("./common");

const IMAGE_DETAIL_KEY_PATTERN = /^image_id(?:_\d+)?$/;
const MEDIA_ID_PATTERN = /^\d+$/;
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const ARRAY_IMAGE_DETAIL_KEYS = new Set(["image_id_1", "image_id_2"]);

const isImageDetailKey = (key) =>
	IMAGE_DETAIL_KEY_PATTERN.test(String(key || "").trim());

const shouldWrapImageDetailValueInArray = (key) =>
	ARRAY_IMAGE_DETAIL_KEYS.has(String(key || "").trim());

const parseMaybeJson = (value) => {
	if (typeof value !== "string") {
		return value;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return value;
	}

	try {
		return JSON.parse(trimmed);
	} catch {
		return value;
	}
};

const normalizeMediaId = (value) => {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return String(value);
	}

	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return MEDIA_ID_PATTERN.test(trimmed) ? trimmed : null;
};

const collectImageDetailMediaIds = (
	rows,
	{ keyField = "key", valueField = "value" } = {},
) => {
	const mediaIds = new Set();

	rows.forEach((row) => {
		if (!isImageDetailKey(row[keyField])) {
			return;
		}

		const parsedValue = parseMaybeJson(row[valueField]);
		const items = Array.isArray(parsedValue) ? parsedValue : [parsedValue];

		items.forEach((item) => {
			const mediaId = normalizeMediaId(item);
			if (mediaId) {
				mediaIds.add(mediaId);
			}
		});
	});

	return Array.from(mediaIds);
};

const mapImageDetailValue = (key, value, mediaPathById = {}) => {
	const parsedValue = parseMaybeJson(value);

	const mapItem = (item) => {
		if (typeof item === "string" && ABSOLUTE_URL_PATTERN.test(item.trim())) {
			return item;
		}

		const mediaId = normalizeMediaId(item);
		if (!mediaId) {
			return item;
		}

		const storagePath = mediaPathById[mediaId];
		return storagePath ? buildMediaUrl("image", storagePath) : item;
	};

	if (Array.isArray(parsedValue)) {
		return parsedValue.map(mapItem);
	}

	const mappedValue = mapItem(parsedValue);
	return shouldWrapImageDetailValueInArray(key)
		? [mappedValue]
		: mappedValue;
};

const buildMediaPathById = (mediaRows = []) =>
	mediaRows.reduce((acc, media) => {
		acc[String(media.id)] = media.storage_path;
		return acc;
	}, {});

module.exports = {
	buildMediaPathById,
	collectImageDetailMediaIds,
	isImageDetailKey,
	mapImageDetailValue,
	shouldWrapImageDetailValueInArray,
};
