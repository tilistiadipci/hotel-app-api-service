const router = require("express").Router();
const controller = require("../controllers/playerController");

router.get("/", controller.getPlayers);

module.exports = router;
