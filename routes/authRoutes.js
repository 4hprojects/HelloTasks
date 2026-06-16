const express = require('express');
const router = express.Router();
const {
  getRegister, postRegister,
  getLogin, postLogin, logout,
  getForgotPassword, postForgotPassword,
  getResetPassword, postResetPassword,
  getAcceptInvite, postAcceptInvite
} = require('../controllers/authController');

router.get('/register', getRegister);
router.post('/register', postRegister);
router.get('/login', getLogin);
router.post('/login', postLogin);
router.get('/logout', logout);
router.get('/forgot-password', getForgotPassword);
router.post('/forgot-password', postForgotPassword);
router.get('/reset-password/:token', getResetPassword);
router.post('/reset-password/:token', postResetPassword);
router.get('/accept-invite/:token', getAcceptInvite);
router.post('/accept-invite/:token', postAcceptInvite);

module.exports = router;
