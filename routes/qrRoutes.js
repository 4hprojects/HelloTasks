const express = require('express');
const { showCreator, showHelp } = require('../controllers/qrController');

const router = express.Router();
router.get('/', showCreator);
router.get('/help', showHelp);

module.exports = router;
