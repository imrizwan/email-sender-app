const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Data = require('./models/Data'); // Your Mongoose model
require('dotenv').config()

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Connect to MongoDB
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(
    () => { console.log("Connected to Database") },
    err => { console.log("Error connecting to Database", err) }
  )

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');

  // Path to the emailList.json file
  const emailListPath = path.join(__dirname, 'data/extracted_data1.json');

  // Read JSON file
  fs.readFile(emailListPath, 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return;
    }

    try {
      const emails = JSON.parse(data); // Parse the JSON data

      // Loop through each email in the JSON
      for (const item of emails) {
        const email = item.email;
        const isEmailValid = isValidEmail(email);
        // Check if the email already exists in the database
        if (isEmailValid) {
          const emailExists = await Data.findOne({ email });

          if (emailExists) {
            console.log(`Email ${email} already exists, skipping...`);
          } else {
            // Insert the new email
            const newData = new Data({
              email,
              status: 'Pending', // Set default status
            });

            await newData.save();
            console.log(`Inserted email: ${email}`);
          }
        }
      }

      console.log('Process completed.');
    } catch (parseErr) {
      console.error('Error parsing JSON file:', parseErr);
    } finally {
      mongoose.connection.close(); // Close the connection after the operation
    }
  });
});
