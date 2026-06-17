const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const slugify = require('../utils/slugify');
const { sendEmail } = require('../services/emailService');

async function uniqueSlug(base, excludeId = null) {
  let slug = base;
  let i = 2;
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Project.findOne(query);
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

function canManageProject(user, project) {
  if (user.globalRole === 'super_admin') return true;
  const role = project.getMemberRole(user._id);
  return role === 'project_lead';
}

async function listProjects(req, res) {
  const { search, status } = req.query;
  const filter = req.user.globalRole === 'super_admin' ? {} : { 'members.user': req.user._id };
  if (status) filter.status = status;

  let projects = await Project.find(filter)
    .populate('createdBy', 'fullName')
    .sort({ createdAt: -1 })
    .lean();

  if (search) {
    const q = search.toLowerCase();
    projects = projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  res.render('projects/index', {
    title: 'Projects',
    projects,
    filters: { search: search || '', status: status || '' }
  });
}

async function getNewProject(req, res) {
  res.render('projects/new', { title: 'New Project', errors: [] });
}

async function createProject(req, res) {
  const { name, description, status } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push('Project name is required.');

  if (errors.length) {
    return res.render('projects/new', { title: 'New Project', errors, body: req.body });
  }

  try {
    const base = slugify(name);
    const slug = await uniqueSlug(base);

    const project = await Project.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      status: status || 'active',
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'project_lead' }]
    });

    req.session.flash = { success: `Project "${project.name}" created.` };
    res.redirect(`/projects/${project._id}`);
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Failed to create project. Please try again.' };
    res.redirect('/projects/new');
  }
}

async function getProject(req, res) {
  const project = await Project.findById(req.params.id)
    .populate('createdBy', 'fullName email')
    .populate('members.user', 'fullName email globalRole accountStatus')
    .lean();

  if (!project) return res.status(404).render('errors/404', { title: '404 Not Found' });

  const isSuperAdmin = req.user.globalRole === 'super_admin';
  const userMember = project.members.find(m => m.user._id.toString() === req.user._id.toString());

  if (!isSuperAdmin && !userMember) {
    return res.status(403).render('errors/403', { title: '403 Forbidden' });
  }

  const canManage = isSuperAdmin || (userMember && userMember.role === 'project_lead');

  const [allUsers, taskTotal, taskInProgress, taskCompleted, taskBlocked] = await Promise.all([
    canManage
      ? User.find({ _id: { $nin: project.members.map(m => m.user._id) }, accountStatus: 'active' })
          .select('fullName email globalRole').lean()
      : Promise.resolve([]),
    Task.countDocuments({ project: project._id, status: { $ne: 'archived' } }),
    Task.countDocuments({ project: project._id, status: 'in_progress' }),
    Task.countDocuments({ project: project._id, status: 'completed' }),
    Task.countDocuments({ project: project._id, status: 'blocked' })
  ]);

  const taskStats = { total: taskTotal, inProgress: taskInProgress, completed: taskCompleted, blocked: taskBlocked };

  res.render('projects/show', { title: project.name, project, canManage, allUsers, userMember, taskStats });
}

async function getEditProject(req, res) {
  const project = await Project.findById(req.params.id).lean();
  if (!project) return res.status(404).render('errors/404', { title: '404 Not Found' });

  const isSuperAdmin = req.user.globalRole === 'super_admin';
  const role = project.members.find(m => m.user.toString() === req.user._id.toString())?.role;
  if (!isSuperAdmin && role !== 'project_lead') {
    return res.status(403).render('errors/403', { title: '403 Forbidden' });
  }

  res.render('projects/edit', { title: `Edit — ${project.name}`, project, errors: [] });
}

async function updateProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).render('errors/404', { title: '404 Not Found' });

  const isSuperAdmin = req.user.globalRole === 'super_admin';
  const role = project.getMemberRole(req.user._id);
  if (!isSuperAdmin && role !== 'project_lead') {
    return res.status(403).render('errors/403', { title: '403 Forbidden' });
  }

  const { name, description, status } = req.body;
  const errors = [];
  if (!name || !name.trim()) errors.push('Project name is required.');
  if (errors.length) {
    return res.render('projects/edit', { title: `Edit — ${project.name}`, project: { ...project.toObject(), ...req.body }, errors });
  }

  try {
    const base = slugify(name);
    const slug = await uniqueSlug(base, project._id);

    project.name = name.trim();
    project.slug = slug;
    project.description = description ? description.trim() : '';
    project.status = status || project.status;
    await project.save();

    req.session.flash = { success: 'Project updated.' };
    res.redirect(`/projects/${project._id}`);
  } catch (err) {
    console.error(err);
    req.session.flash = { error: 'Failed to update project.' };
    res.redirect(`/projects/${req.params.id}/edit`);
  }
}

async function deleteProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).render('errors/404', { title: '404 Not Found' });

  const isSuperAdmin = req.user.globalRole === 'super_admin';
  const role = project.getMemberRole(req.user._id);
  if (!isSuperAdmin && role !== 'project_lead') {
    return res.status(403).render('errors/403', { title: '403 Forbidden' });
  }

  await Project.findByIdAndDelete(req.params.id);
  req.session.flash = { success: `Project "${project.name}" deleted.` };
  res.redirect('/projects');
}

async function addMember(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).render('errors/404', { title: '404 Not Found' });

  if (!canManageProject(req.user, project)) {
    return res.status(403).render('errors/403', { title: '403 Forbidden' });
  }

  const { userId, role } = req.body;
  const validRoles = ['project_lead', 'quality_manager', 'developer', 'viewer'];

  if (!userId || !validRoles.includes(role)) {
    req.session.flash = { error: 'Invalid user or role.' };
    return res.redirect(`/projects/${project._id}`);
  }

  if (project.hasMember(userId)) {
    req.session.flash = { error: 'User is already a member of this project.' };
    return res.redirect(`/projects/${project._id}`);
  }

  const user = await User.findById(userId);
  if (!user) {
    req.session.flash = { error: 'User not found.' };
    return res.redirect(`/projects/${project._id}`);
  }

  project.members.push({ user: userId, role });
  await project.save();

  req.session.flash = { success: `${user.fullName} added as ${role.replace(/_/g, ' ')}.` };
  res.redirect(`/projects/${project._id}`);
}

async function removeMember(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).render('errors/404', { title: '404 Not Found' });

  if (!canManageProject(req.user, project)) {
    return res.status(403).render('errors/403', { title: '403 Forbidden' });
  }

  const { userId } = req.body;

  const leads = project.members.filter(m => m.role === 'project_lead');
  const targetMember = project.members.find(m => m.user.toString() === userId);

  if (targetMember && targetMember.role === 'project_lead' && leads.length === 1) {
    req.session.flash = { error: 'Cannot remove the only Project Lead.' };
    return res.redirect(`/projects/${project._id}`);
  }

  project.members = project.members.filter(m => m.user.toString() !== userId);
  await project.save();

  req.session.flash = { success: 'Member removed.' };
  res.redirect(`/projects/${project._id}`);
}

async function inviteMember(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).render('errors/404', { title: '404 Not Found' });

  if (!canManageProject(req.user, project)) {
    return res.status(403).render('errors/403', { title: '403 Forbidden' });
  }

  const { email, fullName, role } = req.body;
  const validRoles = ['project_lead', 'quality_manager', 'developer', 'viewer'];

  if (!email || !email.trim() || !fullName || !fullName.trim() || !validRoles.includes(role)) {
    req.session.flash = { error: 'Email, name, and a valid role are required.' };
    return res.redirect(`/projects/${project._id}`);
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();

  let targetUser = await User.findOne({ email: cleanEmail });

  if (targetUser && project.hasMember(targetUser._id)) {
    req.session.flash = { error: 'That person is already a member of this project.' };
    return res.redirect(`/projects/${project._id}`);
  }

  if (targetUser && targetUser.accountStatus === 'suspended') {
    req.session.flash = { error: 'That user account is suspended and cannot be added.' };
    return res.redirect(`/projects/${project._id}`);
  }

  if (targetUser && targetUser.accountStatus === 'active') {
    project.members.push({ user: targetUser._id, role });
    await project.save();
    req.session.flash = { success: `${targetUser.fullName} added as ${role.replace(/_/g, ' ')}.` };
    return res.redirect(`/projects/${project._id}`);
  }

  // New or pending user — generate invite token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);

  if (targetUser) {
    targetUser.fullName = cleanName;
    targetUser.inviteToken = token;
    targetUser.inviteExpires = expires;
    await targetUser.save();
  } else {
    const placeholderHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
    targetUser = await User.create({
      fullName: cleanName,
      email: cleanEmail,
      passwordHash: placeholderHash,
      globalRole: 'viewer',
      accountStatus: 'pending',
      inviteToken: token,
      inviteExpires: expires
    });
  }

  project.members.push({ user: targetUser._id, role });
  await project.save();

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const acceptLink = `${appUrl}/accept-invite/${token}`;
  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0F172A;">
      <p>Hi ${cleanName},</p>
      <p><strong>${req.user.fullName}</strong> has invited you to collaborate on
         <strong>${project.name}</strong> in HelloTasks.</p>
      <p>Click below to set up your account and get started. This link expires in 72 hours.</p>
      <p style="margin:1.5rem 0;">
        <a href="${acceptLink}"
           style="display:inline-block;padding:10px 24px;background:#1E40AF;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
          Accept Invitation
        </a>
      </p>
      <p style="color:#64748B;font-size:0.875rem;">
        If you weren't expecting this invitation, you can safely ignore this email.
      </p>
    </div>
  `;

  try {
    await sendEmail(cleanEmail, `You've been invited to collaborate on ${project.name}`, html);
    req.session.flash = { success: `Invitation sent to ${cleanEmail}. They've been added as a pending member.` };
  } catch (err) {
    console.error('Invite email failed:', err);
    req.session.flash = { success: `${cleanEmail} added as a pending member, but the invite email could not be sent.` };
  }

  res.redirect(`/projects/${project._id}`);
}

module.exports = {
  listProjects, getNewProject, createProject,
  getProject, getEditProject, updateProject, deleteProject,
  addMember, removeMember, inviteMember
};
