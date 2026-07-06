const express = require('express');

const router = express.Router();

// Mount API routes
router.use('/', require('./api/index'));

module.exports = router;
