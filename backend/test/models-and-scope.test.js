const test = require('node:test');
const assert = require('node:assert/strict');
const Patient = require('../models/Patient.model');
const Treatment = require('../models/Treatment.model');
const scopedQuery = require('../utils/scopedQuery');

const clinicId = '60c72b2f9b1d8b2bad000001';

test('scoped filter always keeps the authenticated clinic ID', () => {
  const req = { user: { clinicId } };
  const filter = scopedQuery.filter(req, {
    clinicId: '60c72b2f9b1d8b2bad000099',
    status: 'cleared'
  });

  assert.equal(filter.clinicId, clinicId);
  assert.equal(filter.status, 'cleared');
});

test('patient schema accepts a valid clinical record', async () => {
  const patient = new Patient({
    clinicId,
    name: 'Ayesha Khan',
    phone: '+92 300 1234567',
    age: 29,
    gender: 'female',
    status: 'uncleared',
    toothChart: [{ toothNumber: 8, condition: 'Decayed' }]
  });

  await assert.doesNotReject(() => patient.validate());
});

test('patient schema rejects an invalid tooth number and condition', async () => {
  const patient = new Patient({
    clinicId,
    name: 'Ayesha Khan',
    phone: '+92 300 1234567',
    toothChart: [{ toothNumber: 33, condition: 'Unknown' }]
  });

  await assert.rejects(() => patient.validate());
});

test('treatment schema rejects a negative default cost', async () => {
  const treatment = new Treatment({
    clinicId,
    name: 'Root Canal',
    defaultCost: -1
  });

  await assert.rejects(() => treatment.validate());
});
