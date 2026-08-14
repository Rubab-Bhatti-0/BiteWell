import React, { useState, useEffect } from "react";
import { CreditCard, Check, Zap, Sparkles, Calendar, ShieldCheck, Tag, Download, Printer, History } from "lucide-react";

export default function BillingSubscriptions() {
  const [packages, setPackages] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [subHistory, setSubHistory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isAnnual, setIsAnnual] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const fetchData = async () => {
    try {
      const [pkgsRes, subRes, histRes, invRes] = await Promise.all([
        fetch('http://localhost:5000/api/subscriptions/packages'),
        fetch('http://localhost:5000/api/subscriptions/current'),
        fetch('http://localhost:5000/api/subscriptions/history'),
        fetch('http://localhost:5000/api/subscriptions/invoices')
      ]);
      if (pkgsRes.ok) setPackages(await pkgsRes.json());
      if (subRes.ok) setCurrentSub(await subRes.json());
      if (histRes.ok) setSubHistory(await histRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
    } catch (err) {
      console.error("Failed to fetch billing data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/subscriptions/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedPromo(promoCode.trim().toUpperCase());
        showToast(data.message);
      } else {
        showToast(data.error || "Invalid promo code");
      }
    } catch (err) {
      showToast("Error validating promo code");
    }
  };

  const handleSubscribe = async (packageId, isUpgrade = false) => {
    setLoading(true);
    try {
      const endpoint = isUpgrade ? 'http://localhost:5000/api/subscriptions/subscribe' : 'http://localhost:5000/api/subscriptions/subscribe';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, isAnnual, promoCode: appliedPromo })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Subscription updated successfully!");
        fetchData();
      } else {
        showToast(data.error || "Failed to update subscription");
      }
    } catch (err) {
      showToast("Error processing request");
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async (packageId) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/subscriptions/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Subscription downgraded successfully (history preserved).");
        fetchData();
      } else {
        showToast(data.error || "Failed to downgrade");
      }
    } catch (err) {
      showToast("Error processing downgrade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#0A567D] text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-[#084767] to-[#0A567D] text-white p-6 rounded-xl shadow-md">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#00A3E1]/30 text-sky-200 text-xs font-semibold tracking-wide uppercase">
            DentalPay Subscription & Billing Hub
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Clinic Plan & Billing Management
          </h1>
          <p className="text-sm text-sky-100 max-w-xl">
            Manage subscription tiers, annual billing discounts, promo coupons, and historical invoices with complete audit history preservation.
          </p>
        </div>
        {currentSub && (
          <div className="bg-white/15 backdrop-blur border border-white/20 p-4 rounded-lg text-right">
            <span className="text-xs text-sky-200 uppercase tracking-wide font-medium">Current Active Plan</span>
            <div className="text-xl font-extrabold text-white">{currentSub.packageName || currentSub.packageId?.name || "Standard"}</div>
            <div className="text-xs text-sky-200">Expires: {new Date(currentSub.endDate).toLocaleDateString()}</div>
          </div>
        )}
      </div>

      {/* Billing Controls: Annual Toggle & Promo Code */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white border p-4 rounded-xl gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="annual-mode"
            checked={isAnnual}
            onChange={(e) => setIsAnnual(e.target.checked)}
            className="w-4 h-4 text-[#0A567D] rounded focus:ring-[#0A567D]"
          />
          <label htmlFor="annual-mode" className="font-medium cursor-pointer text-sm">
            Annual Billing <span className="text-emerald-600 font-bold ml-1">(Save 20%)</span>
          </label>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex items-center">
            <Tag className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Promo Code (e.g. DENTAL10)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border rounded-md w-60 focus:outline-none focus:ring-2 focus:ring-[#0A567D]"
            />
          </div>
          <button
            onClick={handleApplyPromo}
            className="px-4 py-2 text-sm border border-[#0A567D] text-[#0A567D] hover:bg-slate-50 font-medium rounded-md"
          >
            Apply
          </button>
          {appliedPromo && (
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
              {appliedPromo} Applied
            </span>
          )}
        </div>
      </div>

      {/* Current Subscription Details Card */}
      {currentSub && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-slate-50 flex items-center gap-2 text-[#0A567D] font-semibold">
            <ShieldCheck className="h-5 w-5" /> Current Subscription & Payment Method
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-6 items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Plan Name</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{currentSub.packageName || currentSub.packageId?.name || "Standard"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Price</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">${currentSub.priceMonthly || currentSub.packageId?.priceMonthly || "20.00"} / mo</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Renewal Date</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">{new Date(currentSub.endDate).toLocaleDateString()}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-[#0A567D]" />
              <div>
                <p className="text-xs font-semibold">Visa ending in 4242</p>
                <p className="text-[10px] text-gray-500">Auto-renew enabled</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Package Catalog */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
          <Zap className="h-5 w-5 text-[#00A3E1]" /> Available Packages & Catalog
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.length === 0 ? (
            <p className="text-sm text-gray-500">Loading packages...</p>
          ) : (
            packages.map((pkg) => {
              const currentPkgId = currentSub?.packageId?._id || currentSub?.packageId;
              const isCurrent = currentPkgId === pkg._id;
              const features = pkg.features || [];
              let displayPrice = Number(pkg.priceMonthly);
              if (isAnnual) displayPrice = displayPrice * 0.8;
              if (appliedPromo) displayPrice = displayPrice * 0.9;

              return (
                <div key={pkg._id} className={`relative bg-white border rounded-xl shadow-sm p-6 flex flex-col justify-between ${isCurrent ? 'ring-2 ring-[#0A567D] bg-sky-50/20' : ''}`}>
                  {isCurrent && (
                    <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-[#0A567D] text-white text-xs font-semibold shadow">
                      Current Plan
                    </span>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-[#0A567D]">${displayPrice.toFixed(2)}</span>
                      <span className="text-xs text-gray-500 ml-1">/ month {isAnnual ? '(billed annually)' : ''}</span>
                    </div>

                    <div className="space-y-2 border-t pt-4 mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan Features:</p>
                      {features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    {isCurrent ? (
                      <button disabled className="w-full py-2 bg-slate-100 text-slate-400 font-medium rounded-md cursor-not-allowed">
                        Active Plan
                      </button>
                    ) : !currentSub ? (
                      <button
                        disabled={loading}
                        onClick={() => handleSubscribe(pkg._id)}
                        className="w-full py-2 bg-[#0A567D] hover:bg-[#084767] text-white font-medium rounded-md shadow-sm transition"
                      >
                        Subscribe Now
                      </button>
                    ) : Number(pkg.priceMonthly) > Number(currentSub.priceMonthly || currentSub.packageId?.priceMonthly || 0) ? (
                      <button
                        disabled={loading}
                        onClick={() => handleSubscribe(pkg._id, true)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-sm transition"
                      >
                        Upgrade to {pkg.name}
                      </button>
                    ) : (
                      <button
                        disabled={loading}
                        onClick={() => handleDowngrade(pkg._id)}
                        className="w-full py-2 border border-[#0A567D] text-[#0A567D] hover:bg-slate-50 font-medium rounded-md transition"
                      >
                        Downgrade to {pkg.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Subscription History */}
      <div className="space-y-4 pt-4 border-t">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
          <History className="h-5 w-5 text-[#0A567D]" /> Subscription History & Audit Trail
        </h2>
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y">
            {subHistory.length > 0 ? (
              subHistory.map((sub) => (
                <div key={sub._id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Subscription #{sub._id.slice(-6)} ({sub.packageName}) — {sub.status.toUpperCase()}</p>
                    <p className="text-xs text-gray-500">
                      Started: {new Date(sub.startDate).toLocaleDateString()} • Expires: {new Date(sub.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${sub.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    {sub.status.toUpperCase()}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">No subscription history found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Invoices History */}
      <div className="space-y-4 pt-4 border-t">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
          <CreditCard className="h-5 w-5 text-[#0A567D]" /> Billing & Invoice History
        </h2>
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y">
            {invoices.length > 0 ? (
              invoices.map((inv) => (
                <div key={inv._id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Invoice #{inv._id.slice(-6)}</p>
                    <p className="text-xs text-gray-500">Issued: {new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-900">${inv.amount}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                      {inv.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#0A567D] bg-slate-50 border rounded hover:bg-slate-100"
                    >
                      <Download className="h-3.5 w-3.5" /> View Receipt
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">No invoices generated yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#0A567D] flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> DentalPay Invoice Receipt
              </h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Invoice ID</span>
                <span className="font-semibold">#{selectedInvoice._id.slice(-6)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Issue Date</span>
                <span className="font-semibold">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-semibold">Visa ending in 4242</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Status</span>
                <span className="font-semibold text-emerald-600">{selectedInvoice.status.toUpperCase()}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold text-[#0A567D]">
                <span>Total Paid</span>
                <span>${selectedInvoice.amount} USD</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm border rounded-md font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <button
                onClick={() => {
                  const receiptContent = `========================================
DENTALPAY OFFICIAL INVOICE RECEIPT
========================================
Invoice ID: #${selectedInvoice._id}
Issue Date: ${new Date(selectedInvoice.createdAt).toLocaleDateString()}
Payment Method: Visa ending in 4242
Status: ${selectedInvoice.status.toUpperCase()}
----------------------------------------
Total Amount Paid: $${selectedInvoice.amount} USD
========================================
Thank you for using DentalPay!
`;
                  const blob = new Blob([receiptContent], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `DentalPay_Invoice_${selectedInvoice._id.slice(-6)}.txt`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  showToast("Invoice downloaded successfully!");
                  setSelectedInvoice(null);
                }}
                className="px-4 py-2 text-sm bg-[#0A567D] text-white rounded-md font-medium hover:bg-[#084767] flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
