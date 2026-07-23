import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, CheckCircle2, AlertCircle, DollarSign, Calendar, Clock,
  ArrowUpRight, Plus, Activity, ArrowRight, ChevronRight, Search
} from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Dashboard({ onNavigate, onViewPatient, onAlert }) {
  const [summary, setSummary] = useState({ total: 0, cleared: 0, uncleared: 0 });
  const [loading, setLoading] = useState(true);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/patients/summary');
      if (!res.ok) throw new Error('Failed to load dashboard summary.');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
      onAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [onAlert]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const query = patientSearch.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          search: query,
          status: 'all',
          page: '1',
          limit: '5'
        });
        const response = await apiFetch(`/api/patients?${params}`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error('Patient search failed.');
        const result = await response.json();
        setSearchResults(result.data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          onAlert({ type: 'danger', message: error.message });
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [patientSearch, onAlert]);

  // Mocked details to complete high fidelity dashboard
  const mockVisits = [
    { name: 'Robert Hawkins', treatment: 'Root Canal Therapy', time: '09:00 AM', status: 'Confirmed', initial: 'RH' },
    { name: 'Alice Miller', treatment: 'Routine Cleaning', time: '10:30 AM', status: 'Waiting', initial: 'AM' },
    { name: 'Eliza Jones', treatment: 'Crown Fitting', time: '01:15 PM', status: 'Confirmed', initial: 'EJ' }
  ];

  const mockActivities = [
    { text: 'Payment Received: $1,500.00 from Johnathan Doe', time: '2 minutes ago', type: 'payment' },
    { text: 'New Patient Registered: Maria Gonzales was added', time: '1 hour ago', type: 'register' },
    { text: 'Invoice Overdue: Patient #17892 - David Rossi', time: '3 hours ago', type: 'overdue' },
    { text: 'Appointment Confirmed: Dr. Alex for Emily Thorne', time: '4 hours ago', type: 'appt' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Practice Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, Dr. Chan. Here's what's happening today.</p>
      </div>

      {/* Aggregation Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Patients Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex justify-between items-center relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Patients</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {loading ? '...' : summary.total.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-500 font-bold flex items-center bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-sm">
                +12% <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
            <p className="text-xs text-slate-400">Active clinic registries</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-slate-900 flex items-center justify-center text-[#00A3E1]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Cleared Patients Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex justify-between items-center relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cleared Accounts</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#0A567D] dark:text-[#00A3E1]">
                {loading ? '...' : summary.cleared.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-500 font-bold flex items-center bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-sm">
                94% rate
              </span>
            </div>
            <p className="text-xs text-slate-400">Zero outstanding balance</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-slate-900 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Uncleared Patients Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex justify-between items-center relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Uncleared Accounts</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-500">
                {loading ? '...' : summary.uncleared.toLocaleString()}
              </span>
              <span className="text-[11px] text-rose-500 font-bold flex items-center bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-sm">
                Needs review
              </span>
            </div>
            <p className="text-xs text-slate-400">Installments pending</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-slate-900 flex items-center justify-center text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Charts & Visual Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART: Revenue Growth (2/3 width on desktop) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-md font-bold text-slate-900 dark:text-white">Revenue Growth</h3>
              <p className="text-xs text-slate-400">Monthly billing performance</p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 px-2.5 py-1.5 rounded-lg">
              Last 6 Months
            </span>
          </div>

          {/* Premium Animated CSS Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2">
            {[
              { month: 'Feb', value: 34200, height: '45%' },
              { month: 'Mar', value: 41900, height: '58%' },
              { month: 'Apr', value: 38200, height: '52%' },
              { month: 'May', value: 52100, height: '75%' },
              { month: 'Jun', value: 48900, height: '68%' },
              { month: 'Jul', value: 64200, height: '90%', active: true }
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                {/* Tooltip */}
                <span className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 dark:bg-slate-900 dark:border-slate-700 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity translate-y-1">
                  ${(bar.value/1000).toFixed(1)}k
                </span>
                
                {/* Bar */}
                <div 
                  style={{ height: bar.height }} 
                  className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 cursor-pointer ${
                    bar.active 
                      ? 'bg-gradient-to-t from-[#084767] to-[#00A3E1] shadow-md shadow-[#00A3E1]/15' 
                      : 'bg-sky-50 dark:bg-slate-900 hover:bg-sky-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-800'
                  }`}
                ></div>
                
                <span className="text-xs font-semibold text-slate-400">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-[#E2E8F0] dark:border-slate-700/80 shadow-xs space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-slate-900 dark:text-white">Quick Actions</h3>
            <p className="text-xs text-slate-400 mb-5">Common patient operations</p>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder="Search patients..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#00A3E1] dark:border-slate-700 dark:bg-slate-900"
              />
              {patientSearch.trim().length >= 2 && (
                <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {searching ? (
                    <p className="p-3 text-xs text-slate-400">Searching...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="p-3 text-xs text-slate-400">No matching patient found.</p>
                  ) : (
                    searchResults.map((patient) => (
                      <button
                        key={patient._id}
                        type="button"
                        onClick={() => onViewPatient(patient._id)}
                        className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
                      >
                        <span>
                          <span className="block text-xs font-bold text-slate-800 dark:text-white">
                            {patient.name}
                          </span>
                          <span className="block text-[10px] text-slate-400">{patient.phone}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate('patients')} 
                className="w-full flex items-center justify-between p-3.5 bg-sky-50/50 hover:bg-sky-50 text-[#0A567D] hover:text-[#084767] border border-sky-100 rounded-xl transition-all font-semibold text-sm cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#00A3E1]" /> Add New Patient
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button 
                onClick={() => onNavigate('patients')} 
                className="w-full flex items-center justify-between p-3.5 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-100 rounded-xl transition-all font-semibold text-sm cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Collect Patient Payment
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button 
                onClick={() => onNavigate('patients')} 
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl transition-all font-semibold text-sm cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Book Appointment
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Monthly Target Collection:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">$45,000 / $50,000</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-600 w-[90%] rounded-full"></div>
            </div>
          </div>
        </div>

      </div>

      {/* Lower Row: Visits & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Visits */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-md font-bold text-slate-900 dark:text-white">Upcoming Visits Today</h3>
              <p className="text-xs text-slate-400">Scheduled clinical operations</p>
            </div>
            <button 
              onClick={() => onNavigate('patients')}
              className="text-xs font-semibold text-[#00A3E1] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Calendar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {mockVisits.map((visit, i) => (
              <div key={i} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-slate-900 text-[#0A567D] font-bold flex items-center justify-center border border-sky-100/50">
                    {visit.initial}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{visit.name}</h4>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{visit.treatment}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#00A3E1]" /> {visit.time}
                  </span>
                  <button 
                    onClick={() => onNavigate('patients')}
                    className="px-3 py-1 bg-[#0A567D] hover:bg-[#084767] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Check In
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-md font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <p className="text-xs text-slate-400">Live event logs</p>
          </div>

          <div className="space-y-4">
            {mockActivities.map((act, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="mt-0.5 text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-[#00A3E1]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 leading-normal">
                    {act.text}
                  </p>
                  <span className="text-[10px] text-slate-400">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
