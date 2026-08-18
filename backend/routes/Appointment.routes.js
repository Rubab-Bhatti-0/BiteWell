const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  createAppointment,
  listAppointments,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  getNextPatientVisit
} = require('../controllers/Appointment.controller');

const router = express.Router();
router.use(authMiddleware);

router.get('/patient/:patientId/next', getNextPatientVisit);
router.get('/', listAppointments);
router.post('/', createAppointment);
router.get('/:id', getAppointment);
router.put('/:id', updateAppointment);
router.patch('/:id/cancel', cancelAppointment);

module.exports = router;
