// s2s_auth_backend/routes/web/index.js
const express = require('express');
const router = express.Router();
const profileRoutes = require('./profile'); 
const subscriptionRoutes = require('./subscription');

router.use('/', profileRoutes);
router.use('/subscription', subscriptionRoutes);

module.exports = router;


