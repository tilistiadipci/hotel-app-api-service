const router = require("express").Router();
const controller = require("../controllers/guideCategoryController");

// Protected by global apiKeyAuth
router.get("/", controller.getCategories);
router.get("/:uuid/guides", controller.getGuidesByCategory);

module.exports = router;
