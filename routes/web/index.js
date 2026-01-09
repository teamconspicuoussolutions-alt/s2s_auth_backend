// s2s_auth_backend/routes/web/index.js
const express = require('express');
const router = express.Router();
const profileRoutes = require('./profile'); 
const subscriptionRoutes = require('./subscription');
const addressRoutes = require('./address');
const memberRoutes = require('./member');

router.use('/', profileRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/addresses', addressRoutes);
router.use('/members', memberRoutes);

module.exports = router;



