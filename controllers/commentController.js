const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { notify, notifyMany } = require('../utils/notify');

async function addComment(req, res) {
  const { content } = req.body;
  const { projectId } = req.params;
  const task = req.task;

  if (!content || !content.trim()) {
    req.session.flash = { error: 'Comment cannot be empty.' };
    return res.redirect(`/projects/${projectId}/tasks/${task._id}`);
  }

  await Comment.create({
    task: task._id,
    project: projectId,
    author: req.user._id,
    content: content.trim()
  });

  // Notify assignee and creator (excluding the commenter)
  const notifyIds = [task.assignee, task.createdBy]
    .filter(id => id && id.toString() !== req.user._id.toString())
    .map(id => id.toString());
  const opts = { link: `/projects/${projectId}/tasks/${task._id}#comments`, projectId, taskId: task._id };
  await notifyMany(notifyIds, 'task_comment', `New comment on "${task.title}" by ${req.user.fullName}.`, opts);

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
