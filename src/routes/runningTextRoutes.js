const router = require("express").Router();
const controller = require("../controllers/runningTextController");

// Protected by global apiKeyAuth
router.get("/", controller.getRunningTexts);

module.exports = router;
