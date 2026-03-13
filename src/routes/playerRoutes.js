const router = require("express").Router();
const controller = require("../controllers/playerController");

router.get("/", controller.getPlayers);
router.get("/:serial", controller.getPlayerTokenBySerial);

module.exports = router;
