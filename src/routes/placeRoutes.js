const router = require("express").Router();
const controller = require("../controllers/placeController");
const allowAnonymous = require("../middlewares/allowAnonymous");
const apiKeyAuth = require("../middlewares/authMiddleware");

// Protected by API key
router.get("/", apiKeyAuth, controller.getPlaces);
router.get("/:uuid", apiKeyAuth, controller.getPlaceDetail);

// Public QR (no API key)
router.get("/:uuid/qr", allowAnonymous, apiKeyAuth, controller.getPlaceQr);

module.exports = router;
