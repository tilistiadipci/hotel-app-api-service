const router = require("express").Router();
const controller = require("../controllers/menuItemController");

// Protected by global apiKeyAuth
router.get("/", controller.getMenuItems);
router.get("/:uuid", controller.getMenuItemDetail);

module.exports = router;
