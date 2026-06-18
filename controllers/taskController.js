const Task = require('../models/Task');
const User = require('../models/User');
const Comment = require('../models/Comment');
const FileRecord = require('../models/FileRecord');
const Project = require('../models/Project');
const { formatSize } = require('./fileController');
const { notify, notifyMany } = require('../utils/notify');
const { sendEmail } = require('../services/emailService');

function taskEmailHtml(recipientName, message, taskPath) {
  const url = `${process.env.APP_URL || 'http://localhost:3000'}${taskPath}`;
  return `<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0F172A;"><p>Hi ${recipientName},</p><p>${message}</p><p style="margin:1.5rem 0;"><a href="${url}" style="display:inline-block;padding:10px 24px;background:#1E40AF;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View Task</a></p><p style="color:#64748B;font-size:0.875rem;">— HelloTasks</p></div>`;
}

async function sendTaskEmail(to, subject, html) {
  try { await sendEmail(to, subject, html); }
  catch (err) { console.error('Task email failed:', err.message); }
}

// Status transitions per project role (canonical + legacy aliases)
const _managerTransitions = {
  draft: ['assigned', 'in_progress', 'blocked'],
  assigned: ['in_progress', 'draft', 'blocked'],
  in_progress: ['ready_for_review', 'assigned', 'blocked'],
  ready_for_review: ['returned_for_refinement', 'approved', 'blocked'],
  returned_for_refinement: ['in_progress', 'ready_for_review'],
  approved: ['completed'],
  completed: [],
  blocked: ['in_progress', 'assigned'],
  archived: []
};
const _memberTransitions = {
  draft: ['in_progress'],
  assigned: ['in_progress'],
  in_progress: ['ready_for_review', 'blocked'],
  ready_for_review: [],
  returned_for_refinement: ['in_progress', 'ready_for_review'],
  approved: [],
  completed: [],
  blocked: ['in_progress'],
  archived: []
};
const TRANSITIONS = {
  // Canonical
  system_admin:    _managerTransitions,
  owner:           _managerTransitions,
  manager:         _managerTransitions,
  quality_manager: {
    draft: [], assigned: [], in_progress: [],
    ready_for_review: ['returned_for_refinement', 'approved'],
    returned_for_refinement: [], approved: [], completed: [], blocked: [], archived: []
  },
  member:  _memberTransitions,
  viewer:  { draft: [], assigned: [], in_progress: [], ready_for_review: [], returned_for_refinement: [], approved: [], completed: [], blocked: [], archived: [] },
  // Legacy aliases
  super_admin:  _managerTransitions,
  project_lead: _managerTransitions,
  developer:    _memberTransitions,
};

const STATUS_LABELS = {
  draft: 'Draft',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  ready_for_review: 'Ready for Review',
  returned_for_refinement: 'Returned for Refinement',
  approved: 'Approved',
  completed: 'Completed',
  blocked: 'Blocked',
  archived: 'Archived'
};

function getAvailableTransitions(projectRole, currentStatus) {
  return (TRANSITIONS[projectRole] || {})[currentStatus] || [];
}

function validateExternalUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// GET /projects/:projectId/tasks/new
async function getNewTask(req, res) {
  const members = req.project.members.filter(m => m.role !== 'viewer');
  const assignableUsers = await User.find({
    _id: { $in: members.map(m => m.user._id || m.user) },
    accountStatus: 'active'
  }).select('fullName email').lean();

  res.render('tasks/new', {
    title: 'New Task',
    project: req.project,
    assignableUsers,
    errors: []
  });
}

// POST /projects/:projectId/tasks
async function createTask(req, res) {
  const { title, description, assigneeId, priority, dueDate, isConfidential,
    requiresLeadApproval, externalUrl, checklistItems } = req.body;
  const errors = [];

  if (!title || !title.trim()) errors.push('Task title is required.');
  if (externalUrl && !validateExternalUrl(externalUrl)) errors.push('External URL must start with http:// or https://');

  if (errors.length) {
    const members = req.project.members.filter(m => m.role !== 'viewer');
    const assignableUsers = await User.find({
      _id: { $in: members.map(m => m.user._id || m.user) },
      accountStatus: 'active'
    }).select('fullName email').lean();

    return res.render('tasks/new', {
      title: 'New Task', project: req.project,
      assignableUsers, errors, body: req.body
    });
  }

  let initialStatus = 'draft';
  if (assigneeId) initialStatus = 'assigned';

  const checklist = [];
  if (checklistItems) {
    const items = Array.isArray(checklistItems) ? checklistItems : [checklistItems];
    items.forEach(item => { if (item && item.trim()) checklist.push({ item: item.trim() }); });
  }

  const task = await Task.create({
    title: title.trim(),
    description: description ? description.trim() : '',
    project: req.project._id,
    assignee: assigneeId || null,
    createdBy: req.user._id,
    status: initialStatus,
    priority: priority || 'medium',
    dueDate: dueDate || null,
    isConfidential: isConfidential === 'on',
    requiresLeadApproval: requiresLeadApproval === 'on',
    externalUrl: externalUrl ? externalUrl.trim() : '',
    checklist,
    statusHistory: [{ status: initialStatus, changedBy: req.user._id }]
  });

  if (assigneeId && assigneeId !== req.user._id.toString()) {
    const taskPath = `/projects/${req.project._id}/tasks/${task._id}`;
    await notify(assigneeId, 'task_assigned',
      `You have been assigned to "${task.title}" in ${req.project.name}.`,
      { link: taskPath, projectId: req.project._id, taskId: task._id });
    const assignee = await User.findById(assigneeId).select('email fullName').lean();
    if (assignee) {
      await sendTaskEmail(
        assignee.email,
        `You've been assigned to "${task.title}"`,
        taskEmailHtml(assignee.fullName, `You have been assigned to <strong>${task.title}</strong> in <strong>${req.project.name}</strong>.`, taskPath)
      );
    }
  }

  req.session.flash = { success: `Task "${task.title}" created.` };
  res.redirect(`/projects/${req.project._id}/tasks/${task._id}`);
}

// GET /projects/:projectId/tasks/:taskId
async function getTask(req, res) {
  const task = req.task;
  const canSeeContent = task.isVisibleTo(req.user) ||
    ['system_admin','super_admin','owner','manager','project_lead','quality_manager'].includes(req.projectRole);

  if (!canSeeContent) {
    return res.render('tasks/locked', { title: 'Confidential Task', project: req.project });
  }

  const canEdit = ['system_admin','super_admin','owner','manager','project_lead'].includes(req.projectRole) ||
    (['developer','member'].includes(req.projectRole) && task.assignee &&
      task.assignee._id.toString() === req.user._id.toString());

  const availableTransitions = getAvailableTransitions(req.projectRole, task.status);

  const [comments, files] = await Promise.all([
    Comment.find({ task: task._id }).populate('author', 'fullName').sort({ createdAt: 1 }).lean(),
    FileRecord.find({ task: task._id }).populate('uploadedBy', 'fullName').sort({ createdAt: -1 }).lean()
  ]);

  res.render('tasks/show', {
    title: task.title,
    project: req.project,
    task,
    canEdit,
    availableTransitions,
    statusLabels: STATUS_LABELS,
    projectRole: req.projectRole,
    comments,
    files,
    formatSize
  });
}

// GET /projects/:projectId/tasks/:taskId/edit
async function getEditTask(req, res) {
  const task = req.task;
  const canEdit = ['system_admin','super_admin','owner','manager','project_lead'].includes(req.projectRole) ||
    (['developer','member'].includes(req.projectRole) && task.assignee &&
      task.assignee._id.toString() === req.user._id.toString());

  if (!canEdit) return res.status(403).render('errors/403', { title: '403 Forbidden' });

  const members = req.project.members.filter(m => m.role !== 'viewer');
  const assignableUsers = await User.find({
    _id: { $in: members.map(m => m.user._id || m.user) },
    accountStatus: 'active'
  }).select('fullName email').lean();

  res.render('tasks/edit', {
    title: `Edit — ${task.title}`,
    project: req.project,
    task,
    assignableUsers,
    errors: []
  });
}

// POST /projects/:projectId/tasks/:taskId/edit
async function updateTask(req, res) {
  const task = req.task;
  const canEdit = ['system_admin','super_admin','owner','manager','project_lead'].includes(req.projectRole) ||
    (['developer','member'].includes(req.projectRole) && task.assignee &&
      task.assignee._id.toString() === req.user._id.toString());

  if (!canEdit) return res.status(403).render('errors/403', { title: '403 Forbidden' });

  const { title, description, assigneeId, priority, dueDate, isConfidential,
    requiresLeadApproval, externalUrl, checklistItems } = req.body;
  const errors = [];

  if (!title || !title.trim()) errors.push('Task title is required.');
  if (externalUrl && !validateExternalUrl(externalUrl)) errors.push('External URL must start with http:// or https://');

  if (errors.length) {
    const members = req.project.members.filter(m => m.role !== 'viewer');
    const assignableUsers = await User.find({
      _id: { $in: members.map(m => m.user._id || m.user) },
      accountStatus: 'active'
    }).select('fullName email').lean();
    return res.render('tasks/edit', {
      title: `Edit — ${task.title}`, project: req.project,
      task: { ...task.toObject(), ...req.body }, assignableUsers, errors
    });
  }

  const checklist = [];
  if (checklistItems) {
    const items = Array.isArray(checklistItems) ? checklistItems : [checklistItems];
    items.forEach(item => { if (item && item.trim()) checklist.push({ item: item.trim() }); });
  }

  const prevAssigneeId = task.assignee ? (task.assignee._id || task.assignee).toString() : null;

  task.title = title.trim();
  task.description = description ? description.trim() : '';
  task.assignee = assigneeId || null;
  task.priority = priority || task.priority;
  task.dueDate = dueDate || null;
  task.isConfidential = isConfidential === 'on';
  task.requiresLeadApproval = requiresLeadApproval === 'on';
  task.externalUrl = externalUrl ? externalUrl.trim() : '';
  if (checklist.length > 0) task.checklist = checklist;

  if (assigneeId && task.status === 'draft') {
    task.status = 'assigned';
    task.statusHistory.push({ status: 'assigned', changedBy: req.user._id });
  }

  await task.save();

  const newAssigneeId = assigneeId ? assigneeId.toString() : null;
  if (newAssigneeId && newAssigneeId !== prevAssigneeId && newAssigneeId !== req.user._id.toString()) {
    const taskPath = `/projects/${req.project._id}/tasks/${task._id}`;
    await notify(newAssigneeId, 'task_assigned', `You were assigned to "${task.title}".`,
      { link: taskPath, projectId: req.project._id, taskId: task._id });
    const assignee = await User.findById(newAssigneeId).select('email fullName').lean();
    if (assignee) {
      await sendTaskEmail(
        assignee.email,
        `You've been assigned to "${task.title}"`,
        taskEmailHtml(assignee.fullName, `You have been assigned to <strong>${task.title}</strong> in <strong>${req.project.name}</strong>.`, taskPath)
      );
    }
  }

  req.session.flash = { success: 'Task updated.' };
  res.redirect(`/projects/${req.project._id}/tasks/${task._id}`);
}

// POST /projects/:projectId/tasks/:taskId/status
async function updateStatus(req, res) {
  const task = req.task;
  const { newStatus, note } = req.body;

  const allowed = getAvailableTransitions(req.projectRole, task.status);
  if (!allowed.includes(newStatus)) {
    req.session.flash = { error: 'That status change is not allowed.' };
    return res.redirect(`/projects/${req.project._id}/tasks/${task._id}`);
  }

  // Record QA review when QM approves or returns (use newStatus before auto-complete conversion)
  if (task.status === 'ready_for_review' &&
    ['approved', 'returned_for_refinement'].includes(newStatus) &&
    ['quality_manager','system_admin','super_admin','owner','manager','project_lead'].includes(req.projectRole)) {
    task.qaReview = {
      reviewedBy: req.user._id,
      decision: newStatus === 'returned_for_refinement' ? 'returned' : 'approved',
      note: note || '',
      reviewedAt: new Date()
    };
  }

  // QM approves: respect requiresLeadApproval
  let finalStatus = newStatus;
  if (newStatus === 'approved' && !task.requiresLeadApproval &&
    ['quality_manager','system_admin','super_admin','owner','manager','project_lead'].includes(req.projectRole)) {
    finalStatus = 'completed';
  }

  // Record lead approval when PL completes an approved task
  if (task.status === 'approved' && finalStatus === 'completed' &&
    ['system_admin','super_admin','owner','manager','project_lead'].includes(req.projectRole)) {
    task.leadApproval = {
      approvedBy: req.user._id,
      note: note || '',
      approvedAt: new Date()
    };
  }

  task.status = finalStatus;
  task.statusHistory.push({ status: finalStatus, changedBy: req.user._id, note: note || '' });
  await task.save();

  // Notifications + emails
  const taskPath = `/projects/${req.project._id}/tasks/${task._id}`;
  const opts = { link: taskPath, projectId: req.project._id, taskId: task._id };
  const assigneeId = task.assignee ? task.assignee._id || task.assignee : null;
  const assigneeEmail = task.assignee && task.assignee.email ? task.assignee.email : null;
  const assigneeName  = task.assignee && task.assignee.fullName ? task.assignee.fullName : null;

  if (finalStatus === 'assigned' && assigneeId && assigneeId.toString() !== req.user._id.toString()) {
    await notify(assigneeId, 'task_assigned', `You were assigned to "${task.title}".`, opts);
    if (assigneeEmail) {
      await sendTaskEmail(
        assigneeEmail,
        `You've been assigned to "${task.title}"`,
        taskEmailHtml(assigneeName, `You have been assigned to <strong>${task.title}</strong> in <strong>${req.project.name}</strong>.`, taskPath)
      );
    }
  }
  if (finalStatus === 'ready_for_review') {
    const qmMembers = req.project.members
      .filter(m => ['quality_manager','manager','owner','project_lead'].includes(m.role) && m.user._id.toString() !== req.user._id.toString());
    await notifyMany(qmMembers.map(m => m.user._id), 'task_ready_for_review', `"${task.title}" is ready for review.`, opts);
    await Promise.all(qmMembers.filter(m => m.user.email).map(m =>
      sendTaskEmail(
        m.user.email,
        `"${task.title}" is ready for review`,
        taskEmailHtml(m.user.fullName, `<strong>${task.title}</strong> in <strong>${req.project.name}</strong> has been submitted for review.`, taskPath)
      )
    ));
  }
  if (finalStatus === 'returned_for_refinement' && assigneeId && assigneeId.toString() !== req.user._id.toString()) {
    await notify(assigneeId, 'task_returned', `"${task.title}" was returned for refinement.`, opts);
    if (assigneeEmail) {
      const qaNote = note ? ` The reviewer noted: <em>${note}</em>` : '';
      await sendTaskEmail(
        assigneeEmail,
        `"${task.title}" was returned for refinement`,
        taskEmailHtml(assigneeName, `<strong>${task.title}</strong> in <strong>${req.project.name}</strong> has been returned for refinement.${qaNote}`, taskPath)
      );
    }
  }
  if (finalStatus === 'approved' && task.requiresLeadApproval) {
    const leadMembers = req.project.members
      .filter(m => ['project_lead','manager','owner'].includes(m.role) && m.user._id.toString() !== req.user._id.toString());
    await notifyMany(leadMembers.map(m => m.user._id), 'task_approved', `"${task.title}" was approved by QA and needs your sign-off.`, opts);
    await Promise.all(leadMembers.filter(m => m.user.email).map(m =>
      sendTaskEmail(
        m.user.email,
        `"${task.title}" needs your sign-off`,
        taskEmailHtml(m.user.fullName, `<strong>${task.title}</strong> in <strong>${req.project.name}</strong> was approved by QA and needs your final sign-off.`, taskPath)
      )
    ));
  }
  if (finalStatus === 'completed') {
    if (assigneeId && assigneeId.toString() !== req.user._id.toString()) {
      await notify(assigneeId, 'task_completed', `"${task.title}" has been completed.`, opts);
      if (assigneeEmail) {
        await sendTaskEmail(
          assigneeEmail,
          `"${task.title}" has been completed`,
          taskEmailHtml(assigneeName, `<strong>${task.title}</strong> in <strong>${req.project.name}</strong> has been completed.`, taskPath)
        );
      }
    }
  }

  req.session.flash = { success: `Status updated to "${STATUS_LABELS[finalStatus]}".` };
  res.redirect(`/projects/${req.project._id}/tasks/${task._id}`);
}

// POST /projects/:projectId/tasks/:taskId/archive
async function archiveTask(req, res) {
  if (!['system_admin','super_admin','owner','manager','project_lead'].includes(req.projectRole)) {
    return res.status(403).render('errors/403', { title: '403 Forbidden' });
  }
  const task = req.task;
  task.status = 'archived';
  task.archivedAt = new Date();
  task.statusHistory.push({ status: 'archived', changedBy: req.user._id });
  await task.save();
  req.session.flash = { success: `Task "${task.title}" archived.` };
  res.redirect(`/projects/${req.project._id}/tasks`);
}

// POST /projects/:projectId/tasks/:taskId/delete
async function deleteTask(req, res) {
  if (!['system_admin','super_admin','owner','manager','project_lead'].includes(req.projectRole)) {
    return res.status(403).render('errors/403', { title: '403 Forbidden' });
  }
  const title = req.task.title;
  await Task.findByIdAndDelete(req.task._id);
  req.session.flash = { success: `Task "${title}" permanently deleted.` };
  res.redirect(`/projects/${req.project._id}/tasks`);
}

// GET /projects/:projectId/tasks
async function listTasks(req, res) {
  const { status, priority, search, assigneeId, sort } = req.query;
  const filter = { project: req.project._id, status: { $ne: 'archived' } };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assigneeId === 'unassigned') {
    filter.assignee = null;
  } else if (assigneeId) {
    filter.assignee = assigneeId;
  }
  if (search) filter.title = { $regex: search, $options: 'i' };

  const sortMap = {
    'due_asc': { dueDate: 1 },
    'priority': { priority: -1 },
    'status': { status: 1 },
    'newest': { createdAt: -1 }
  };
  const sortOrder = sortMap[sort] || { createdAt: -1 };

  const tasks = await Task.find(filter)
    .populate('assignee', 'fullName')
    .populate('createdBy', 'fullName')
    .sort(sortOrder)
    .lean();

  const visibleTasks = tasks.map(t => ({
    ...t,
    visible: !t.isConfidential || ['system_admin','super_admin','owner','manager','project_lead','quality_manager'].includes(req.projectRole) ||
      (t.assignee && t.assignee._id.toString() === req.user._id.toString()) ||
      t.createdBy._id.toString() === req.user._id.toString()
  }));

  // Build assignee list for filter dropdown
  const memberIds = req.project.members.map(m => m.user._id || m.user);
  const assignableUsers = await User.find({ _id: { $in: memberIds }, accountStatus: 'active' })
    .select('fullName').sort({ fullName: 1 }).lean();

  res.render('tasks/list', {
    title: 'Tasks',
    project: req.project,
    tasks: visibleTasks,
    statusLabels: STATUS_LABELS,
    assignableUsers,
    filters: { status: status || '', priority: priority || '', search: search || '', assigneeId: assigneeId || '', sort: sort || '' }
  });
}

// GET /projects/:projectId/kanban
async function getKanban(req, res) {
  const COLUMNS = [
    { key: 'draft', label: 'Draft', statuses: ['draft'] },
    { key: 'assigned', label: 'Assigned', statuses: ['assigned'] },
    { key: 'in_progress', label: 'In Progress', statuses: ['in_progress'] },
    { key: 'review', label: 'Review', statuses: ['ready_for_review', 'returned_for_refinement'] },
    { key: 'approved', label: 'Approved', statuses: ['approved'] },
    { key: 'done', label: 'Done', statuses: ['completed'] },
    { key: 'blocked', label: 'Blocked', statuses: ['blocked'] }
  ];

  const tasks = await Task.find({ project: req.project._id, status: { $ne: 'archived' } })
    .populate('assignee', 'fullName')
    .lean();

  const canSeeConfidential = ['system_admin','super_admin','owner','manager','project_lead','quality_manager'].includes(req.projectRole);

  const columns = COLUMNS.map(col => ({
    ...col,
    tasks: tasks
      .filter(t => col.statuses.includes(t.status))
      .map(t => {
        const visible = !t.isConfidential || canSeeConfidential ||
          (t.assignee && t.assignee._id.toString() === req.user._id.toString()) ||
          t.createdBy.toString() === req.user._id.toString();
        return { ...t, visible };
      })
  }));

  res.render('projects/kanban', {
    title: `${req.project.name} — Kanban`,
    project: req.project,
    columns,
    projectRole: req.projectRole
  });
}

// GET /tasks — global task search across all accessible projects
async function listAllTasks(req, res) {
  const { search, status, priority, projectId, assigneeId, sort } = req.query;
  const { isSystemAdmin: _isSA } = require('../utils/roles');
  const isSuperAdmin = _isSA(req.user);

  // Resolve accessible projects
  const projectFilter = isSuperAdmin ? {} : { 'members.user': req.user._id };
  const accessibleProjects = await Project.find(projectFilter).select('_id name').sort({ name: 1 }).lean();
  const accessibleIds = accessibleProjects.map(p => p._id);

  const filter = { project: { $in: accessibleIds }, status: { $ne: 'archived' } };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (projectId) filter.project = projectId;
  if (assigneeId === 'mine') filter.assignee = req.user._id;
  else if (assigneeId === 'unassigned') filter.assignee = null;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const sortMap = {
    'due_asc': { dueDate: 1 },
    'priority': { priority: -1 },
    'status': { status: 1 },
    'newest': { createdAt: -1 }
  };
  const sortOrder = sortMap[sort] || { updatedAt: -1 };

  const PAGE_SIZE = 25;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const total = await Task.countDocuments(filter);
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);

  const tasks = await Task.find(filter)
    .populate('project', 'name')
    .populate('assignee', 'fullName')
    .sort(sortOrder)
    .skip((safePage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  const qp = new URLSearchParams();
  if (search)    qp.set('search', search);
  if (status)    qp.set('status', status);
  if (priority)  qp.set('priority', priority);
  if (projectId) qp.set('projectId', projectId);
  if (assigneeId) qp.set('assigneeId', assigneeId);
  if (sort)      qp.set('sort', sort);

  res.render('tasks/all', {
    title: 'All Tasks',
    tasks,
    accessibleProjects,
    statusLabels: STATUS_LABELS,
    filters: { search: search || '', status: status || '', priority: priority || '', projectId: projectId || '', assigneeId: assigneeId || '', sort: sort || '' },
    pagination: { page: safePage, totalPages, total, queryBase: qp.toString() }
  });
}

module.exports = {
  getNewTask, createTask, getTask, getEditTask, updateTask,
  updateStatus, archiveTask, deleteTask, listTasks, getKanban, listAllTasks
};
