const express = require('express');
const router = express.Router();
const { isAuthenticated, checkRole } = require('../middleware/authMiddleware');
const { getSettings, postSettings, sendWeeklyReport } = require('../controllers/adminController');

// super_admin normalises to system_admin; isSystemAdmin fallback also covers both.
const adminOnly = checkRole('super_admin', 'system_admin');

router.get('/settings', isAuthenticated, adminOnly, getSettings);
router.post('/settings', isAuthenticated, adminOnly, postSettings);
router.post('/weekly-report', isAuthenticated, checkRole('super_admin', 'system_admin', 'project_lead', 'owner', 'manager'), sendWeeklyReport);

module.exports = router;
