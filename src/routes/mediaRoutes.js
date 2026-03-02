const router = require("express").Router();
const controller = require("../controllers/mediaController");
const allowAnonymous = require("../middlewares/allowAnonymous");
const apiKeyAuth = require("../middlewares/authMiddleware");

// Example: /api/media?type=image&path=images/movies/sample_cover.jpg
// Public media fetch (skips API key)
router.get("/", allowAnonymous, apiKeyAuth, controller.getMedia);

// Protected listing requires x-api-key
router.get("/all", apiKeyAuth, controller.getAllMedia);

module.exports = router;
