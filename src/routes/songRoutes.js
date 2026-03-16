const router = require("express").Router();
const controller = require("../controllers/songController");

// Protected by global apiKeyAuth (mounted in app.js)
router.get("/", controller.getSongs);
router.get("/albums", controller.getAlbumList);
router.get("/albums/:album_uuid", controller.getSongsByAlbumUuid);
router.get("/:uuid", controller.getSongDetail);

module.exports = router;
