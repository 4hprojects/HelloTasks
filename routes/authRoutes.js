const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  getRegister, postRegister,
  getLogin, postLogin, logout,
  getForgotPassword, postForgotPassword,
  getResetPassword, postResetPassword,
  getAcceptInvite, postAcceptInvite
} = require('../controllers/authController');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many attempts — please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/register', getRegister);
router.post('/register', authLimiter, postRegister);
router.get('/login', getLogin);
router.post('/login', authLimiter, postLogin);
router.get('/logout', logout);
router.get('/forgot-password', getForgotPassword);
router.post('/forgot-password', authLimiter, postForgotPassword);
router.get('/reset-password/:token', getResetPassword);
router.post('/reset-password/:token', authLimiter, postResetPassword);
router.get('/accept-invite/:token', getAcceptInvite);
router.post('/accept-invite/:token', authLimiter, postAcceptInvite);

module.exports = router;
