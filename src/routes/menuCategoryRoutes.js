const router = require("express").Router();
const controller = require("../controllers/menuCategoryController");

// Protected by global apiKeyAuth
router.get("/", controller.getCategories);
router.get("/:uuid/items", controller.getItemsByCategory);

module.exports = router;
