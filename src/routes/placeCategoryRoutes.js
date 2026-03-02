const router = require("express").Router();
const controller = require("../controllers/placeCategoryController");

// Protected by global apiKeyAuth
router.get("/", controller.getCategories);
router.get("/:uuid/places", controller.getPlacesByCategory);

module.exports = router;
