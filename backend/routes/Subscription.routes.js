const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { downgradeSubscription } = require('../controllers/Subscription.controller');

const router = express.Router();
router.use(authMiddleware);

router.post('/downgrade', downgradeSubscription);

module.exports = router;