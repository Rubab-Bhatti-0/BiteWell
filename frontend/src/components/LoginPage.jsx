import React, { useState, useEffect, useRef } from 'react';
import { LogIn, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

const LoginPage = () => {
  const navigate = useNavigate();
  const [activeMonth, setActiveMonth] = useState('May');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const leftContentRef = useRef(null);
  const rightContentRef = useRef(null);

  const handleGoogleLoginCallback = async (response) => {
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google Sign-in failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/settings');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    // If the library is loaded, initialize GSI
    const initializeGsi = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "your-google-client-id-here.apps.googleusercontent.com",
          callback: handleGoogleLoginCallback
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInBtn"),
          { theme: "outline", size: "large", type: "standard", shape: "rectangular", text: "signin_with", logo_alignment: "left" }
        );
      }
    };

    // Retry checking if Google SDK is loaded
    if (window.google) {
      initializeGsi();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google) {
          initializeGsi();
          clearInterval(checkInterval);
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }
  }, []);

  useEffect(() => {
    // Entrance animations
    gsap.set(leftPanelRef.current, { xPercent: -100 });
    gsap.set(rightPanelRef.current, { xPercent: 100 });

    const leftChildren = leftContentRef.current.children;
    const rightChildren = rightContentRef.current.children;

    gsap.set(leftChildren, { opacity: 0, y: 20 });
    gsap.set(rightChildren, { opacity: 0, y: 20 });
    
    // Select all the chart bar divs
    const bars = leftPanelRef.current.querySelectorAll('.chart-bar-el');
    gsap.set(bars, { scaleY: 0, transformOrigin: "bottom" });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to([leftPanelRef.current, rightPanelRef.current], {
      xPercent: 0,
      duration: 1.2
    })
    .to(leftChildren, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15
    }, "-=0.6")
    .to(bars, {
      scaleY: 1,
      duration: 1,
      stagger: 0.1,
      ease: "back.out(1.5)"
    }, "-=0.4")
    .to(rightChildren, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1
    }, "-=1");

  }, []);

  const chartData = [
    { month: 'Feb', height: 'h-24', collections: 'PKR 140k' },
    { month: 'Mar', height: 'h-36', collections: 'PKR 210k' },
    { month: 'Apr', height: 'h-28', collections: 'PKR 185k' },
    { month: 'May', height: 'h-48', collections: 'PKR 320k' },
  ];

  const handleSimulatedGoogleLogin = () => {
    const payload = {
      email: 'dr.sarahmiller@dentalpay.com',
      name: 'Dr. Sarah Miller',
      picture: ''
    };
    // Construct simulated base64 encoded JWT header and payload
    const simulatedCredential = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + btoa(JSON.stringify(payload)) + ".signature";
    handleGoogleLoginCallback({ credential: simulatedCredential });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/settings');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans antialiased bg-white overflow-hidden">
      
      {/* LEFT SIDE: Full-Screen Interactive Chart Half */}
      <div 
        ref={leftPanelRef}
        className="w-full lg:w-1/2 min-h-[45vh] lg:min-h-screen relative bg-gradient-to-br from-[#084767] to-[#0A567D] flex flex-col justify-between p-8 sm:p-12 lg:p-16 text-white overflow-hidden"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[50%] rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[60%] rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 z-10">
          <div className="w-7 h-7 bg-white text-[#0A567D] rounded-lg flex items-center justify-center font-black text-sm shadow-sm">
            D
          </div>
          <span className="text-lg font-bold tracking-tight text-white">DentalPay</span>
        </div>

        <div ref={leftContentRef} className="my-auto w-full max-w-md mx-auto space-y-6 z-10 py-8 lg:py-0">
          <div className="space-y-2 text-center lg:text-left">
            <span className="inline-block items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 rounded-md text-[11px] font-bold tracking-wider uppercase text-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 inline mr-1" /> Practice Insights
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Track Monthly Collections
            </h3>
            <p className="text-xs font-medium text-sky-100/70">
              Tap individual data bars to review historical performance values.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl space-y-6 hover:border-white/20 transition-all duration-300">
            <div className="flex justify-between items-end h-52 pt-4 px-2 border-b border-white/10">
              {chartData.map((item) => (
                <div 
                  key={item.month} 
                  onClick={() => setActiveMonth(item.month)}
                  className="flex flex-col items-center gap-2 w-16 group cursor-pointer animate-container"
                >
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded transition-all duration-200 ${
                    activeMonth === item.month 
                      ? 'bg-white text-slate-800 opacity-100 scale-105 shadow-sm' 
                      : 'bg-transparent text-transparent group-hover:text-sky-100 group-hover:bg-white/5'
                  }`}>
                    {item.collections}
                  </span>
                  
                  <div className={`chart-bar-el w-full rounded-t-lg transition-all duration-300 ${item.height} ${
                    activeMonth === item.month 
                      ? 'bg-gradient-to-t from-[#00A3E1] to-sky-300 shadow-xl scale-x-105' 
                      : 'bg-white/20 group-hover:bg-white/30'
                  }`} />
                  
                  <span className={`text-xs font-bold pt-1 transition-colors ${
                    activeMonth === item.month ? 'text-white' : 'text-sky-200/60'
                  }`}>
                    {item.month}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-xs font-bold text-sky-100/80 pt-2">
              <div>
                <p className="text-[10px] uppercase text-sky-300 tracking-wider">Active View</p>
                <p className="text-sm font-black text-white mt-0.5">{activeMonth} Overview</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-emerald-300 tracking-wider">Growth Delta</p>
                <p className="text-sm font-black text-emerald-300 mt-0.5">+14.2% MoM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="z-10 text-xs font-semibold text-sky-200/70 pt-4 border-t border-white/10 text-center lg:text-left">
          🔐 Enterprise encryption standards shield your administrative dashboard log data.
        </div>
      </div>

      {/* RIGHT SIDE: Form Input Half */}
      <div 
        ref={rightPanelRef}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 lg:p-24 min-h-[55vh] lg:min-h-screen overflow-hidden"
      >
        <div ref={rightContentRef} className="max-w-md w-full space-y-8">
          
          <div className="space-y-1.5">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm font-medium text-slate-400">Please enter your login details to access your dashboard.</p>
          </div>

          <form className="space-y-5" onSubmit={handleLoginSubmit}>
            
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                placeholder="enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/50 border-2 border-slate-200 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white focus:border-[#0A567D] focus:ring-4 focus:ring-sky-50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <a href="#forgot" className="text-xs font-bold text-[#00A3E1] hover:underline">Forgot?</a>
              </div>
              <input 
                type="password" 
                placeholder="enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/50 border-2 border-slate-200 rounded-xl outline-none text-sm font-medium transition-all focus:bg-white focus:border-[#0A567D] focus:ring-4 focus:ring-sky-50"
                required
              />
            </div>

            <div className="pt-4 space-y-4">
              <button 
                type="submit" 
                className="w-full bg-[#0A567D] hover:bg-[#084767] text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Sign In to Console</span>
                <LogIn className="w-4 h-4" />
              </button>

              <div className="w-full flex flex-col items-center pt-2 gap-2">
                <div id="googleSignInBtn" className="w-full flex justify-center"></div>
                <button
                  type="button"
                  onClick={handleSimulatedGoogleLogin}
                  className="w-full border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm py-3.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Sign in with Google (Demo)</span>
                </button>
              </div>
            </div>

          </form>

          <p className="text-center text-sm font-medium text-slate-400 pt-2">
            Don't have a profile space yet?{' '}
            <a href="/signup" className="text-[#00A3E1] font-bold hover:underline">Sign up for free</a>
          </p>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;