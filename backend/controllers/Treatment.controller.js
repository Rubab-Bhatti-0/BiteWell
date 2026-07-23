const mongoose = require('mongoose');
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

const assertObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw httpError(400, 'Invalid treatment ID format.');
  }
};

const parseCost = (value) => {
  const cost = Number(value);
  if (!Number.isFinite(cost) || cost <= 0) {
    throw httpError(400, 'Default cost must be a positive number.');
  }
  return cost;
};

// POST /api/treatments
const createTreatment = async (req, res) => {
  if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
    throw httpError(400, 'Treatment name is required.');
  }
  if (req.body.defaultCost === undefined || req.body.defaultCost === null) {
    throw httpError(400, 'Default cost is required.');
  }

  const treatment = await Treatment.create({
    clinicId: req.user.clinicId,
    name: req.body.name.trim(),
    defaultCost: parseCost(req.body.defaultCost),
    category: typeof req.body.category === 'string' && req.body.category.trim()
      ? req.body.category.trim()
      : 'General',
    isActive: req.body.isActive ?? true
  });

  res.status(201).json(treatment);
};

// GET /api/treatments
const getTreatments = async (req, res) => {
  const filter = {};
  if (req.query.isActive !== undefined) {
    if (!['true', 'false'].includes(req.query.isActive)) {
      throw httpError(400, 'isActive must be true or false.');
    }
    filter.isActive = req.query.isActive === 'true';
  }

  const treatments = await scopedQuery(req, Treatment, filter)
    .sort({ isActive: -1, name: 1 })
    .lean();

  res.json(treatments);
};

// PUT /api/treatments/:id
const updateTreatment = async (req, res) => {
  assertObjectId(req.params.id);
  const treatment = await scopedQuery.findOne(req, Treatment, { _id: req.params.id });

  if (!treatment) {
    throw httpError(404, 'Treatment not found.');
  }

  if (req.body.name !== undefined) {
    if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
      throw httpError(400, 'Treatment name cannot be empty.');
    }
    treatment.name = req.body.name.trim();
  }
  if (req.body.defaultCost !== undefined) {
    treatment.defaultCost = parseCost(req.body.defaultCost);
  }
  if (req.body.category !== undefined) {
    if (typeof req.body.category !== 'string' || !req.body.category.trim()) {
      throw httpError(400, 'Treatment category cannot be empty.');
    }
    treatment.category = req.body.category.trim();
  }
  if (req.body.isActive !== undefined) {
    if (typeof req.body.isActive !== 'boolean') {
      throw httpError(400, 'isActive must be a boolean.');
    }
    treatment.isActive = req.body.isActive;
  }

  await treatment.save();
  res.json(treatment);
};

// DELETE /api/treatments/:id (soft delete)
const deleteTreatment = async (req, res) => {
  assertObjectId(req.params.id);
  const treatment = await scopedQuery.findOne(req, Treatment, { _id: req.params.id });

  if (!treatment) {
    throw httpError(404, 'Treatment not found.');
  }

  treatment.isActive = false;
  await treatment.save();

  res.json({
    message: 'Treatment deactivated successfully.',
    treatment
  });
};

module.exports = {
  createTreatment: asyncHandler(createTreatment),
  getTreatments: asyncHandler(getTreatments),
  updateTreatment: asyncHandler(updateTreatment),
  deleteTreatment: asyncHandler(deleteTreatment)
};
