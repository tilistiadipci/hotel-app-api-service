const router = require("express").Router();
const controller = require("../controllers/websocketController");

router.post("/new-order", controller.triggerNewOrder);
router.post("/alarm-warning", controller.triggerAlarmWarning);

module.exports = router;
