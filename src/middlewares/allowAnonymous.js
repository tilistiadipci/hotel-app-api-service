// Marks a request to bypass API key auth in authMiddleware.
module.exports = (_req, _res, next) => {
	_req.allowAnonymous = true;
	next();
};
