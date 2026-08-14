const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  priceMonthly: { type: Number, required: true },
  maxAgents: { type: Number, default: 1 },
  features: [String],
  createdAt: { type: Date, default: Date.now }
});

const ClinicSubscriptionSchema = new mongoose.Schema({
  clinicId: { type: Number, required: true, default: 1 },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  packageName: { type: String, required: true },
  priceMonthly: { type: Number, required: true },
  status: { type: String, default: 'active' }, // active, cancelled
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SubscriptionInvoiceSchema = new mongoose.Schema({
  clinicId: { type: Number, required: true, default: 1 },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicSubscription', required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'paid' },
  dueDate: { type: Date, required: true, default: Date.now },
  paidDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const Package = mongoose.model('Package', PackageSchema);
const ClinicSubscription = mongoose.model('ClinicSubscription', ClinicSubscriptionSchema);
const SubscriptionInvoice = mongoose.model('SubscriptionInvoice', SubscriptionInvoiceSchema);

module.exports = { Package, ClinicSubscription, SubscriptionInvoice };
