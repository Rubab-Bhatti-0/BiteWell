const express = require('express');
const { signup, login, googleLogin } = require('../controllers/authController');
const { validateSignup, validateLogin, validateGoogleLogin } = require('../middleware/validate');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/google', validateGoogleLogin, googleLogin);

module.exports = router;
