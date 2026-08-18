const express = require('express');
const router = express.Router();
const {
  createTreatment,
  getTreatments,
  updateTreatment,
  deleteTreatment
} = require('../controllers/Treatment.controller');
const { authMiddleware } = require('../middleware/auth');

// Apply auth middleware to all treatment routes
router.use(authMiddleware);

router.post('/', createTreatment);
router.get('/', getTreatments);
router.put('/:id', updateTreatment);
router.delete('/:id', deleteTreatment);

module.exports = router;
