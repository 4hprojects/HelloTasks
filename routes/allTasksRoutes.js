const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { listAllTasks, getMyTasks } = require('../controllers/taskController');

router.get('/my-tasks', isAuthenticated, getMyTasks);
router.get('/', isAuthenticated, listAllTasks);

module.exports = router;
