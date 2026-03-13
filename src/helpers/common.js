// Shared helper functions

const buildMediaUrl = (type, path) =>
		path ? `${process.env.APP_URL}/api/media?type=${encodeURIComponent(type)}&path=${encodeURIComponent(path)}` : null;

// Build a QR code image URL (Google Chart API) from a target URL
const buildQrUrl = (targetUrl, size = 300) =>
	targetUrl
		? `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(
				targetUrl,
			)}`
		: null;

const parseActiveFlag = (raw, defaultVal = true) => {
	if (raw === undefined) return defaultVal;
	const val = String(raw).toLowerCase();
	if (["1", "true", "yes", "on"].includes(val)) return true;
	if (["0", "false", "no", "off"].includes(val)) return false;
	return defaultVal;
};

module.exports = { buildMediaUrl, buildQrUrl, parseActiveFlag };
