const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing. Add it to .env or Render settings.');
  if (uri.includes('<your-cluster>') || uri.includes('<db_user>') || uri.includes('<db_password>')) {
    throw new Error('MONGODB_URI still contains placeholders. Update server/.env with your own MongoDB connection string.');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

module.exports = connectDB;
