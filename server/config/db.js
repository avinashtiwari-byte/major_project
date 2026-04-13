const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    // Check if the developer has provided a MongoDB URI inside the .env file.
    if (!mongoUri) {
      console.error(
        '\n======================================================\n' +
        '⚠️ LIVE DATABASE ERROR: MONGO_URI is missing from .env\n' +
        'You must get a connection string from MongoDB Atlas and\n' +
        'save it in your .env file as MONGO_URI=mongodb+srv://...\n' +
        '======================================================\n'
      );
      process.exit(1); // Stop the server from running until live DB is connected
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ Live MongoDB Connected: ${conn.connection.host}`);
    
  } catch (error) {
    console.error(`❌ Live MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
