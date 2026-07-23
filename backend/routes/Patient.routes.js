const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
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
} = require('../controllers/Patient.controller');

const { authMiddleware } = require('../middleware/auth');

// Apply auth middleware to all patient routes
router.use(authMiddleware);

// Setup multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Summary stats aggregation (must be declared BEFORE /:id)
router.get('/summary', getPatientsSummary);

// Base CRUD routes
router.post('/', createPatient);
router.get('/', getPatients);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

// Clinical sub-routes
router.put('/:id/tooth-chart', updateToothChart);
router.put('/:id/medical-info', updateMedicalInfo);

// Attachments sub-routes
router.post('/:id/attachments', upload.single('attachment'), addAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

module.exports = router;
