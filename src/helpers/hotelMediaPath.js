const path = require("path");

const resolveHotelMediaRoot = (baseRoot, mediaRoot) => {
	if (!baseRoot || !mediaRoot) return null;

	const folder = String(mediaRoot).trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
	if (!folder || folder.includes("..") || /^[a-zA-Z]:/.test(folder)) return null;

	const resolvedBase = path.resolve(baseRoot);
	const resolvedHotelRoot = path.resolve(resolvedBase, folder);
	const relative = path.relative(resolvedBase, resolvedHotelRoot);

	if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;

	return resolvedHotelRoot;
};

module.exports = { resolveHotelMediaRoot };
