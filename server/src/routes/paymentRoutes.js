const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/:orderId/capture', paymentController.capturePayment);
router.get('/:orderId/status', paymentController.getPaymentStatus);
router.get('/cancel-status', paymentController.handleCancelStatus);

module.exports = router;
