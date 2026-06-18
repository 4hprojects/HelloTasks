const express = require('express');
const router = express.Router();
const { isAuthenticated, checkRole } = require('../middleware/authMiddleware');
const { getSettings, postSettings, getWeeklyReportPreview, sendWeeklyReport } = require('../controllers/adminController');

// super_admin normalises to system_admin; isSystemAdmin fallback also covers both.
const adminOnly = checkRole('super_admin', 'system_admin');
const reportAccess = checkRole('super_admin', 'system_admin', 'project_lead', 'owner', 'manager');

router.get('/settings', isAuthenticated, adminOnly, getSettings);
router.post('/settings', isAuthenticated, adminOnly, postSettings);
router.get('/weekly-report/preview', isAuthenticated, reportAccess, getWeeklyReportPreview);
router.post('/weekly-report', isAuthenticated, reportAccess, sendWeeklyReport);

module.exports = router;
