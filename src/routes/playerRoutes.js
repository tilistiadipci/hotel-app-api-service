const router = require("express").Router();
const controller = require("../controllers/playerController");

router.get("/", controller.getPlayers);
router.get("/:uuid", controller.getPlayerDetail);

module.exports = router;
