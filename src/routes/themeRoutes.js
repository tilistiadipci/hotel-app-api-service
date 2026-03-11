const router = require("express").Router();
const controller = require("../controllers/themeController");

router.get("/", controller.getThemes);
router.get("/:uuid", controller.getThemeDetail);

module.exports = router;
