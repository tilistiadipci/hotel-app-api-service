const router = require("express").Router();
const controller = require("../controllers/weatherController");

// Protected by global apiKeyAuth
// GET /api/weather?lat=-3.8&lon=102.2666
router.get("/", controller.getWeather);

module.exports = router;
