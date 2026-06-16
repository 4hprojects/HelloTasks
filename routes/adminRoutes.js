const express = require('express');
const router = express.Router();
const { isAuthenticated, checkRole } = require('../middleware/authMiddleware');
const { getSettings, postSettings, sendWeeklyReport } = require('../controllers/adminController');

const adminOnly = checkRole('super_admin');

router.get('/settings', isAuthenticated, adminOnly, getSettings);
router.post('/settings', isAuthenticated, adminOnly, postSettings);
router.post('/weekly-report', isAuthenticated, checkRole('super_admin', 'project_lead'), sendWeeklyReport);

module.exports = router;
