const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  listReminders,
  createCustomReminder,
  syncReminders,
  sendOneReminder,
  cancelReminder
} = require('../controllers/Reminder.controller');

const router = express.Router();
router.use(authMiddleware);

router.get('/', listReminders);
router.post('/', createCustomReminder);
router.post('/sync', syncReminders);
router.post('/:id/send', sendOneReminder);
router.patch('/:id/cancel', cancelReminder);

module.exports = router;
