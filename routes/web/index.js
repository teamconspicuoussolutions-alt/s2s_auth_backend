// s2s_auth_backend/routes/web/index.js
const express = require('express');
const router = express.Router();
const profileRoutes = require('./profile'); 

router.use('/', profileRoutes);


module.exports = router;

