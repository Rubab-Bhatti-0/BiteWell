const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSignup, validateLogin, validateGoogleLogin } = require('../middleware/validate');

function response() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test('signup validation normalizes valid data', () => {
  const req = { body: { name: '  Dr. Rubab  ', email: ' RUBAB@example.com ', password: 'secure-pass', clinicName: ' Clinic ', phone: ' 0300 ' } };
  const res = response();
  let called = false;
  validateSignup(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(req.body.name, 'Dr. Rubab');
  assert.equal(req.body.email, 'rubab@example.com');
  assert.equal(req.body.clinicName, 'Clinic');
  assert.equal(res.statusCode, 200);
});

test('signup validation rejects weak passwords', () => {
  const req = { body: { name: 'Rubab', email: 'rubab@example.com', password: 'short' } };
  const res = response();
  validateSignup(req, res, () => assert.fail('next should not be called'));
  assert.equal(res.statusCode, 400);
});

test('login validation rejects malformed credentials', () => {
  const req = { body: { email: 'not-an-email', password: '' } };
  const res = response();
  validateLogin(req, res, () => assert.fail('next should not be called'));
  assert.equal(res.statusCode, 400);
});

test('Google validation rejects an empty credential', () => {
  const req = { body: { credential: '   ' } };
  const res = response();
  validateGoogleLogin(req, res, () => assert.fail('next should not be called'));
  assert.equal(res.statusCode, 400);
});
