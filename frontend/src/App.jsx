import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, HeartHandshake, FileBarChart, Bell, Sun, Moon, 
  Menu, X, Calendar, CreditCard, Send, Settings, UserCheck, ShieldAlert, CheckCircle2, Info, AlertTriangle, LogOut, BarChart3
} from 'lucide-react';
import { Toaster } from 'sonner';

// Import subcomponents - Existing
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import PatientProfile from './components/PatientProfile';
import TreatmentCatalog from './components/TreatmentCatalog';
import Reports from './components/Reports';
import WelcomeScreen from './components/WelcomeScreen';
import AIAgentsPage from './pages/AIAgentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import SettingsPage from './components/SettingsPage';

// Import payment components
import PaymentDashboard from './components/payments/PaymentDashboard';
import PaymentSummary from './components/payments/PaymentSummary';
import CreateInstallmentPlan from './components/payments/CreateInstallmentPlan';
import CollectPaymentModal from './components/payments/CollectPaymentModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('welcome'); // welcome, dashboard, patients, treatments, reports, aiAgents
  const [selectedPatientId, setSelectedPatientId] = useState(null); // specific patient detail view
  //const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Alerts System
  const [alerts, setAlerts] = useState([]);

  // Payment modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [patientData, setPatientData] = useState(null);

  // Sync dark mode class on html node
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load saved theme on first load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Fetch treatments when needed
  useEffect(() => {
    if (activeTab === 'payments') {
      fetchTreatments();
    }
  }, [activeTab]);

  const fetchTreatments = async () => {
    try {
      const response = await fetch('/api/treatments', {
        headers: {
          'x-clinic-id': '60c72b2f9b1d8b2bad000001'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTreatments(data);
      }
    } catch (error) {
      console.error('Failed to fetch treatments:', error);
    }
  };

  const addAlert = ({ type = 'info', message }) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(al => al.id !== id));
    }, 4000);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(al => al.id !== id));
  };

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setSelectedPatientId(null);
    setShowPaymentModal(false);
    setShowCollectModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setActiveTab('welcome');
    setSelectedPatientId(null);
    addAlert({ type: 'success', message: 'Successfully logged out.' });
  };

  const handleViewPatient = (patientId) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
  };

  const isAuthScreen = activeTab === 'login' || activeTab === 'signup';
  const isWelcome = activeTab === 'welcome';
  // Open create payment plan modal
  const handleOpenPaymentModal = (patientId, patientName) => {
    setPatientData({ patientId, patientName });
    setShowPaymentModal(true);
  };

  // Open collect payment modal
  const handleOpenCollectModal = (installment) => {
    setSelectedInstallment(installment);
    setShowCollectModal(true);
  };

  // Render view depending on navigation state
  const renderContent = () => {
    if (activeTab === 'patients' && selectedPatientId) {
      return (
        <PatientProfile 
          patientId={selectedPatientId} 
          onBack={() => setSelectedPatientId(null)}
          onAlert={addAlert}
          onOpenPaymentModal={handleOpenPaymentModal}
        />
      );
    }

    switch (activeTab) {
      case 'welcome':
        return <WelcomeScreen onNavigate={handleNavigate} />;
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} onAlert={addAlert} />;
      
      case 'patients':
        return <PatientList onViewPatient={handleViewPatient} onAlert={addAlert} />;
      case 'aiAgents':
        return <AIAgentsPage onNavigate={handleNavigate} />;
      case 'aiAnalytics':
        return <AnalyticsPage onNavigate={handleNavigate} />;
      
      case 'payments':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">💰 Payments</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage installment plans and track patient payments
              </p>
            </div>
            
            {/* Payment Dashboard */}
            <PaymentDashboard onAlert={addAlert} />
            
            {/* Payment Summary for selected patient */}
            {selectedPatientId ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Patient Payment Summary
                  </h2>
                  <button
                    onClick={() => setSelectedPatientId(null)}
                    className="text-sm text-[#00A3E1] hover:underline cursor-pointer"
                  >
                    View All Patients
                  </button>
                </div>
                <PaymentSummary 
                  patientId={selectedPatientId}
                  onAlert={addAlert}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <p className="text-slate-500 dark:text-slate-400 text-center py-8 text-base">
                  👆 Select a patient from the Patients tab to view their payment summary
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => handleNavigate('patients')}
                    className="text-[#00A3E1] hover:underline text-sm font-medium cursor-pointer"
                  >
                    Go to Patients
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'treatments':
        return <TreatmentCatalog onAlert={addAlert} />;
      
      case 'reports':
        return <Reports onAlert={addAlert} />;
      case 'settings':
        return <SettingsPage />;
      case 'login':
        return <LoginPage onSuccess={() => setActiveTab('dashboard')} onNavigate={handleNavigate} />;
      case 'signup':
        return <SignupPage onSuccess={() => setActiveTab('dashboard')} onNavigate={handleNavigate} />;
      
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />;
    }
  };

  const renderAlerts = () => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      {alerts.map((al) => {
        let typeClasses = '';
        let Icon = Info;
        if (al.type === 'success') {
          typeClasses = 'bg-emerald-50 border-emerald-300 text-emerald-800';
          Icon = CheckCircle2;
        } else if (al.type === 'danger') {
          typeClasses = 'bg-rose-50 border-rose-200 text-rose-800';
          Icon = ShieldAlert;
        } else if (al.type === 'warning') {
          typeClasses = 'bg-amber-50 border-amber-300 text-amber-800';
          Icon = AlertTriangle;
        } else {
          typeClasses = 'bg-sky-50 border-sky-200 text-sky-800';
          Icon = Info;
        }

        return (
          <div 
            key={al.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-alert-fade-in ${typeClasses}`}
          >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {al.message}
            </div>
            <button 
              onClick={() => removeAlert(al.id)}
              className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer shrink-0"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'aiAgents', label: 'AI Agents', icon: UserCheck },
    { id: 'aiAnalytics', label: 'AI Analytics', icon: BarChart3, disabled: false, note: '' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, disabled: true, note: 'Group 2 Scope' },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reminders', label: 'Reminders', icon: Send, disabled: true, note: 'Group 1 Scope' },
    { id: 'treatments', label: 'Treatments', icon: HeartHandshake },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (isWelcome || isAuthScreen) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <main className="min-h-screen w-full overflow-hidden">
          {renderContent()}
        </main>
        {renderAlerts()}
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-800 border-r border-slate-200/85 dark:border-slate-700/85 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Brand Banner */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#084767] to-[#00A3E1] flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            D
          </div>
          {isSidebarOpen && (
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-md">DentalPay</span>
              <span className="block text-[9px] text-[#00A3E1] font-bold tracking-widest uppercase">Clinical</span>
            </div>
          )}
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-4 px-3.5 py-3 rounded-xl font-bold text-sm transition-all relative group cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 dark:bg-slate-900 text-[#0A567D] dark:text-[#00A3E1]'
                    : item.disabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#0A567D] dark:bg-[#00A3E1] rounded-r-lg"></div>
                )}

                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0A567D] dark:text-[#00A3E1]' : 'text-slate-400'}`} />

                {isSidebarOpen && <span className="truncate">{item.label}</span>}

                {item.disabled && isSidebarOpen && (
                  <span className="hidden group-hover:inline absolute right-3 px-1.5 py-0.5 rounded text-[8px] bg-slate-100 text-slate-500 uppercase tracking-widest">
                    {item.note || 'Disabled'}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom profile and toggler */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border dark:bg-slate-900 flex items-center justify-center font-bold text-[#0A567D]">
              DC
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-800 dark:text-white truncate">Dr. Sarah Chan</span>
                <span className="block text-[10px] text-slate-400 truncate">Clinic Owner (Admin)</span>
              </div>
            )}
          </div>

          {isSidebarOpen && (
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/55 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" /> Dark Mode
                </>
              )}
            </button>
          )}

          {isSidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-700/50 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-300 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          )}
        </div>
      </aside>

      {/* VIEW CONTAINER */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-20'}`}>
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200/85 dark:border-slate-700/85 flex items-center justify-between px-8 sticky top-0 z-30">
          <button
          
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-500 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-6">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">DentalPay Central Clinic</span>
            </div>

            <button
            
           
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-500 cursor-pointer"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-500 relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-800"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {renderAlerts()}
      <Toaster position="top-right" richColors />
      {/* CREATE INSTALLMENT PLAN MODAL */}
      {showPaymentModal && patientData && (
        <CreateInstallmentPlan
          patientId={patientData.patientId}
          patientName={patientData.patientName}
          treatments={treatments}
          onSuccess={(data) => {
            setShowPaymentModal(false);
            addAlert({ 
              type: 'success', 
              message: `✅ Installment plan created! ${data.plan.installmentCount} payments scheduled.` 
            });
          }}
          onCancel={() => setShowPaymentModal(false)}
          onAlert={addAlert}
        />
      )}

      {/* COLLECT PAYMENT MODAL */}
      {showCollectModal && selectedInstallment && (
        <CollectPaymentModal
          installment={selectedInstallment}
          onClose={() => {
            setShowCollectModal(false);
            setSelectedInstallment(null);
          }}
          onSuccess={() => {
            setShowCollectModal(false);
            setSelectedInstallment(null);
            addAlert({ type: 'success', message: '✅ Payment recorded successfully!' });
          }}
          onAlert={addAlert}
        />
      )}

      {/* TOAST SYSTEM */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {alerts.map((al) => {
          let typeClasses = '';
          let Icon = Info;
          if (al.type === 'success') {
            typeClasses = 'bg-emerald-50 border-emerald-300 text-emerald-800';
            Icon = CheckCircle2;
          } else if (al.type === 'danger') {
            typeClasses = 'bg-rose-50 border-rose-200 text-rose-800';
            Icon = ShieldAlert;
          } else if (al.type === 'warning') {
            typeClasses = 'bg-amber-50 border-amber-300 text-amber-800';
            Icon = AlertTriangle;
          } else {
            typeClasses = 'bg-sky-50 border-sky-200 text-sky-800';
            Icon = Info;
          }

          return (
            <div 
              key={al.id}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-alert-fade-in ${typeClasses}`}
            >
              <Icon className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {al.message}
              </div>
              <button 
                onClick={() => removeAlert(al.id)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer shrink-0"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}