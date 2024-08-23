const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  to: String,
  from: String,
  subject: String,
  content: String,
  status: { type: String, enum: ['Pending', 'Sent', 'Failed', 'Follow Up 1', 'Follow Up 2', 'Follow Up 3', 'Replied'] },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmailLog', EmailLogSchema);
