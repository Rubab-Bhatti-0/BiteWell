const mongoose = require('mongoose');
require('dotenv').config();

const createApp = require('./app');

// =========================
// CONFIG
// =========================

const PORT = process.env.PORT || 5000;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/dentalpay';

// =========================
// CREATE APP
// =========================

const app = createApp();

// =========================
// CONNECT DATABASE
// =========================

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');

    // =========================
    // START SERVER
    // =========================

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      'MongoDB database connection error:',
      err
    );

    process.exit(1);
  });