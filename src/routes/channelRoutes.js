const router = require("express").Router();
const controller = require("../controllers/channelController");
const auth = require("../middlewares/authMiddleware");

router.get("/", auth, controller.getChannels);
router.get("/:id/stream", auth, controller.getStream);

module.exports = router;