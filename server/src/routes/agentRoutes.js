const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

router.post('/request', agentController.handleRequest);
router.post('/chat', agentController.handleChat);

module.exports = router;
