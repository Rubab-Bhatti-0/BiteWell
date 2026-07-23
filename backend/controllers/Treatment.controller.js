const Treatment = require('../models/Treatment.model');
const scopedQuery = require('../utils/scopedQuery');

// POST /api/treatments - create a treatment
const createTreatment = async (req, res) => {
  try {
    const { name, defaultCost, category, isActive } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Treatment name is required and cannot be empty.' });
    }

    if (defaultCost === undefined || defaultCost === null || isNaN(defaultCost) || Number(defaultCost) <= 0) {
      return res.status(400).json({ error: 'Default cost must be a positive number.' });
    }

    const treatment = new Treatment({
      clinicId: req.user.clinicId,
      name: name.trim(),
      defaultCost: Number(defaultCost),
      category: category || 'General',
      isActive: isActive !== undefined ? isActive : true
    });

    await treatment.save();
    res.status(201).json(treatment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/treatments - list all treatments for the clinic
const getTreatments = async (req, res) => {
  try {
    const extraFilter = {};
    if (req.query.isActive !== undefined) {
      extraFilter.isActive = req.query.isActive === 'true';
    }

    const treatments = await scopedQuery(req, Treatment, extraFilter);
    res.status(200).json(treatments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/treatments/:id - edit treatment name/cost/category/isActive
const updateTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, defaultCost, category, isActive } = req.body;

    // Check ownership first
    const treatment = await Treatment.findOne({ _id: id, clinicId: req.user.clinicId });
    if (!treatment) {
      return res.status(404).json({ error: 'Treatment not found or unauthorized.' });
    }

    // Validation if field is provided
    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({ error: 'Treatment name cannot be empty.' });
      }
      treatment.name = name.trim();
    }

    if (defaultCost !== undefined) {
      if (isNaN(defaultCost) || Number(defaultCost) <= 0) {
        return res.status(400).json({ error: 'Default cost must be a positive number.' });
      }
      treatment.defaultCost = Number(defaultCost);
    }

    if (category !== undefined) {
      treatment.category = category;
    }

    if (isActive !== undefined) {
      treatment.isActive = isActive;
    }

    await treatment.save();
    res.status(200).json(treatment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/treatments/:id - soft-delete treatment by setting isActive: false
const deleteTreatment = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and update active status
    const treatment = await Treatment.findOne({ _id: id, clinicId: req.user.clinicId });
    if (!treatment) {
      return res.status(404).json({ error: 'Treatment not found or unauthorized.' });
    }

    treatment.isActive = false;
    await treatment.save();

    res.status(200).json({ message: 'Treatment soft-deleted successfully.', treatment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTreatment,
  getTreatments,
  updateTreatment,
  deleteTreatment
};
