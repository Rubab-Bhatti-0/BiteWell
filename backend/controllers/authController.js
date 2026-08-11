const Clinic = require('../models/Clinic');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'dentalpay-dev-secret';

// Helper to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new clinic and admin user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  const { name, email, password, clinicName, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    const clinic = await Clinic.create({
      name: clinicName || `${name}'s Clinic`,
      phone: phone || ''
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      clinicId: clinic._id,
      name,
      email,
      passwordHash: hashedPassword,
      role: 'admin',
      phone: phone || '',
      isActive: true
    });

    if (user) {
      return res.status(201).json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId,
          clinicName: clinic.name,
          subscriptionPlan: clinic.subscriptionPlan,
          subscriptionStatus: clinic.subscriptionStatus
        }
      });
    }

    return res.status(400).json({ message: 'Invalid user data' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('clinicId');

    if (user && (await user.comparePassword(password))) {
      return res.json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId ? user.clinicId._id : null,
          clinicName: user.clinicId ? user.clinicId.name : 'DentalPay Clinic',
          subscriptionPlan: user.clinicId ? user.clinicId.subscriptionPlan : 'free',
          subscriptionStatus: user.clinicId ? user.clinicId.subscriptionStatus : 'active'
        }
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Login/Signup using Google OAuth ID Token
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    let email, name, picture;

    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.startsWith('your-google-client-id')) {
      const decodedToken = jwt.decode(credential);
      if (decodedToken) {
        email = decodedToken.email;
        name = decodedToken.name;
        picture = decodedToken.picture;
      } else {
        email = 'googleuser@dentalpay.com';
        name = 'Google User';
        picture = '';
      }
    } else {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    let user = await User.findOne({ email }).populate('clinicId');

    if (!user) {
      const clinic = await Clinic.create({
        name: `${name}'s Clinic`,
        logoUrl: picture || '',
      });

      user = await User.create({
        clinicId: clinic._id,
        name,
        email,
        passwordHash: Math.random().toString(36).slice(-8),
        role: 'admin',
        isActive: true,
      });

      user = await User.findById(user._id).populate('clinicId');
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'User account has been deactivated' });
    }

    return res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId ? user.clinicId._id : null,
        clinicName: user.clinicId ? user.clinicId.name : 'DentalPay Clinic',
        subscriptionPlan: user.clinicId ? user.clinicId.subscriptionPlan : 'free',
        subscriptionStatus: user.clinicId ? user.clinicId.subscriptionStatus : 'active'
      }
    });
  } catch (error) {
    return res.status(400).json({ message: 'Google authentication failed: ' + error.message });
  }
};

