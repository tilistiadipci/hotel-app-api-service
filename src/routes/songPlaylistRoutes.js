const router = require("express").Router();
const controller = require("../controllers/songPlaylistController");

router.get("/", controller.getSongPlaylists);
router.get("/:uuid", controller.getSongPlaylistDetail);

module.exports = router;
