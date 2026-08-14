const fs = require('node:fs');

const appPath = 'D:/Rubab/web_development/BiteWell/frontend/src/App.jsx';
let app = fs.readFileSync(appPath, 'utf8');

const appReplacements = [
  ["import { Toaster } from 'sonner';", "import { Toaster } from 'sonner';\nimport PaymentDashboard from './components/payments/PaymentDashboard';"],
  ["case 'aiAgents':", "case 'payments':\n        return <PaymentDashboard onAlert={addAlert} />;\n      case 'aiAgents':"],
  ["disabled: true, note: 'Group 1 Scope'", "disabled: false, note: ''"],
];
for (const [from, to] of appReplacements) {
  if (!app.includes(from)) throw new Error(`Missing App.jsx marker: ${from}`);
  app = app.replace(from, to);
}
fs.writeFileSync(appPath, app);

const backendPath = 'D:/Rubab/web_development/BiteWell/backend/app.js';
let backend = fs.readFileSync(backendPath, 'utf8');
const backendReplacements = [
  ["const subscriptionRoutes = require('./routes/Subscription.routes');", "const subscriptionRoutes = require('./routes/Subscription.routes');\nconst paymentRoutes = require('./routes/Payment.routes');"],
  ["  app.use(\n    '/api/subscription',\n    subscriptionRoutes\n  );", "  app.use(\n    '/api/subscription',\n    subscriptionRoutes\n  );\n  app.use(\n    '/api/payments',\n    paymentRoutes\n  );"],
];
for (const [from, to] of backendReplacements) {
  if (!backend.includes(from)) throw new Error(`Missing app.js marker: ${from}`);
  backend = backend.replace(from, to);
}
fs.writeFileSync(backendPath, backend);
console.log('Payment frontend and backend wiring applied.');
