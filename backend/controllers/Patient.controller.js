const Patient = require('../models/Patient.model');
const Treatment = require('../models/Treatment.model');
const scopedQuery = require('../utils/scopedQuery');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Helper to check if string is a valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/patients - create a patient
const createPatient = async (req, res) => {
  try {
    const { name, phone, email, age, gender, bloodGroup, status, notes } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Patient name is required.' });
    }

    if (!phone || phone.trim() === '') {
      return res.status(400).json({ error: 'Patient phone number is required.' });
    }

    // Phone duplicate validation in the same clinic
    const existingPatient = await Patient.findOne({
      clinicId: req.user.clinicId,
      phone: phone.trim()
    });

    if (existingPatient) {
      return res.status(400).json({
        error: 'Duplicate phone number. A patient with this phone number already exists in this clinic.',
        isDuplicate: true
      });
    }

    // Age validation
    if (age !== undefined && age !== null && (isNaN(age) || Number(age) < 0)) {
      return res.status(400).json({ error: 'Age must be a positive number.' });
    }

    const patient = new Patient({
      clinicId: req.user.clinicId,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      age: age ? Number(age) : undefined,
      gender,
      bloodGroup,
      status: status || 'uncleared',
      notes: notes || '',
      allergies: [],
      medicalConditions: [],
      toothChart: [],
      attachments: [],
      createdAt: new Date()
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/patients - search, filter, and paginate patients
const getPatients = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Apply status filter if provided (cleared/uncleared)
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Apply search filter (name or phone)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex }
      ];
    }

    const currentPage = parseInt(page);
    const limitCount = parseInt(limit);
    const skipCount = (currentPage - 1) * limitCount;

    // Use scopedQuery to ensure multi-tenancy isolation
    // Since scopedQuery returns a Mongoose Query, we can chain count and pagination
    const baseQuery = Patient.find({ clinicId: req.user.clinicId, ...filter });
    const total = await Patient.countDocuments({ clinicId: req.user.clinicId, ...filter });
    const patients = await baseQuery.skip(skipCount).limit(limitCount).sort({ createdAt: -1 });

    res.status(200).json({
      data: patients,
      total,
      page: currentPage,
      pages: Math.ceil(total / limitCount)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/patients/:id - view patient details
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid patient ID format.' });
    }

    const patient = await Patient.findOne({ _id: id, clinicId: req.user.clinicId });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or unauthorized.' });
    }

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/patients/:id - edit basic patient fields only
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, age, gender, bloodGroup, status, notes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid patient ID format.' });
    }

    const patient = await Patient.findOne({ _id: id, clinicId: req.user.clinicId });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or unauthorized.' });
    }

    // Validation
    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({ error: 'Patient name cannot be empty.' });
      }
      patient.name = name.trim();
    }

    if (phone !== undefined) {
      if (phone.trim() === '') {
        return res.status(400).json({ error: 'Patient phone number cannot be empty.' });
      }
      // Check phone duplicate (excluding self)
      const existingPatient = await Patient.findOne({
        clinicId: req.user.clinicId,
        phone: phone.trim(),
        _id: { $ne: id }
      });
      if (existingPatient) {
        return res.status(400).json({ error: 'Phone number already in use by another patient.' });
      }
      patient.phone = phone.trim();
    }

    if (email !== undefined) patient.email = email.trim();
    if (age !== undefined) {
      if (age !== null && (isNaN(age) || Number(age) < 0)) {
        return res.status(400).json({ error: 'Age must be a positive number.' });
      }
      patient.age = age ? Number(age) : undefined;
    }
    if (gender !== undefined) patient.gender = gender;
    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
    if (status !== undefined) patient.status = status;
    if (notes !== undefined) patient.notes = notes;

    await patient.save();
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/patients/:id - hard delete patient
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid patient ID format.' });
    }

    const patient = await Patient.findOne({ _id: id, clinicId: req.user.clinicId });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or unauthorized.' });
    }

    // Delete associated files from local storage
    if (patient.attachments && patient.attachments.length > 0) {
      patient.attachments.forEach(attachment => {
        try {
          const filePath = path.join(__dirname, '..', attachment.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileErr) {
          console.error(`Failed to delete file on disk: ${attachment.url}`, fileErr);
        }
      });
    }

    await Patient.deleteOne({ _id: id });
    res.status(200).json({ message: 'Patient and associated attachments deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/patients/:id/tooth-chart - update complete tooth chart array
const updateToothChart = async (req, res) => {
  try {
    const { id } = req.params;
    const toothChart = req.body; // Full array of { toothNumber, condition, treatmentId, notes }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid patient ID format.' });
    }

    if (!Array.isArray(toothChart)) {
      return res.status(400).json({ error: 'Tooth chart must be an array.' });
    }

    const patient = await Patient.findOne({ _id: id, clinicId: req.user.clinicId });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or unauthorized.' });
    }

    // Validate treatmentIds exist and belong to the same clinic
    for (const entry of toothChart) {
      if (entry.treatmentId) {
        if (!isValidObjectId(entry.treatmentId)) {
          return res.status(400).json({ error: `Invalid Treatment ID: ${entry.treatmentId}` });
        }
        const treatment = await Treatment.findOne({ _id: entry.treatmentId, clinicId: req.user.clinicId });
        if (!treatment) {
          return res.status(400).json({ error: `Treatment with ID ${entry.treatmentId} not found or belongs to another clinic.` });
        }
      }
    }

    // Update chart
    patient.toothChart = toothChart.map(entry => ({
      toothNumber: Number(entry.toothNumber),
      condition: entry.condition || '',
      treatmentId: entry.treatmentId || null,
      notes: entry.notes || ''
    }));

    await patient.save();
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/patients/:id/medical-info - update allergies and medical conditions
const updateMedicalInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { allergies, medicalConditions } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid patient ID format.' });
    }

    const patient = await Patient.findOne({ _id: id, clinicId: req.user.clinicId });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or unauthorized.' });
    }

    if (allergies !== undefined) {
      if (!Array.isArray(allergies)) {
        return res.status(400).json({ error: 'Allergies must be an array of strings.' });
      }
      patient.allergies = allergies.map(s => s.trim());
    }

    if (medicalConditions !== undefined) {
      if (!Array.isArray(medicalConditions)) {
        return res.status(400).json({ error: 'Medical conditions must be an array of strings.' });
      }
      patient.medicalConditions = medicalConditions.map(s => s.trim());
    }

    await patient.save();
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/patients/:id/attachments - upload files and save metadata
const addAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid patient ID format.' });
    }

    const patient = await Patient.findOne({ _id: id, clinicId: req.user.clinicId });
    if (!patient) {
      // Clean up uploaded file if patient not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Patient not found or unauthorized.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file does not meet validation criteria.' });
    }

    // The file url path (statically served by the backend)
    const relativeUrl = `uploads/${req.file.filename}`;
    const attachmentEntry = {
      url: relativeUrl,
      type: req.file.mimetype.startsWith('image/') ? 'image' : 'pdf',
      uploadedAt: new Date()
    };

    patient.attachments.push(attachmentEntry);
    await patient.save();

    res.status(201).json(patient);
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {}
    }
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/patients/:id/attachments/:attachmentId - delete attachment file and reference
const deleteAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid patient ID format.' });
    }

    const patient = await Patient.findOne({ _id: id, clinicId: req.user.clinicId });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or unauthorized.' });
    }

    const attachmentIndex = patient.attachments.findIndex(
      att => att._id.toString() === attachmentId
    );

    if (attachmentIndex === -1) {
      return res.status(404).json({ error: 'Attachment not found.' });
    }

    const attachment = patient.attachments[attachmentIndex];
    // Delete file from disk
    const filePath = path.join(__dirname, '..', attachment.url);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileErr) {
      console.error(`Failed to delete file on disk: ${filePath}`, fileErr);
    }

    // Remove from array
    patient.attachments.splice(attachmentIndex, 1);
    await patient.save();

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/dashboard/patients-summary - aggregation counts for clinic
const getPatientsSummary = async (req, res) => {
  try {
    const clinicObjectId = new mongoose.Types.ObjectId(req.user.clinicId);

    const summary = await Patient.aggregate([
      { $match: { clinicId: clinicObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Parse aggregation result
    let total = 0;
    let cleared = 0;
    let uncleared = 0;

    summary.forEach(group => {
      total += group.count;
      if (group._id === 'cleared') {
        cleared = group.count;
      } else if (group._id === 'uncleared') {
        uncleared = group.count;
      }
    });

    res.status(200).json({
      total,
      cleared,
      uncleared
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  updateToothChart,
  updateMedicalInfo,
  addAttachment,
  deleteAttachment,
  getPatientsSummary
};