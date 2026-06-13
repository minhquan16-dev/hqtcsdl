const express = require('express');
const analyticsRoutes = require('./analyticsRoutes');
const chatRoutes = require('./chatRoutes');
const systemRoutes = require('./systemRoutes');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/health', healthController.getHealth);
router.use('/', chatRoutes);
router.use('/', systemRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
