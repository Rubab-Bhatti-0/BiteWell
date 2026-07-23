const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const patientRoutes = require('./routes/Patient.routes');
const treatmentRoutes = require('./routes/Treatment.routes');

const createApp = () => {
  const app = express();
  const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-clinic-id',
      'x-user-role',
      'x-user-is-owner',
      'x-user-id'
    ]
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  app.use('/api/patients', patientRoutes);
  app.use('/api/treatments', treatmentRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  // Express requires all four arguments for an error-handling middleware.
  app.use((error, req, res, next) => {
    void req;
    void next;

    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds the 5MB limit.'
        : error.message;
      return res.status(400).json({ error: message });
    }

    if (error.message?.startsWith('Invalid file type')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message === 'Origin is not allowed by CORS.') {
      return res.status(403).json({ error: error.message });
    }

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || 'record';
      return res.status(409).json({
        error: `A ${duplicatedField} with this value already exists in this clinic.`
      });
    }

    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0]?.message;
      return res.status(400).json({ error: firstMessage || 'Validation failed.' });
    }

    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
      console.error('Unhandled API error:', error);
    }

    return res.status(statusCode).json({
      error: statusCode >= 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error.'
        : error.message || 'Internal server error.'
    });
  });

  return app;
};

module.exports = createApp;
