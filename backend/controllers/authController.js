import Clinic from '../models/Clinic.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new clinic and admin user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  const { name, email, password, clinicName, phone } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    // 1. Create the Clinic
    const clinic = await Clinic.create({
      name: clinicName || `${name}'s Clinic`,
      phone: phone || ''
    });

    // 2. Create the User (role: admin)
    const user = await User.create({
      clinicId: clinic._id,
      name,
      email,
      passwordHash: password, // Pre-save hook will hash this
      role: 'admin',
      phone: phone || '',
      isActive: true
    });

    if (user) {
      res.status(201).json({
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
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email }).populate('clinicId');

    if (user && (await user.comparePassword(password))) {
      res.json({
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
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login/Signup using Google OAuth ID Token
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    // For development, if client ID is default placeholder, allow simulated bypass
    let email, name, picture;
    
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.startsWith('your-google-client-id')) {
      // Simulate OAuth decoding for testing when client ID is not yet customized by the user
      // Token is decoded as jwt token (unsigned or directly read)
      const decodedToken = jwt.decode(credential);
      if (decodedToken) {
        email = decodedToken.email;
        name = decodedToken.name;
        picture = decodedToken.picture;
      } else {
        // Fallback dummy user if not a real JWT
        email = 'googleuser@dentalpay.com';
        name = 'Google User';
        picture = '';
      }
    } else {
      // Verify token with Google Library
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    // Find or create user
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
        passwordHash: Math.random().toString(36).slice(-8), // Dummy password
        role: 'admin',
        isActive: true,
      });

      user = await User.findById(user._id).populate('clinicId');
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'User account has been deactivated' });
    }

    res.json({
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
    res.status(400).json({ message: 'Google authentication failed: ' + error.message });
  }
};

