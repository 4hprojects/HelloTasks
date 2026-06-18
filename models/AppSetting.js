const mongoose = require('mongoose');

const appSettingSchema = new mongoose.Schema({
  _id: { type: String, default: 'app' },
  appName: { type: String, default: 'HelloTasks' },
  supportEmail: { type: String, default: '' },
  openRegistration: { type: Boolean, default: true },
  weeklyReportNote: { type: String, default: '' },
  weeklyReportAutoSend: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('AppSetting', appSettingSchema);
