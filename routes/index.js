const express = require('express');

const router = express.Router();
const appController = require('../controllers/AppController');

router.get('/status', appController.getStatus);
router.get('/stats', appController.getStats);

module.exports = router;
