import { useState } from 'react';
import { 
  Bell, 
  Search, 
  HelpCircle, 
  User, 
  Menu, 
  Clock,
  Palette,
  ChevronDown,
  Building2,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

export default function SettingsPage() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('Clinic Info');

  // Loading and Alert states
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', message: string }

  // Form States
  const [clinicName, setClinicName] = useState('BrightSmile Dental Clinic');
  const [practiceType, setPracticeType] = useState('General Dentistry');
  const [businessAddress, setBusinessAddress] = useState('123 Medical Plaza, Suite 400, Chicago, IL 60601');
  const [contactEmail, setContactEmail] = useState('office@brightsmilechicago.com');
  const [phoneNumber, setPhoneNumber] = useState('+1 (312) 555-0198');

  // Settings Category Tabs
  const tabs = [
    { name: 'Clinic Info', icon: Building2 },
    { name: 'Owner Profile', icon: User },
    { name: 'Working Hours', icon: Clock },
    { name: 'Branding & Identity', icon: Palette },
    { name: 'Notifications', icon: Bell },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert(null);

    // Simulate database saving delay
    setTimeout(() => {
      setIsLoading(false);
      setAlert({
        type: 'success',
        message: 'Clinic configuration settings saved successfully!'
      });
      
      // Auto dismiss alert
      setTimeout(() => {
        setAlert(null);
      }, 5000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <main className="flex-1 min-w-0 flex flex-col">
        
        {/* ================= TOP HEADER ================= */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Hamburger Menu Toggle */}
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Settings Input */}
            <div className="relative max-w-md w-full">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search settings..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#109FE3] focus:border-[#109FE3] transition"
              />
            </div>
          </div>

          {/* Quick Header Right Utilities */}
          <div className="flex items-center gap-4 ml-4">
            <button className="text-slate-500 hover:text-slate-800 relative p-1.5 rounded-full hover:bg-slate-50">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            <button className="text-slate-500 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-50">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button className="text-slate-500 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-50">
              <User className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ================= CONTAINER BODY ================= */}
        <div className="p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Page Heading Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Settings</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Manage your clinic configuration, branding, and security preferences.
            </p>
          </div>

          {/* ================= SETTINGS TABS ================= */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(tab.name)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition
                    ${isActive 
                      ? 'bg-[#109FE3] text-white border-[#109FE3] shadow-sm shadow-[#109FE3]/10' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* ================= PRIMARY GRID LAYOUT ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT AREA: MAIN SETTINGS FORM (Col span 8) */}
            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              
              {alert && (
                <div className={`p-4 mb-5 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                  alert.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {alert.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span className="text-xs font-bold leading-normal">{alert.message}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setAlert(null)}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                
                {/* Form Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-md font-bold text-slate-900">Clinic Information</h2>
                    <p className="text-slate-400 text-[11px] mt-0.5">General details about your dental practice.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#109FE3] hover:bg-[#0E8CC9] disabled:opacity-75 disabled:cursor-not-allowed text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>

                {/* Grid Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Clinic Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinic Name</label>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#109FE3] focus:border-[#109FE3] focus:bg-white outline-none transition"
                    />
                  </div>

                  {/* Practice Type Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Practice Type</label>
                    <div className="relative">
                      <select
                        value={practiceType}
                        onChange={(e) => setPracticeType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium appearance-none focus:ring-1 focus:ring-[#109FE3] focus:border-[#109FE3] focus:bg-white outline-none transition cursor-pointer"
                      >
                        <option value="General Dentistry">General Dentistry</option>
                        <option value="Orthodontics">Orthodontics</option>
                        <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                        <option value="Periodontics">Periodontics</option>
                      </select>
                      <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Business Address */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business Address</label>
                  <textarea
                    rows={3}
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#109FE3] focus:border-[#109FE3] focus:bg-white outline-none transition resize-none leading-relaxed"
                  />
                </div>

                {/* Contact Email & Phone Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Email</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#109FE3] focus:border-[#109FE3] focus:bg-white outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#109FE3] focus:border-[#109FE3] focus:bg-white outline-none transition"
                    />
                  </div>
                </div>

              </form>
            </div>

            {/* RIGHT AREA: WIDGETS (Col span 4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Widget 1: Clinic Status Card */}
              <div className="bg-[#EDF8FD] border border-sky-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#109FE3]" />
                  <h3 className="text-xs font-bold text-slate-800">Clinic Status</h3>
                </div>

                {/* Subscription Row */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-semibold">Subscription</span>
                  <span className="bg-[#46F1A8]/15 text-[#0A89C7] text-[10px] font-bold px-2 py-0.5 rounded-md">
                    Professional Plan
                  </span>
                </div>

                {/* Progress Metric Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-500">Profile Completion</span>
                    <span className="text-[#109FE3] font-bold">92%</span>
                  </div>
                  <div className="w-full bg-sky-200/50 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#109FE3] h-full rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-normal italic">
                  Add your tax ID to reach 100% profile completion and unlock advanced billing features.
                </p>
              </div>

              {/* Widget 2: Help Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                <h3 className="text-xs font-bold text-slate-900">Need help?</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Our clinical support team is available 24/7 for technical assistance.
                </p>
                <button className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2 rounded-xl transition">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat with Support
                </button>
                {/* Decorative ghost medical cross icon */}
                <div className="absolute right-[-10px] bottom-[-10px] text-slate-100/50 pointer-events-none">
                  <svg className="w-16 h-16 fill-current" viewBox="0 0 24 24">
                    <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
                  </svg>
                </div>
              </div>

              {/* Widget 3: System Logs */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900">System Logs</h3>

                <div className="space-y-3">
                  {/* Log Item 1 */}
                  <div className="flex gap-3">
                    <div className="w-1.5 bg-[#109FE3] rounded-full self-stretch mt-1"></div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800 leading-tight">Password changed</h4>
                      <span className="text-[9px] text-slate-400 font-medium">2 hours ago</span>
                    </div>
                  </div>

                  {/* Log Item 2 */}
                  <div className="flex gap-3">
                    <div className="w-1.5 bg-slate-300 rounded-full self-stretch mt-1"></div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800 leading-tight">New login: Chrome (Mac)</h4>
                      <span className="text-[9px] text-slate-400 font-medium">Yesterday at 14:20</span>
                    </div>
                  </div>
                </div>

                <button className="w-full text-center text-[#109FE3] hover:underline font-bold text-xs pt-1 border-t border-slate-100 block">
                  View full security log
                </button>
              </div>

            </div>

          </div>

        </div>
      </main>

    </div>
  );
}