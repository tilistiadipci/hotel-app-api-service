// Uniform API response helper (collection-based format)
// Usage: respond(res, 200, "success", data, "optional title");
const respond = (res, statusCode, msg, data = null, title = null) => {
	const success = statusCode >= 200 && statusCode < 300;
	const collection = Array.isArray(data)
		? data
		: data !== null && data !== undefined
			? [data]
			: [];

	return res.status(statusCode).json({
		status: success ? "success" : "error",
		status_code: statusCode,
		title: title || msg,
		msg,
		collection,
	});
};

module.exports = { respond };
