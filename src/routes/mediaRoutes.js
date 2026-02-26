const router = require("express").Router();
const controller = require("../controllers/mediaController");
const allowAnonymous = require("../middlewares/allowAnonymous");

// Example: /api/media?type=image&path=images/movies/sample_cover.jpg
router.get("/", allowAnonymous, controller.getMedia);

module.exports = router;
