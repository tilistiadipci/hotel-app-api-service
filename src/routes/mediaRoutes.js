const router = require("express").Router();
const controller = require("../controllers/mediaController");
const apiKeyAuth = require("../middlewares/authMiddleware");

const optionalApiKeyAuth = (req, res, next) => {
	const hasPlayerCredentials =
		req.headers["x-api-key"] || req.headers["x-player-license"];

	return hasPlayerCredentials ? apiKeyAuth(req, res, next) : next();
};

// Example: /api/media?type=image&path=images/movies/sample_cover.jpg
// All media resolves from the shared MEDIA_STORAGE_PATH root.
router.get("/", optionalApiKeyAuth, controller.getMedia);

// Protected listing requires x-api-key
router.get("/all", apiKeyAuth, controller.getAllMedia);

module.exports = router;
