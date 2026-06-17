const Project = require('../models/Project');
const Task = require('../models/Task');

async function getDashboard(req, res) {
  const userId = req.user._id;
  const isSuperAdmin = req.user.globalRole === 'super_admin';

  // Projects accessible to this user
  const projectFilter = isSuperAdmin ? {} : { 'members.user': userId };
  const projects = await Project.find(projectFilter).select('_id name').lean();
  const projectIds = projects.map(p => p._id);

  // Base task filter — only tasks in accessible projects, not archived
  const baseFilter = { project: { $in: projectIds }, status: { $ne: 'archived' } };

  const now = new Date();
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalProjects,
    myTasks,
    dueSoon,
    readyForReview,
    blocked,
    completedRecently,
    recentTasks
  ] = await Promise.all([
    Project.countDocuments(projectFilter),
    Task.countDocuments({ ...baseFilter, assignee: userId }),
    Task.countDocuments({ ...baseFilter, dueDate: { $lte: sevenDaysAhead, $gte: now }, status: { $nin: ['archived', 'completed'] } }),
    Task.countDocuments({ ...baseFilter, status: 'ready_for_review' }),
    Task.countDocuments({ ...baseFilter, status: 'blocked' }),
    Task.countDocuments({ ...baseFilter, status: 'completed', updatedAt: { $gte: thirtyDaysAgo } }),
    Task.find({ ...baseFilter, assignee: userId })
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean()
  ]);

  const STATUS_LABELS = {
    draft: 'Draft', assigned: 'Assigned', in_progress: 'In Progress',
    ready_for_review: 'Ready for Review', returned_for_refinement: 'Returned',
    approved: 'Approved', completed: 'Completed', blocked: 'Blocked'
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = req.user.fullName.split(' ')[0];

  res.render('dashboard/index', {
    title: 'Dashboard',
    stats: { totalProjects, myTasks, dueSoon, readyForReview, blocked, completedRecently },
    recentTasks,
    statusLabels: STATUS_LABELS,
    greeting,
    firstName
  });
}

module.exports = { getDashboard };
