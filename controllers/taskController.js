const Task = require('../models/Task');
const User = require('../models/User');
const Comment = require('../models/Comment');
const FileRecord = require('../models/FileRecord');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const supabase = require('../config/supabase');
const { formatSize } = require('./fileController');
const { notify, notifyMany } = require('../utils/notify');
const { sendEmail } = require('../services/emailService');
const { taskEmail: taskEmailHtml } = require('../services/emailTemplates');
const { isSystemAdmin, MANAGER_ROLES, ELEVATED_ROLES } = require('../utils/roles');
const { audit } = require('../utils/audit');

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

async function getAssignableUsers(project) {
  const ids = project.members
    .filter(m => m.role !== 'viewer')
    .map(m => m.user._id || m.user);
  return User.find({ _id: { $in: ids }, accountStatus: 'active' })
    .select('fullName email').lean();
}

// GET /projects/:projectId/tasks/new
async function getNewTask(req, res) {
  const assignableUsers = await getAssignableUsers(req.project);

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
  if (assigneeId) {
    const isMember = req.project.members.some(m => (m.user._id || m.user).toString() === assigneeId);
    if (!isMember) errors.push('Assignee must be a member of this project.');
  }

  if (errors.length) {
    const assignableUsers = await getAssignableUsers(req.project);
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
    ELEVATED_ROLES.includes(req.projectRole);

  if (!canSeeContent) {
    return res.render('tasks/locked', { title: 'Confidential Task', project: req.project });
  }

  const canEdit = MANAGER_ROLES.includes(req.projectRole) || isSystemAdmin(req.user) ||
    (['developer','member'].includes(req.projectRole) && task.assignee &&
      task.assignee._id.toString() === req.user._id.toString());

  const availableTransitions = getAvailableTransitions(req.projectRole, task.status);

  const COMMENTS_PAGE_SIZE = 20;
  const showAllComments = req.query.allComments === '1';

  const [totalComments, files] = await Promise.all([
    Comment.countDocuments({ task: task._id }),
    FileRecord.find({ task: task._id }).populate('uploadedBy', 'fullName').sort({ createdAt: -1 }).lean()
  ]);

  let comments;
  if (showAllComments || totalComments <= COMMENTS_PAGE_SIZE) {
    comments = await Comment.find({ task: task._id })
      .populate('author', 'fullName').sort({ createdAt: 1 }).lean();
  } else {
    // Load the most recent COMMENTS_PAGE_SIZE, then reverse to show oldest-first
    comments = await Comment.find({ task: task._id })
      .populate('author', 'fullName').sort({ createdAt: -1 })
      .limit(COMMENTS_PAGE_SIZE).lean();
    comments.reverse();
  }

  const olderCount = showAllComments ? 0 : Math.max(0, totalComments - comments.length);

  // For confidential tasks, replace permanent public URLs with short-lived signed URLs
  if (task.isConfidential && files.length > 0) {
    for (const f of files) {
      try {
        const { data } = await supabase.storage.from(f.bucket).createSignedUrl(f.filePath, 3600);
        if (data?.signedUrl) f.publicUrl = data.signedUrl;
      } catch (err) {
        console.error('Signed URL error:', err.message);
      }
    }
  }

  res.render('tasks/show', {
    title: task.title,
    project: req.project,
    task,
    canEdit,
    availableTransitions,
    statusLabels: STATUS_LABELS,
    projectRole: req.projectRole,
    comments,
    totalComments,
    olderCount,
    files,
    formatSize
  });
}

// GET /projects/:projectId/tasks/:taskId/edit
async function getEditTask(req, res) {
  const task = req.task;
  const canEdit = MANAGER_ROLES.includes(req.projectRole) || isSystemAdmin(req.user) ||
    (['developer','member'].includes(req.projectRole) && task.assignee &&
      task.assignee._id.toString() === req.user._id.toString());

  if (!canEdit) return res.status(403).render('errors/403', { title: '403 Forbidden' });

  const assignableUsers = await getAssignableUsers(req.project);

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
  const canEdit = MANAGER_ROLES.includes(req.projectRole) || isSystemAdmin(req.user) ||
    (['developer','member'].includes(req.projectRole) && task.assignee &&
      task.assignee._id.toString() === req.user._id.toString());

  if (!canEdit) return res.status(403).render('errors/403', { title: '403 Forbidden' });

  const { title, description, assigneeId, priority, dueDate, isConfidential,
    requiresLeadApproval, externalUrl, checklistItems } = req.body;
  const errors = [];

  if (!title || !title.trim()) errors.push('Task title is required.');
  if (externalUrl && !validateExternalUrl(externalUrl)) errors.push('External URL must start with http:// or https://');
  if (assigneeId) {
    const isMember = req.project.members.some(m => (m.user._id || m.user).toString() === assigneeId);
    if (!isMember) errors.push('Assignee must be a member of this project.');
  }

  if (errors.length) {
    const assignableUsers = await getAssignableUsers(req.project);
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
  const isXhr = req.xhr;

  const allowed = getAvailableTransitions(req.projectRole, task.status);
  if (!allowed.includes(newStatus)) {
    if (isXhr) return res.json({ ok: false, error: 'That status change is not allowed.' });
    req.session.flash = { error: 'That status change is not allowed.' };
    return res.redirect(`/projects/${req.project._id}/tasks/${task._id}`);
  }

  // Record QA review when QM approves or returns (use newStatus before auto-complete conversion)
  if (task.status === 'ready_for_review' &&
    ['approved', 'returned_for_refinement'].includes(newStatus) &&
    ELEVATED_ROLES.includes(req.projectRole)) {
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
    ELEVATED_ROLES.includes(req.projectRole)) {
    finalStatus = 'completed';
  }

  // Record lead approval when PL completes an approved task
  if (task.status === 'approved' && finalStatus === 'completed' &&
    (MANAGER_ROLES.includes(req.projectRole) || isSystemAdmin(req.user))) {
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
      .filter(m => MANAGER_ROLES.includes(m.role) && m.user._id.toString() !== req.user._id.toString());
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

  if (isXhr) return res.json({ ok: true, status: finalStatus });
  req.session.flash = { success: `Status updated to "${STATUS_LABELS[finalStatus]}".` };
  res.redirect(`/projects/${req.project._id}/tasks/${task._id}`);
}

// POST /projects/:projectId/tasks/:taskId/duplicate
async function duplicateTask(req, res) {
  const src = req.task;
  const copy = await Task.create({
    project:             req.project._id,
    title:               `Copy of ${src.title}`,
    description:         src.description || '',
    priority:            src.priority,
    dueDate:             src.dueDate,
    externalUrl:         src.externalUrl || '',
    isConfidential:      src.isConfidential,
    requiresLeadApproval: src.requiresLeadApproval,
    checklist:           (src.checklist || []).map(c => ({ item: c.item, completed: false })),
    status:              'draft',
    assignee:            null,
    createdBy:           req.user._id,
    statusHistory:       [{ status: 'draft', changedBy: req.user._id, note: `Duplicated from task ${src._id}` }]
  });
  req.session.flash = { success: `Task duplicated as "${copy.title}".` };
  res.redirect(`/projects/${req.project._id}/tasks/${copy._id}/edit`);
}

// POST /projects/:projectId/tasks/:taskId/archive
async function archiveTask(req, res) {
  if (!MANAGER_ROLES.includes(req.projectRole) && !isSystemAdmin(req.user)) {
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
  if (!MANAGER_ROLES.includes(req.projectRole) && !isSystemAdmin(req.user)) {
    return res.status(403).render('errors/403', { title: '403 Forbidden' });
  }
  const taskId = req.task._id;
  const title = req.task.title;

  const files = await FileRecord.find({ task: taskId }).select('bucket filePath').lean();
  for (const f of files) {
    try { await supabase.storage.from(f.bucket).remove([f.filePath]); }
    catch (err) { console.error('Storage delete error on task delete:', err.message); }
  }

  await Promise.all([
    Comment.deleteMany({ task: taskId }),
    FileRecord.deleteMany({ task: taskId }),
    Notification.deleteMany({ task: taskId }),
    Task.findByIdAndDelete(taskId),
  ]);

  await audit('task_deleted', req.user, {
    targetType: 'task', targetId: taskId, targetName: title,
    projectId: req.project._id
  });

  req.session.flash = { success: `Task "${title}" permanently deleted.` };
  res.redirect(`/projects/${req.project._id}/tasks`);
}

// POST /projects/:projectId/tasks/:taskId/checklist/:index/toggle
async function toggleChecklistItem(req, res) {
  const task = req.task;
  const canEdit = MANAGER_ROLES.includes(req.projectRole) || isSystemAdmin(req.user) ||
    (['developer','member'].includes(req.projectRole) && task.assignee &&
      task.assignee._id.toString() === req.user._id.toString());

  if (!canEdit) {
    req.session.flash = { error: 'You cannot edit this task.' };
    return res.redirect(`/projects/${req.project._id}/tasks/${task._id}`);
  }

  const index = parseInt(req.params.index, 10);
  if (isNaN(index) || index < 0 || index >= task.checklist.length) {
    req.session.flash = { error: 'Invalid checklist item.' };
    return res.redirect(`/projects/${req.project._id}/tasks/${task._id}`);
  }

  task.checklist[index].completed = !task.checklist[index].completed;
  await task.save();

  res.redirect(`/projects/${req.project._id}/tasks/${task._id}#checklist`);
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
    visible: !t.isConfidential || ELEVATED_ROLES.includes(req.projectRole) ||
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
    filters: { status: status || '', priority: priority || '', search: search || '', assigneeId: assigneeId || '', sort: sort || '' },
    canBulk: MANAGER_ROLES.includes(req.projectRole) || isSystemAdmin(req.user)
  });
}

// POST /projects/:projectId/tasks/bulk
async function bulkUpdateTasks(req, res) {
  if (!MANAGER_ROLES.includes(req.projectRole) && !isSystemAdmin(req.user)) {
    req.session.flash = { error: 'You do not have permission to bulk update tasks.' };
    return res.redirect(`/projects/${req.project._id}/tasks`);
  }

  const { action } = req.body;
  let taskIds = req.body.taskIds;
  if (!taskIds) {
    req.session.flash = { error: 'No tasks selected.' };
    return res.redirect(`/projects/${req.project._id}/tasks`);
  }
  if (!Array.isArray(taskIds)) taskIds = [taskIds];

  const VALID_STATUSES   = ['draft', 'assigned', 'in_progress', 'ready_for_review', 'returned_for_refinement', 'approved', 'blocked', 'completed'];
  const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

  if (action === 'status') {
    const newStatus = req.body.statusValue;
    if (!VALID_STATUSES.includes(newStatus)) {
      req.session.flash = { error: 'Invalid status.' };
      return res.redirect(`/projects/${req.project._id}/tasks`);
    }
    await Task.updateMany(
      { _id: { $in: taskIds }, project: req.project._id, status: { $ne: 'archived' } },
      { $set: { status: newStatus }, $push: { statusHistory: { status: newStatus, changedBy: req.user._id, note: 'Bulk update' } } }
    );
    req.session.flash = { success: `Updated ${taskIds.length} task${taskIds.length !== 1 ? 's' : ''} to "${STATUS_LABELS[newStatus]}".` };
  } else if (action === 'priority') {
    const newPriority = req.body.priorityValue;
    if (!VALID_PRIORITIES.includes(newPriority)) {
      req.session.flash = { error: 'Invalid priority.' };
      return res.redirect(`/projects/${req.project._id}/tasks`);
    }
    await Task.updateMany(
      { _id: { $in: taskIds }, project: req.project._id, status: { $ne: 'archived' } },
      { $set: { priority: newPriority } }
    );
    req.session.flash = { success: `Updated priority for ${taskIds.length} task${taskIds.length !== 1 ? 's' : ''}.` };
  } else {
    req.session.flash = { error: 'Unknown bulk action.' };
  }

  res.redirect(`/projects/${req.project._id}/tasks`);
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

  const canSeeConfidential = ELEVATED_ROLES.includes(req.projectRole);

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
  updateStatus, duplicateTask, archiveTask, deleteTask, toggleChecklistItem, listTasks, bulkUpdateTasks, getKanban, listAllTasks
};
