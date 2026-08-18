import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import gsap from 'gsap';

const particles = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  left: `${(index * 29) % 100}%`,
  top: `${(index * 47) % 100}%`,
  delay: `${(index % 9) * 0.32}s`,
  duration: `${7 + (index % 6)}s`,
  size: `${2 + (index % 3)}px`,
}));

const LoginPage = ({ onSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const sceneRef = useRef(null);
  const formRef = useRef(null);
  const orbRef = useRef(null);

  const handleGoogleLoginCallback = useCallback(async (response) => {
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google sign-in failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    }
  }, [onSuccess]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.login-reveal',
        { y: 26, opacity: 0, rotateX: -8 },
        { y: 0, opacity: 1, rotateX: 0, duration: 1.05, stagger: 0.09, ease: 'power4.out', delay: 0.25 }
      );
      gsap.fromTo('.bloom-card',
        { scale: 0.92, opacity: 0, y: 18 },
        { scale: 1, opacity: 1, y: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out', delay: 0.1 }
      );
      gsap.to('.orbit-ring', { rotate: 360, duration: 34, repeat: -1, ease: 'none' });
    }, sceneRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const moveScene = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(sceneRef.current, { '--pointer-x': `${x * 16}px`, '--pointer-y': `${y * 16}px`, duration: 0.7, ease: 'power3.out' });
      gsap.to(orbRef.current, { x: x * 18, y: y * 18, duration: 1.1, ease: 'power3.out' });
    };
    window.addEventListener('pointermove', moveScene, { passive: true });
    return () => window.removeEventListener('pointermove', moveScene);
  }, []);

  useEffect(() => {
    const initializeGsi = () => {
      if (window.google && document.getElementById('googleSignInBtn')) {
        window.google.accounts.id.initialize({
          client_id: 'your-google-client-id-here.apps.googleusercontent.com',
          callback: handleGoogleLoginCallback,
        });
        window.google.accounts.id.renderButton(document.getElementById('googleSignInBtn'), {
          theme: 'outline', size: 'large', type: 'standard', shape: 'rectangular', text: 'signin_with', logo_alignment: 'left',
        });
      }
    };
    if (window.google) initializeGsi();
    else {
      const interval = setInterval(() => { if (window.google) { initializeGsi(); clearInterval(interval); } }, 500);
      return () => clearInterval(interval);
    }
  }, [handleGoogleLoginCallback]);

  const handleSimulatedGoogleLogin = () => {
    const payload = { email: 'dr.sarahmiller@dentalpay.com', name: 'Dr. Sarah Miller', picture: '' };
    const simulatedCredential = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(payload))}.signature`;
    handleGoogleLoginCallback({ credential: simulatedCredential });
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main ref={sceneRef} className="login-stage min-h-screen w-full overflow-hidden bg-[#07171b] text-white lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative min-h-[46vh] overflow-hidden border-b border-white/10 lg:min-h-screen lg:border-b-0 lg:border-r" aria-label="DentalPay clinical film">
        <video className="absolute inset-0 h-full w-full object-cover object-[50%_38%] grayscale-[0.08] contrast-[1.04] saturate-[0.72]" autoPlay muted loop playsInline preload="metadata" poster="/src/assets/hero.png">
          <source src="/dental.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[#041316]/65 via-[#082b31]/15 to-[#031013]/65" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_48%,transparent_0,rgba(5,18,21,.16)_42%,rgba(3,12,15,.75)_100%)]" />
        <div className="medical-grid absolute inset-0 opacity-25" />
        <div className="relative z-10 flex h-full min-h-[46vh] flex-col justify-between p-6 sm:p-10 lg:min-h-screen lg:p-12">
          <div className="login-reveal flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/15 font-serif text-lg shadow-[0_0_30px_rgba(0,163,225,.35)] backdrop-blur-md">D</div>
            <div>
              <p className="font-serif text-xl tracking-[-0.04em]">DentalPay</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.32em] text-cyan-100/70">Clinical operating system</p>
            </div>
          </div>
          <div className="login-reveal flex items-end justify-between gap-5">
            <div className="max-w-xs">
              <span className="mb-3 block text-[10px] uppercase tracking-[0.28em] text-cyan-100/75">Live clinical sequence / 01</span>
              <p className="font-serif text-3xl leading-[0.96] tracking-[-0.055em] sm:text-5xl">Precision, held in motion.</p>
            </div>
            <div className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60 sm:flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> Secure feed</div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[54vh] items-center overflow-hidden bg-[radial-gradient(circle_at_70%_10%,#123c43_0%,#0b252b_40%,#07171b_82%)] px-6 py-12 sm:px-12 lg:min-h-screen lg:px-[clamp(3rem,8vw,9rem)]">
        <div className="noise-layer absolute inset-0 opacity-20" />
        <div ref={orbRef} className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#00a3e1]/10 blur-3xl" />
        <div className="orbit-ring pointer-events-none absolute -right-20 top-20 h-[30rem] w-[30rem] rounded-full border border-cyan-100/10" />
        <div className="orbit-ring pointer-events-none absolute -right-4 top-36 h-[20rem] w-[20rem] rounded-full border border-cyan-100/10 [animation-direction:reverse]" />
        {particles.map((particle) => <i key={particle.id} className="login-particle" style={{ '--left': particle.left, '--top': particle.top, '--delay': particle.delay, '--duration': particle.duration, '--size': particle.size }} />)}

        <div ref={formRef} className="relative z-10 w-full max-w-[31rem]">
          <div className="login-reveal mb-12 flex items-center justify-between border-b border-white/15 pb-5 text-[10px] uppercase tracking-[0.24em] text-cyan-100/65">
            <span>Access portal</span><span className="flex items-center gap-2"><ShieldCheck size={13} /> Encrypted / 24</span>
          </div>
          <div className="login-reveal mb-10 max-w-md">
            <p className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-cyan-300"><Sparkles size={13} /> DentalPay OS</p>
            <h1 className="font-serif text-5xl leading-[0.92] tracking-[-0.065em] text-white sm:text-7xl">Enter the<br /><em className="text-cyan-200">practice.</em></h1>
            <p className="mt-6 max-w-sm text-sm leading-6 text-white/55">A calmer command layer for the teams moving modern dentistry forward.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="login-reveal space-y-5">
            {error && <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 p-3 text-xs font-medium text-rose-100">{error}</div>}
            <label className="group block"><span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/45">Email address</span><span className="relative block"><Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-200/45" size={16} /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@practice.com" className="cinematic-input pl-12" /></span></label>
            <label className="group block"><span className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/45"><span>Password</span><a href="#forgot" className="text-cyan-200/80 transition-colors hover:text-white">Forgot password</a></span><span className="relative block"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-200/45" size={16} /><input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="cinematic-input pl-12" /></span></label>
            <button type="submit" className="energy-button group mt-3 flex w-full items-center justify-between rounded-full bg-[#dff3fa] px-5 py-4 text-sm font-semibold text-[#07323b] transition-transform active:scale-[.98]"><span>Open command center</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a567d] text-white transition-transform group-hover:rotate-45"><ArrowUpRight size={16} /></span></button>
          </form>

          <div className="login-reveal mt-5 space-y-3"><div id="googleSignInBtn" className="flex justify-center overflow-hidden rounded-full bg-white/95 py-1" /><button type="button" onClick={handleSimulatedGoogleLogin} className="w-full rounded-full border border-white/15 bg-white/5 py-3 text-xs font-semibold text-white/75 transition-colors hover:border-cyan-200/40 hover:bg-white/10">Continue with Google <span className="ml-1 text-cyan-200">/ demo</span></button></div>
          <p className="login-reveal mt-8 text-center text-xs text-white/40">New to the system? <button type="button" onClick={() => onNavigate?.('signup')} className="font-semibold text-cyan-200 transition-colors hover:text-white">Create a practice profile</button></p>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
