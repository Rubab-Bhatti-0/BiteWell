const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment.model');
const scopedQuery = require('../utils/scopedQuery');
const {
  validateAppointmentRange,
  intervalsOverlap,
  reminderDeduplicationKey,
  normalizePhone
} = require('../utils/scheduling');

test('scoped filter cannot be overridden by a caller', () => {
  const req = { user: { clinicId: '60c72b2f9b1d8b2bad000001' } };
  const filter = scopedQuery.filter(req, {
    clinicId: '60c72b2f9b1d8b2bad999999',
    status: 'scheduled'
  });
  assert.equal(filter.clinicId, req.user.clinicId);
  assert.equal(filter.status, 'scheduled');
});

test('appointment range accepts a valid interval', () => {
  const result = validateAppointmentRange(
    '2026-08-01T09:00:00.000Z',
    '2026-08-01T09:30:00.000Z'
  );
  assert.equal(result.valid, true);
});

test('appointment range rejects an end time before the start', () => {
  const result = validateAppointmentRange(
    '2026-08-01T10:00:00.000Z',
    '2026-08-01T09:30:00.000Z'
  );
  assert.equal(result.valid, false);
});

test('overlap detection catches partial overlaps but not adjacent visits', () => {
  assert.equal(intervalsOverlap(
    '2026-08-01T09:00:00.000Z',
    '2026-08-01T10:00:00.000Z',
    '2026-08-01T09:30:00.000Z',
    '2026-08-01T10:30:00.000Z'
  ), true);
  assert.equal(intervalsOverlap(
    '2026-08-01T09:00:00.000Z',
    '2026-08-01T10:00:00.000Z',
    '2026-08-01T10:00:00.000Z',
    '2026-08-01T10:30:00.000Z'
  ), false);
});

test('appointment schema rejects an invalid interval', async () => {
  const appointment = new Appointment({
    clinicId: new mongoose.Types.ObjectId(),
    patientId: new mongoose.Types.ObjectId(),
    doctorId: new mongoose.Types.ObjectId(),
    patientName: 'Test Patient',
    doctorName: 'Test Doctor',
    title: 'Checkup',
    startAt: new Date('2026-08-01T10:00:00.000Z'),
    endAt: new Date('2026-08-01T09:00:00.000Z'),
    createdBy: new mongoose.Types.ObjectId(),
    updatedBy: new mongoose.Types.ObjectId()
  });
  await assert.rejects(
    () => appointment.validate(),
    (error) => Boolean(error.errors && error.errors.endAt)
  );
});

test('reminder keys are deterministic and phone numbers are normalized', () => {
  const sourceId = new mongoose.Types.ObjectId();
  const first = reminderDeduplicationKey({
    type: 'visit_upcoming',
    sourceId,
    channel: 'sms'
  });
  const second = reminderDeduplicationKey({
    type: 'visit_upcoming',
    sourceId,
    channel: 'sms'
  });
  assert.equal(first, second);
  assert.equal(normalizePhone('+92 300-1234567'), '+923001234567');
});
