const express = require('express');
const router = express.Router();
const EmailLog = require('../models/EmailLog');

// Route to display email logs
router.get('/', async (req, res) => {
  const logs = await EmailLog.find({});
  const totalEmails = await EmailLog.countDocuments({});
  const hourlyEmails = await EmailLog.countDocuments({
    timestamp: {
      $gte: new Date(Date.now() - 60 * 60 * 1000) // Emails in the last hour
    }
  });

  res.render('dashboard', { logs, totalEmails, hourlyEmails });
});

module.exports = router;
