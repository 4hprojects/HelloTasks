const express = require('express');
const router = express.Router({ mergeParams: true });
const { isAuthenticated } = require('../middleware/authMiddleware');
const { requireProjectMember, loadTask } = require('../middleware/projectMiddleware');
const {
  getNewTask, createTask, getTask, getEditTask, updateTask,
  updateStatus, archiveTask, deleteTask, listTasks
} = require('../controllers/taskController');
const { addComment, deleteComment } = require('../controllers/commentController');
const { handleUpload, deleteFile } = require('../controllers/fileController');
const { upload } = require('../services/uploadService');

router.use(isAuthenticated, requireProjectMember);

router.get('/', listTasks);
router.get('/new', getNewTask);
router.post('/', createTask);
router.get('/:taskId', loadTask, getTask);
router.get('/:taskId/edit', loadTask, getEditTask);
router.post('/:taskId/edit', loadTask, updateTask);
router.post('/:taskId/status', loadTask, updateStatus);
router.post('/:taskId/archive', loadTask, archiveTask);
router.post('/:taskId/delete', loadTask, deleteTask);

// Comments
router.post('/:taskId/comments', loadTask, addComment);
router.post('/:taskId/comments/:commentId/delete', loadTask, deleteComment);

// File uploads
router.post('/:taskId/files', loadTask, upload.single('file'), handleUpload);
router.post('/:taskId/files/:fileId/delete', loadTask, deleteFile);

module.exports = router;
