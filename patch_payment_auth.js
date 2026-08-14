const fs = require('node:fs');
const path = 'D:/Rubab/web_development/BiteWell/frontend/src/services/payment.service.js';
let source = fs.readFileSync(path, 'utf8');
const old = /const getHeaders = \(\) => \(\{[\s\S]*?\n\}\);/;
const replacement = `const getHeaders = () => {
  const token = localStorage.getItem('token');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }
  const clinicId = user?.clinicId?._id || user?.clinicId || '60c72b2f9b1d8b2bad000001';
  return {
    'Content-Type': 'application/json',
    'x-clinic-id': clinicId,
    ...(token ? { Authorization: \\`Bearer \\${token}\\` } : {})
  };
};`;
if (!old.test(source)) throw new Error('Payment service headers block not found.');
source = source.replace(old, replacement);
fs.writeFileSync(path, source);
console.log('Payment authentication headers enabled.');
