const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { listNotifications, markRead, markAllRead } = require('../controllers/notificationController');

router.get('/', isAuthenticated, listNotifications);
router.post('/:id/read', isAuthenticated, markRead);
router.post('/read-all', isAuthenticated, markAllRead);

module.exports = router;
