const router = require("express").Router();
const controller = require("../controllers/placeController");

// Protected by global apiKeyAuth
router.get("/", controller.getPlaces);
router.get("/:uuid", controller.getPlaceDetail);

module.exports = router;
