const Project = require('../models/Project');
const Task = require('../models/Task');
const { isSystemAdmin } = require('../utils/roles');

async function requireProjectMember(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId || req.params.id)
      .populate('members.user', 'fullName email globalRole accountStatus');
    if (!project) return res.status(404).render('errors/404', { title: '404 Not Found' });

    const sysAdmin = isSystemAdmin(req.user);
    const memberEntry = project.members.find(
      m => m.user._id.toString() === req.user._id.toString()
    );

    if (!sysAdmin && !memberEntry) {
      return res.status(403).render('errors/403', { title: '403 Forbidden' });
    }

    req.project = project;
    req.projectRole = sysAdmin ? 'system_admin' : memberEntry.role;
    next();
  } catch (err) {
    next(err);
  }
}

async function loadTask(req, res, next) {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, project: req.project._id })
      .populate('assignee', 'fullName email')
      .populate('createdBy', 'fullName email')
      .populate('statusHistory.changedBy', 'fullName')
      .populate('qaReview.reviewedBy', 'fullName')
      .populate('leadApproval.approvedBy', 'fullName');

    if (!task) return res.status(404).render('errors/404', { title: '404 Not Found' });
    req.task = task;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireProjectMember, loadTask };
