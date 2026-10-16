const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');

router.post('/', dealController.createDeal);
router.get('/', dealController.getDeals);
router.get('/:id', dealController.getDeal);
router.post('/:id/approve', dealController.approveDeal);
router.post('/:id/checkout', dealController.checkoutDeal);

module.exports = router;
