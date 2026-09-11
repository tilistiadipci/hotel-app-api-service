const router = require("express").Router();
const controller = require("../controllers/playerController");
const menuTenantController = require("../controllers/menuTenantController");

router.get("/", controller.getPlayers);
router.get("/:serial/tenants", menuTenantController.getTenantsByPlayerSerial);
router.get("/:serial", controller.getPlayerTokenBySerial);

module.exports = router;
