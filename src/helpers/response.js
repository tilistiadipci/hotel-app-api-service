// Uniform API response helpers
// respond -> collection as array (default)
// respondObject -> collection as single object
const respond = (res, statusCode, msg, data = null, title = null) => {
	const success = statusCode >= 200 && statusCode < 300;
	const collection = Array.isArray(data)
		? data
		: data !== null && data !== undefined
			? [data]
			: [];

	return res.status(statusCode).json({
		status: success ? "success" : "fail",
		status_code: statusCode,
		title: title || msg,
		msg,
		collection,
	});
};

const respondObject = (res, statusCode, msg, obj = null, title = null) => {
	const success = statusCode >= 200 && statusCode < 300;
	return res.status(statusCode).json({
		status: success ? "success" : "fail",
		status_code: statusCode,
		title: title || msg,
		msg,
		collection: obj === undefined ? null : obj,
	});
};

const respondPagination = (
	res,
	statusCode,
	msg,
	obj = null,
	pagination = null,
	title = null,
) => {
	const success = statusCode >= 200 && statusCode < 300;
	return res.status(statusCode).json({
		status: success ? "success" : "fail",
		status_code: statusCode,
		title: title || msg,
		msg,
		collection: obj === undefined ? null : obj,
		pagination,
	});
};

module.exports = { respond, respondObject, respondPagination };
