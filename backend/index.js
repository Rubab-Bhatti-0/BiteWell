const mongoose = require('mongoose');
require('dotenv').config();
const createApp = require('./app');

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required. Copy .env.example to .env and configure it.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`DentalPay API is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
