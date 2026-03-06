const router = require("express").Router();
const controller = require("../controllers/menuTransactionController");

// Protected by global apiKeyAuth
router.post("/", controller.createTransaction);
router.get("/:uuid", controller.getTransactionDetail);

module.exports = router;
