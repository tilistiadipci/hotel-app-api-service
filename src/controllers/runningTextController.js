const RunningText = require("../models/runningTextModel");
const { respondObject, respondPagination } = require("../helpers/response");

// GET /api/running-texts?page=1&limit=20
exports.getRunningTexts = async (req, res) => {
	try {
		const page = Number.parseInt(req.query.page, 10) || 1;
		const limit = Number.parseInt(req.query.limit, 10) || 20;
		const offset = Math.max((page - 1) * limit, 0);

		const result = await RunningText.list({ offset, limit });
		return respondPagination(
			res,
			200,
			"success",
			result.items,
			{
				page,
				offset,
				limit,
				total: Number(result.total) || 0,
			},
			"Running text list",
		);
	} catch (err) {
		console.error("getRunningTexts error:", err.message);
		return respondObject(res, 500, "Failed to fetch running texts", null);
	}
};
