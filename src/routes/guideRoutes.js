const router = require("express").Router();
const controller = require("../controllers/guideController");

// Protected by global apiKeyAuth
router.get("/", controller.getGuides);
router.get("/:uuid", controller.getGuideDetail);

module.exports = router;
