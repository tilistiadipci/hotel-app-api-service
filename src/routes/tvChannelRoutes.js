const router = require("express").Router();
const controller = require("../controllers/tvChannelController");

// Requires x-api-key (app.js mounts after apiKeyAuth)
router.get("/", controller.getTvChannels);
router.get("/:uuid", controller.getTvChannelDetail);

module.exports = router;
