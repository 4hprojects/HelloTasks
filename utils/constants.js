const INVITE_EXPIRY_MS       = 72 * 60 * 60 * 1000;  // 72 hours
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;      // 1 hour
const REMEMBER_ME_MS         = 30 * 24 * 60 * 60 * 1000; // 30 days
const DUE_DATE_REMINDER_CRON = '0 8 * * *';            // daily at 08:00 server time

module.exports = { INVITE_EXPIRY_MS, PASSWORD_RESET_EXPIRY_MS, REMEMBER_ME_MS, DUE_DATE_REMINDER_CRON };
