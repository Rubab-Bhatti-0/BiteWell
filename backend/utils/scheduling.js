const crypto = require('crypto');

const INACTIVE_APPOINTMENT_STATUSES = ['cancelled', 'completed', 'no_show'];

function asValidDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateAppointmentRange(startAt, endAt) {
  const start = asValidDate(startAt);
  const end = asValidDate(endAt);

  if (!start || !end) {
    return { valid: false, error: 'Start and end date/time must be valid.' };
  }

  if (end <= start) {
    return { valid: false, error: 'Appointment end time must be after its start time.' };
  }

  if (end.getTime() - start.getTime() > 8 * 60 * 60 * 1000) {
    return { valid: false, error: 'An appointment cannot be longer than 8 hours.' };
  }

  return { valid: true, start, end };
}

function intervalsOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return new Date(firstStart) < new Date(secondEnd)
    && new Date(firstEnd) > new Date(secondStart);
}

function reminderDeduplicationKey({ type, sourceId, channel, scheduledFor, message = '' }) {
  const source = sourceId || crypto
    .createHash('sha256')
    .update(`${scheduledFor}|${message}`)
    .digest('hex')
    .slice(0, 20);

  return `${type}:${source}:${channel}`;
}

function normalizePhone(value) {
  const phone = String(value || '').trim();
  if (!phone) return '';
  if (phone.startsWith('+')) return `+${phone.slice(1).replace(/\D/g, '')}`;
  return phone.replace(/\D/g, '');
}

module.exports = {
  INACTIVE_APPOINTMENT_STATUSES,
  asValidDate,
  validateAppointmentRange,
  intervalsOverlap,
  reminderDeduplicationKey,
  normalizePhone
};
