import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const SignupPage = ({ onSuccess, onNavigate }) => {
  const [selectedCard, setSelectedCard] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const mockLedgerData = [
    { id: 0, name: "Ali Khan", treatment: "Root Canal", balance: "PKR 15,000", status: "Pending" },
    { id: 1, name: "Sara Ahmed", treatment: "Teeth Whitening", balance: "PKR 8,500", status: "Paid" },
    { id: 2, name: "Zainab Malik", treatment: "Dental Implants", balance: "PKR 45,000", status: "Pending" }
  ];

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans antialiased bg-white overflow-hidden">
      
      {/* LEFT SIDE: Full-Screen Interactive Illustration Half */}
      <div className="w-full lg:w-1/2 min-h-[45vh] lg:min-h-screen relative bg-gradient-to-br from-[#0A567D] to-[#00A3E1] flex flex-col justify-between p-8 sm:p-12 lg:p-16 text-white overflow-hidden">
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[60%] rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-black/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 z-10">
          <div className="w-7 h-7 bg-white text-[#0A567D] rounded-lg flex items-center justify-center font-black text-sm shadow-sm">
            D
          </div>
          <span className="text-lg font-bold tracking-tight text-white">DentalPay</span>
        </div>

        <div className="my-auto w-full max-w-md mx-auto space-y-6 z-10 py-8 lg:py-0">
          <div className="space-y-2 text-center lg:text-left">
            <span className="inline-block px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-md text-[11px] font-bold tracking-wider uppercase text-sky-100">
              Interactive Preview
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Dynamic Balance Records
            </h3>
            <p className="text-xs font-medium text-sky-100/70">
              Click on the patient logs below to see how balances update instantly.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl space-y-3 transition-all duration-300 hover:border-white/20">
            {mockLedgerData.map((patient) => (
              <div 
                key={patient.id}
                onClick={() => setSelectedCard(patient.id)}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                  selectedCard === patient.id 
                    ? 'bg-white border-white shadow-lg scale-[1.02] text-slate-800' 
                    : 'bg-white/5 border-white/5 text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    selectedCard === patient.id ? 'bg-sky-50 text-[#0A567D]' : 'bg-white/10 text-white'
                  }`}>
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{patient.name}</p>
                    <p className={`text-[10px] transition-colors ${selectedCard === patient.id ? 'text-slate-400' : 'text-sky-200/70'}`}>
                      {patient.treatment}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-black">{patient.balance}</p>
                  <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md mt-1 transition-all ${
                    patient.status === 'Paid' 
                      ? 'bg-emerald-500/20 text-emerald-200' 
                      : selectedCard === patient.id ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/20 text-amber-200'
                  }`}>
                    {patient.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="z-10 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-sky-100/80 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-sky-200" /> Automated billing</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-sky-200" /> WhatsApp alerts</div>
        </div>
      </div>

      {/* RIGHT SIDE: Form Input Half */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 lg:p-24 min-h-[55vh] lg:min-h-screen overflow-hidden">
        <div className="max-w-md w-full space-y-8">
          
          <div className="space-y-1.5">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create an account</h2>
            <p className="text-sm font-medium text-slate-400">Get started with your simple 14-day clinic trial.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSignupSubmit}>
            
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinic Name</label>
              <input 
                type="text" 
                placeholder="e.g., Apex Dental Studio"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/50 border-2 border-slate-200 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white focus:border-[#0A567D] focus:ring-4 focus:ring-sky-50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                placeholder="name@clinicemail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/50 border-2 border-slate-200 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white focus:border-[#0A567D] focus:ring-4 focus:ring-sky-50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                placeholder="Create a strong account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/50 border-2 border-slate-200 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white focus:border-[#0A567D] focus:ring-4 focus:ring-sky-50"
                required
              />
            </div>

            <div className="pt-4 space-y-4">
              <button 
                type="submit" 
                className="w-full bg-[#0A567D] hover:bg-[#084767] text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group"
              >
                <span>Create Registration Workspace</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button 
                type="button"
                onClick={() => onSuccess?.()}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm py-3.5 border-2 border-slate-200 rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.92 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.6 2.8C6.01 7.14 8.79 5.04 12 5.04z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.48z"/>
                  <path fill="#FBBC05" d="M5.1 14.2c-.24-.71-.38-1.47-.38-2.2s.14-1.49.38-2.2L1.5 7.5C.54 9.41 0 11.59 0 14s.54 4.59 1.5 6.5l3.6-2.8z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.66-2.84c-1.01.68-2.31 1.08-4.3 1.08-3.21 0-5.99-2.1-6.96-5.26l-3.6 2.8C3.39 20.35 7.35 23 12 23z"/>
                </svg>
                <span>Register with Google</span>
              </button>
            </div>

          </form>

          <p className="text-center text-sm font-medium text-slate-400 pt-2">
            Already registered?{' '}
            <button type="button" onClick={() => onNavigate?.('login')} className="text-[#00A3E1] font-bold hover:underline">Log in here</button>
          </p>

        </div>
      </div>

    </div>
  );
};

export default SignupPage;