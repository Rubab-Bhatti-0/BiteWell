const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value) => (typeof value === 'string' ? value.trim() : '');

function validateSignup(req, res, next) {
  const name = text(req.body?.name);
  const email = text(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const clinicName = text(req.body?.clinicName);
  const phone = text(req.body?.phone);

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ message: 'Name must be between 2 and 100 characters.' });
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' });
  }
  if (clinicName.length > 120 || phone.length > 30) {
    return res.status(400).json({ message: 'Clinic name or phone number is too long.' });
  }

  req.body.name = name;
  req.body.email = email;
  req.body.clinicName = clinicName;
  req.body.phone = phone;
  next();
}

function validateLogin(req, res, next) {
  const email = text(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!EMAIL_PATTERN.test(email) || email.length > 254 || password.length === 0) {
    return res.status(400).json({ message: 'A valid email and password are required.' });
  }

  req.body.email = email;
  next();
}

function validateGoogleLogin(req, res, next) {
  if (typeof req.body?.credential !== 'string' || req.body.credential.trim().length === 0) {
    return res.status(400).json({ message: 'Google credential is required.' });
  }
  req.body.credential = req.body.credential.trim();
  next();
}

module.exports = { validateSignup, validateLogin, validateGoogleLogin };
