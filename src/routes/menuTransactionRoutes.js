const router = require("express").Router();
const controller = require("../controllers/menuTransactionController");

// Protected by global apiKeyAuth
router.post("/", controller.createTransaction);
router.post("/notifications/midtrans", controller.handleMidtransNotification);
router.get("/payment-finish", controller.getTransactionPaymentFinish);
router.get("/:uuid/payment-page", controller.getTransactionPaymentPage);
router.get("/:uuid/payment-finish", controller.getTransactionPaymentFinishByUuid);
router.get("/:uuid/qris-image", controller.getTransactionQrisImage);
router.get("/:uuid", controller.getTransactionDetail);

module.exports = router;
