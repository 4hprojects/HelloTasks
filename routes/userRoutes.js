const express = require('express');
const router = express.Router();
const { isAuthenticated, checkRole } = require('../middleware/authMiddleware');
const { listUsers, getUser, updateUser, getInviteUser, postInviteUser } = require('../controllers/userController');

const adminOnly = checkRole('super_admin');

router.get('/', isAuthenticated, adminOnly, listUsers);
router.get('/invite', isAuthenticated, adminOnly, getInviteUser);
router.post('/invite', isAuthenticated, adminOnly, postInviteUser);
router.get('/:id', isAuthenticated, adminOnly, getUser);
router.post('/:id', isAuthenticated, adminOnly, updateUser);

module.exports = router;
