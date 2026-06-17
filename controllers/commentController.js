const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { notify, notifyMany } = require('../utils/notify');
const { sendEmail } = require('../services/emailService');

function mentionEmailHtml(recipientName, authorName, taskTitle, projectName, commentPath) {
  const url = `${process.env.APP_URL || 'http://localhost:3000'}${commentPath}`;
  return `<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0F172A;"><p>Hi ${recipientName},</p><p><strong>${authorName}</strong> mentioned you in a comment on <strong>${taskTitle}</strong> in <strong>${projectName}</strong>.</p><p style="margin:1.5rem 0;"><a href="${url}" style="display:inline-block;padding:10px 24px;background:#1E40AF;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View Comment</a></p><p style="color:#64748B;font-size:0.875rem;">— HelloTasks</p></div>`;
}

async function safeSend(to, subject, html) {
  try { await sendEmail(to, subject, html); }
  catch (err) { console.error('Mention email failed:', err.message); }
}

async function addComment(req, res) {
  const { content } = req.body;
  const { projectId } = req.params;
  const task = req.task;
  const project = req.project;

  if (!content || !content.trim()) {
    req.session.flash = { error: 'Comment cannot be empty.' };
    return res.redirect(`/projects/${projectId}/tasks/${task._id}`);
  }

  const trimmedContent = content.trim();

  await Comment.create({
    task: task._id,
    project: projectId,
    author: req.user._id,
    content: trimmedContent
  });

  const taskPath = `/projects/${projectId}/tasks/${task._id}#comments`;
  const opts = { link: taskPath, projectId, taskId: task._id };

  // Parse @mentions — match full names of project members (case-insensitive)
  const mentionedIds = new Set();
  const mentionedUsers = [];
  project.members.forEach(m => {
    if (m.user._id.toString() === req.user._id.toString()) return;
    const escaped = m.user.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`@${escaped}`, 'i').test(trimmedContent)) {
      const idStr = m.user._id.toString();
      if (!mentionedIds.has(idStr)) {
        mentionedIds.add(idStr);
        mentionedUsers.push(m.user);
      }
    }
  });

  if (mentionedIds.size > 0) {
    await notifyMany([...mentionedIds], 'task_mention',
      `${req.user.fullName} mentioned you in a comment on "${task.title}".`, opts);
    await Promise.all(mentionedUsers.filter(u => u.email).map(u =>
      safeSend(u.email,
        `${req.user.fullName} mentioned you on "${task.title}"`,
        mentionEmailHtml(u.fullName, req.user.fullName, task.title, project.name, taskPath))
    ));
  }

  // Notify assignee and task creator — skip the commenter and anyone already mentioned
  const assigneeId  = task.assignee  ? (task.assignee._id  || task.assignee)  : null;
  const createdById = task.createdBy ? (task.createdBy._id || task.createdBy) : null;
  const notifyIds   = [assigneeId, createdById].filter(
    id => id && id.toString() !== req.user._id.toString() && !mentionedIds.has(id.toString())
  );
  if (notifyIds.length > 0) {
    await notifyMany(notifyIds, 'task_comment',
      `New comment on "${task.title}" by ${req.user.fullName}.`, opts);
  }

  req.session.flash = { success: 'Comment added.' };
  res.redirect(`/projects/${projectId}/tasks/${task._id}#comments`);
}

async function deleteComment(req, res) {
  const { projectId, taskId, commentId } = req.params;
  const comment = await Comment.findById(commentId);

  if (!comment) {
    req.session.flash = { error: 'Comment not found.' };
    return res.redirect(`/projects/${projectId}/tasks/${taskId}`);
  }

  const isAuthor = comment.author.toString() === req.user._id.toString();
  const isAdmin = ['super_admin', 'project_lead'].includes(req.projectRole);

  if (!isAuthor && !isAdmin) {
    req.session.flash = { error: 'You cannot delete this comment.' };
    return res.redirect(`/projects/${projectId}/tasks/${taskId}`);
  }

  await Comment.findByIdAndDelete(commentId);
  req.session.flash = { success: 'Comment deleted.' };
  res.redirect(`/projects/${projectId}/tasks/${taskId}#comments`);
}

module.exports = { addComment, deleteComment };
