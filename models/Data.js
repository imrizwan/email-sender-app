const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
  email: String,
  status: { type: String, enum: ['Pending', 'Sent', 'Failed', 'Follow Up 1', 'Follow Up 2', 'Follow Up 3', 'Replied'] },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Data', DataSchema);
