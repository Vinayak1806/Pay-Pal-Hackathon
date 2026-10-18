const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

router.get('/verify', auditController.verifyLedgerIntegrity);
router.get('/', auditController.getAuditLogs);

module.exports = router;
