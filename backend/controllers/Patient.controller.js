const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Patient = require('../models/Patient.model');
const Treatment = require('../models/Treatment.model');
const scopedQuery = require('../utils/scopedQuery');

const asyncHandler = (handler) => (req, res, next) => (
  Promise.resolve(handler(req, res, next)).catch(next)
);

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const assertObjectId = (id, label = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw httpError(400, `Invalid ${label} format.`);
  }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeStringArray = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw httpError(400, `${fieldName} must be an array of strings.`);
  }

  return [...new Set(value.map((entry) => entry.trim()).filter(Boolean))];
};

const parseAge = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const age = Number(value);
  if (!Number.isInteger(age) || age < 0 || age > 150) {
    throw httpError(400, 'Age must be a whole number between 0 and 150.');
  }
  return age;
};

const validateRequiredIdentity = ({ name, phone }) => {
  if (typeof name !== 'string' || !name.trim()) {
    throw httpError(400, 'Patient name is required.');
  }
  if (typeof phone !== 'string' || !phone.trim()) {
    throw httpError(400, 'Patient phone number is required.');
  }
  if (!/^\+?[\d\s()-]{7,30}$/.test(phone.trim())) {
    throw httpError(400, 'Patient phone number format is invalid.');
  }
};

const buildPatientFilter = (query) => {
  const filter = {};

  if (query.status && query.status !== 'all') {
    if (!['cleared', 'uncleared'].includes(query.status)) {
      throw httpError(400, 'Status must be all, cleared, or uncleared.');
    }
    filter.status = query.status;
  }

  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: searchRegex }, { phone: searchRegex }];
  }

  return filter;
};

const parsePagination = (query) => {
  const page = Number.parseInt(query.page ?? '1', 10);
  const limit = Number.parseInt(query.limit ?? '10', 10);

  if (!Number.isInteger(page) || page < 1) {
    throw httpError(400, 'Page must be a positive integer.');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw httpError(400, 'Limit must be an integer between 1 and 100.');
  }

  return { page, limit, skip: (page - 1) * limit };
};

const findScopedPatient = (req, patientId) => (
  scopedQuery.findOne(req, Patient, { _id: patientId })
);

const storedFilePath = (attachmentUrl) => (
  path.join(__dirname, '..', 'uploads', path.basename(attachmentUrl))
);

const removeStoredFile = async (attachmentUrl) => {
  if (!attachmentUrl) return;
  try {
    await fs.promises.unlink(storedFilePath(attachmentUrl));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Unable to remove attachment ${attachmentUrl}:`, error.message);
    }
  }
};

// POST /api/patients
const createPatient = async (req, res) => {
  validateRequiredIdentity(req.body);

  const allergies = normalizeStringArray(req.body.allergies, 'Allergies') ?? [];
  const medicalConditions = normalizeStringArray(
    req.body.medicalConditions,
    'Medical conditions'
  ) ?? [];

  const patient = await Patient.create({
    clinicId: req.user.clinicId,
    name: req.body.name.trim(),
    phone: req.body.phone.trim(),
    email: typeof req.body.email === 'string' ? req.body.email.trim() : '',
    age: parseAge(req.body.age),
    gender: req.body.gender || 'other',
    bloodGroup: typeof req.body.bloodGroup === 'string'
      ? req.body.bloodGroup.trim()
      : '',
    status: req.body.status || 'uncleared',
    notes: typeof req.body.notes === 'string' ? req.body.notes.trim() : '',
    allergies,
    medicalConditions
  });

  res.status(201).json(patient);
};

// GET /api/patients
const getPatients = async (req, res) => {
  const filter = buildPatientFilter(req.query);
  const { page, limit, skip } = parsePagination(req.query);

  const [patients, total] = await Promise.all([
    scopedQuery(req, Patient, filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Patient.countDocuments(scopedQuery.filter(req, filter))
  ]);

  res.json({
    data: patients,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit))
  });
};

// GET /api/patients/export
const getPatientsForExport = async (req, res) => {
  const filter = buildPatientFilter(req.query);
  const patients = await scopedQuery(req, Patient, filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(10000)
    .lean();

  res.json({ data: patients, total: patients.length });
};

// GET /api/patients/:id
const getPatientById = async (req, res) => {
  assertObjectId(req.params.id, 'patient ID');
  const patient = await findScopedPatient(req, req.params.id).lean();

  if (!patient) {
    throw httpError(404, 'Patient not found.');
  }

  res.json(patient);
};

// PUT /api/patients/:id
const updatePatient = async (req, res) => {
  assertObjectId(req.params.id, 'patient ID');
  const patient = await findScopedPatient(req, req.params.id);

  if (!patient) {
    throw httpError(404, 'Patient not found.');
  }

  if (req.body.name !== undefined || req.body.phone !== undefined) {
    validateRequiredIdentity({
      name: req.body.name ?? patient.name,
      phone: req.body.phone ?? patient.phone
    });
  }

  if (req.body.name !== undefined) patient.name = req.body.name.trim();
  if (req.body.phone !== undefined) patient.phone = req.body.phone.trim();
  if (req.body.email !== undefined) {
    patient.email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  }
  if (req.body.age !== undefined) patient.age = parseAge(req.body.age);
  if (req.body.gender !== undefined) patient.gender = req.body.gender;
  if (req.body.bloodGroup !== undefined) {
    patient.bloodGroup = typeof req.body.bloodGroup === 'string'
      ? req.body.bloodGroup.trim()
      : '';
  }
  if (req.body.status !== undefined) patient.status = req.body.status;
  if (req.body.notes !== undefined) {
    patient.notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';
  }

  await patient.save();
  res.json(patient);
};

// DELETE /api/patients/:id
const deletePatient = async (req, res) => {
  assertObjectId(req.params.id, 'patient ID');
  const patient = await findScopedPatient(req, req.params.id);

  if (!patient) {
    throw httpError(404, 'Patient not found.');
  }

  const attachmentUrls = patient.attachments.map((attachment) => attachment.url);
  await Patient.deleteOne(scopedQuery.filter(req, { _id: patient._id }));
  await Promise.all(attachmentUrls.map(removeStoredFile));

  res.json({ message: 'Patient and associated attachments deleted successfully.' });
};

// PUT /api/patients/:id/tooth-chart
const updateToothChart = async (req, res) => {
  assertObjectId(req.params.id, 'patient ID');
  if (!Array.isArray(req.body)) {
    throw httpError(400, 'Tooth chart must be an array.');
  }

  const seenToothNumbers = new Set();
  const treatmentIds = new Set();
  const validConditions = new Set(Patient.toothConditions);

  const toothChart = req.body.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw httpError(400, 'Every tooth-chart entry must be an object.');
    }

    const toothNumber = Number(entry.toothNumber);
    if (!Number.isInteger(toothNumber) || toothNumber < 1 || toothNumber > 32) {
      throw httpError(400, 'Tooth number must be a whole number from 1 to 32.');
    }
    if (seenToothNumbers.has(toothNumber)) {
      throw httpError(400, `Tooth number ${toothNumber} appears more than once.`);
    }
    seenToothNumbers.add(toothNumber);

    const condition = entry.condition || 'Healthy';
    if (!validConditions.has(condition)) {
      throw httpError(400, `Invalid condition for tooth ${toothNumber}.`);
    }

    let treatmentId = null;
    if (entry.treatmentId) {
      assertObjectId(entry.treatmentId, 'treatment ID');
      treatmentId = entry.treatmentId;
      treatmentIds.add(String(entry.treatmentId));
    }

    return {
      toothNumber,
      condition,
      treatmentId,
      notes: typeof entry.notes === 'string' ? entry.notes.trim() : ''
    };
  });

  if (treatmentIds.size > 0) {
    const matchingTreatments = await scopedQuery(req, Treatment, {
      _id: { $in: [...treatmentIds] }
    }).select('_id').lean();

    if (matchingTreatments.length !== treatmentIds.size) {
      throw httpError(400, 'One or more treatments are invalid for this clinic.');
    }
  }

  const patient = await findScopedPatient(req, req.params.id);
  if (!patient) {
    throw httpError(404, 'Patient not found.');
  }

  patient.toothChart = toothChart.sort((a, b) => a.toothNumber - b.toothNumber);
  await patient.save();
  res.json(patient);
};

// PUT /api/patients/:id/medical-info
const updateMedicalInfo = async (req, res) => {
  assertObjectId(req.params.id, 'patient ID');
  const patient = await findScopedPatient(req, req.params.id);

  if (!patient) {
    throw httpError(404, 'Patient not found.');
  }

  const allergies = normalizeStringArray(req.body.allergies, 'Allergies');
  const medicalConditions = normalizeStringArray(
    req.body.medicalConditions,
    'Medical conditions'
  );

  if (allergies === undefined && medicalConditions === undefined) {
    throw httpError(400, 'Provide allergies or medicalConditions to update.');
  }
  if (allergies !== undefined) patient.allergies = allergies;
  if (medicalConditions !== undefined) patient.medicalConditions = medicalConditions;

  await patient.save();
  res.json(patient);
};

// POST /api/patients/:id/attachments
const addAttachment = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    if (req.file) await removeStoredFile(req.file.filename);
    throw httpError(400, 'Invalid patient ID format.');
  }
  if (!req.file) {
    throw httpError(400, 'Select an image or PDF to upload.');
  }

  let patient;
  try {
    patient = await findScopedPatient(req, req.params.id);
  } catch (error) {
    await removeStoredFile(req.file.filename);
    throw error;
  }
  if (!patient) {
    await removeStoredFile(req.file.filename);
    throw httpError(404, 'Patient not found.');
  }

  patient.attachments.push({
    url: `/uploads/${req.file.filename}`,
    type: req.file.mimetype.startsWith('image/') ? 'image' : 'pdf',
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedAt: new Date()
  });

  try {
    await patient.save();
  } catch (error) {
    await removeStoredFile(req.file.filename);
    throw error;
  }

  res.status(201).json(patient);
};

// DELETE /api/patients/:id/attachments/:attachmentId
const deleteAttachment = async (req, res) => {
  assertObjectId(req.params.id, 'patient ID');
  assertObjectId(req.params.attachmentId, 'attachment ID');

  const patient = await findScopedPatient(req, req.params.id);
  if (!patient) {
    throw httpError(404, 'Patient not found.');
  }

  const attachment = patient.attachments.id(req.params.attachmentId);
  if (!attachment) {
    throw httpError(404, 'Attachment not found.');
  }

  const attachmentUrl = attachment.url;
  attachment.deleteOne();
  await patient.save();
  await removeStoredFile(attachmentUrl);

  res.json(patient);
};

// GET /api/patients/summary
const getPatientsSummary = async (req, res) => {
  const clinicId = new mongoose.Types.ObjectId(String(req.user.clinicId));
  const rows = await Patient.aggregate([
    { $match: { clinicId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const summary = { total: 0, cleared: 0, uncleared: 0 };
  rows.forEach(({ _id, count }) => {
    summary.total += count;
    if (_id === 'cleared') summary.cleared = count;
    if (_id === 'uncleared') summary.uncleared = count;
  });

  res.json(summary);
};

module.exports = {
  createPatient: asyncHandler(createPatient),
  getPatients: asyncHandler(getPatients),
  getPatientsForExport: asyncHandler(getPatientsForExport),
  getPatientById: asyncHandler(getPatientById),
  updatePatient: asyncHandler(updatePatient),
  deletePatient: asyncHandler(deletePatient),
  updateToothChart: asyncHandler(updateToothChart),
  updateMedicalInfo: asyncHandler(updateMedicalInfo),
  addAttachment: asyncHandler(addAttachment),
  deleteAttachment: asyncHandler(deleteAttachment),
  getPatientsSummary: asyncHandler(getPatientsSummary)
};
