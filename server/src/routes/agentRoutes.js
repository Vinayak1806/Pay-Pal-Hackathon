const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

router.post('/request', agentController.handleRequest);

module.exports = router;
