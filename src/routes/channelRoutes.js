const router = require("express").Router();
const controller = require("../controllers/channelController");

router.get("/", controller.getChannels);
router.get("/:id/stream", controller.getStream);

module.exports = router;
