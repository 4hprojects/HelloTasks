const express = require('express');
const router = express.Router();
const { isAuthenticated, checkRole } = require('../middleware/authMiddleware');
const { requireProjectMember } = require('../middleware/projectMiddleware');
const { getKanban } = require('../controllers/taskController');
const {
  listProjects, getNewProject, createProject,
  getProject, getEditProject, updateProject, deleteProject,
  addMember, removeMember, inviteMember
} = require('../controllers/projectController');

// super_admin/system_admin are handled by the isSystemAdmin fallback in checkRole.
// project_lead normalises to manager; owner is the new canonical top workspace role.
const canCreate = checkRole('super_admin', 'project_lead', 'owner', 'manager');

router.get('/', isAuthenticated, listProjects);
router.get('/new', isAuthenticated, canCreate, getNewProject);
router.post('/new', isAuthenticated, canCreate, createProject);
router.get('/:id', isAuthenticated, getProject);
router.get('/:id/edit', isAuthenticated, getEditProject);
router.post('/:id/edit', isAuthenticated, updateProject);
router.post('/:id/delete', isAuthenticated, deleteProject);
router.post('/:id/members', isAuthenticated, addMember);
router.post('/:id/members/invite', isAuthenticated, inviteMember);
router.post('/:id/members/remove', isAuthenticated, removeMember);
router.get('/:id/kanban', isAuthenticated, requireProjectMember, getKanban);

module.exports = router;
