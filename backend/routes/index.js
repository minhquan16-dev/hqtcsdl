const express = require('express');
const analyticsRoutes = require('./analyticsRoutes');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/health', healthController.getHealth);
router.use('/analytics', analyticsRoutes);

module.exports = router;
