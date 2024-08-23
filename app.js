const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const EmailLog = require('./models/EmailLog');
const Data = require('./models/Data');
const emailLogsRouter = require('./routes/emailLogs');
const cron = require('node-cron'); // Import node-cron
const nodemailer = require('nodemailer');
require('dotenv').config()

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(
    () => { console.log("Connected to Database") },
    err => { console.log("Error connecting to Database", err) }
  )


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
let emailIndex = 0;
// Send emails function
async function sendEmails() {
  const business = await Data.findOne({ status: { $in: ['Failed', 'Pending'] } })
  if (business) {
    const { email: to } = business;
    // Make sure content is passed as an object
    ejs.renderFile('./views/emailTemplate.ejs', {}, async (err, renderedContent) => {
      if (err) {
        console.error('Error rendering email content:', err);
        return;
      }

      const from = '"Ezaan Tech Services" <hello@services.ezaan.tech>';
      const subject = "Transform Your Business with Professional Website Design & Digital Solutions – 50% Off!";
      const mailOptions = {
        from,
        to,
        subject,
        html: renderedContent, // Send the rendered HTML content
      };

      // Send email using Nodemailer
      transporter.sendMail(mailOptions, async (error, info) => {
        console.log("error", error)
        const status = error ? 'Failed' : 'Sent';

        // Log email to MongoDB
        await EmailLog.create({ to, from, subject, status })
        await Data.updateOne({ email: to }, {
          $set: {
            email: to,
            status
          }
        })
        console.log(`Email to ${to}: ${status}`);
      });
    });

    emailIndex++;
  }
}

// Schedule emails to be sent every `emailInterval` using cron
cron.schedule(`*/3 * * * *`, sendEmails); // Run the task every hour at the appropriate interval

// Email logs router
app.use('/emailLogs', emailLogsRouter);

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
