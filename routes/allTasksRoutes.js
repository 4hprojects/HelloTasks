const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { listAllTasks } = require('../controllers/taskController');

router.get('/', isAuthenticated, listAllTasks);

module.exports = router;
