// Shared helper functions

const buildMediaUrl = (type, path) =>
	path ? `/api/media?type=${encodeURIComponent(type)}&path=${encodeURIComponent(path)}` : null;

const parseActiveFlag = (raw, defaultVal = true) => {
	if (raw === undefined) return defaultVal;
	const val = String(raw).toLowerCase();
	if (["1", "true", "yes", "on"].includes(val)) return true;
	if (["0", "false", "no", "off"].includes(val)) return false;
	return defaultVal;
};

module.exports = { buildMediaUrl, parseActiveFlag };
