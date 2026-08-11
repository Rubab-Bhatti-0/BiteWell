const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const patientRoutes = require('./routes/Patient.routes');
const treatmentRoutes = require('./routes/Treatment.routes');
const appointmentRoutes = require('./routes/Appointment.routes');
const reminderRoutes = require('./routes/Reminder.routes');
const schedulingRoutes = require('./routes/Scheduling.routes');

function createApp() {
  const app = express();
  const configuredOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? configuredOrigin : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
  app.use(express.urlencoded({ extended: true }));
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
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/reminders', reminderRoutes);
  app.use('/api/scheduling', schedulingRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds the 5MB limit.'
        : err.message;
      return res.status(400).json({ error: message });
    }
    if (err.message && err.message.includes('Invalid file type')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

module.exports = createApp;
