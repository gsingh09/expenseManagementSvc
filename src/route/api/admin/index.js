const express = require('express');

const router = express.Router();

// TODO: Mount admin.route.js
router.use('/', require('./admin.route'));

module.exports = router;
