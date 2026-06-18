const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const AppSetting = require('../models/AppSetting');
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

async function conditionalAuthLimit(req, res, next) {
  const settings = await AppSetting.findById('app').lean();
  if (!settings || !settings.authRateLimitEnabled) return next();
  return authLimiter(req, res, next);
}

router.get('/register', getRegister);
router.post('/register', conditionalAuthLimit, postRegister);
router.get('/login', getLogin);
router.post('/login', conditionalAuthLimit, postLogin);
router.get('/logout', logout);
router.get('/forgot-password', getForgotPassword);
router.post('/forgot-password', conditionalAuthLimit, postForgotPassword);
router.get('/reset-password/:token', getResetPassword);
router.post('/reset-password/:token', conditionalAuthLimit, postResetPassword);
router.get('/accept-invite/:token', getAcceptInvite);
router.post('/accept-invite/:token', conditionalAuthLimit, postAcceptInvite);

module.exports = router;
