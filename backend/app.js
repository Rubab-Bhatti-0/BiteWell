const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/Patient.routes');
const treatmentRoutes = require('./routes/Treatment.routes');
const appointmentRoutes = require('./routes/Appointment.routes');
const reminderRoutes = require('./routes/Reminder.routes');
const schedulingRoutes = require('./routes/Scheduling.routes');
const agentRoutes = require('./routes/Agent.routes');
const subscriptionRoutes = require('./routes/Subscription.routes');

function createApp() {
  const app = express();

  // =========================
  // CORS
  // =========================
  const configuredOrigin =
    process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  app.use(
    cors({
      origin:
        process.env.NODE_ENV === 'production'
          ? configuredOrigin
          : true,

      methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
      ],

      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-clinic-id',
        'x-user-role',
        'x-user-is-owner',
        'x-user-id',
      ],

      credentials: true,
    })
  );

  // =========================
  // BODY PARSERS
  // =========================
  app.use(express.json({ limit: '1mb' }));

  app.use(
    express.urlencoded({
      extended: true,
    })
  );

  // =========================
  // STATIC UPLOADS
  // =========================
  app.use(
    '/uploads',
    express.static(
      path.join(__dirname, 'uploads')
    )
  );

  // =========================
  // HEALTH CHECK
  // =========================
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // =========================
  // AUTHENTICATION
  // =========================
  app.use(
    '/api/auth',
    authRoutes
  );

  // =========================
  // EXISTING FEATURES
  // =========================
  app.use(
    '/api/patients',
    patientRoutes
  );

  app.use(
    '/api/treatments',
    treatmentRoutes
  );

  // =========================
  // ATIQA'S SCHEDULING FEATURES
  // =========================
  app.use(
    '/api/appointments',
    appointmentRoutes
  );

  app.use(
    '/api/reminders',
    reminderRoutes
  );

  app.use(
    '/api/scheduling',
    schedulingRoutes
  );

  // =========================
  // AI AGENTS & SUBSCRIPTION
  // =========================
  app.use(
    '/api',
    agentRoutes
  );

  app.use(
    '/api/subscription',
    subscriptionRoutes
  );

  // =========================
  // 404 HANDLER
  // =========================
  app.use((req, res) => {
    res.status(404).json({
      error: 'API route not found.',
      path: req.originalUrl,
    });
  });

  // =========================
  // ERROR HANDLER
  // =========================
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    // Multer errors
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File size exceeds the 5MB limit.'
          : err.message;

      return res.status(400).json({
        error: message,
      });
    }

    // Invalid file type
    if (
      err.message &&
      err.message.includes('Invalid file type')
    ) {
      return res.status(400).json({
        error: err.message,
      });
    }

    // General error
    return res.status(500).json({
      error: 'Internal server error.',
    });
  });

  return app;
}

module.exports = createApp;