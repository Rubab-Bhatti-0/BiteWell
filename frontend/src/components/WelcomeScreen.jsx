import React, { useEffect, useRef } from 'react';
import { 
  UserPlus, 
  LogIn, 
  Smile, 
  Shield, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  Heart, 
  Activity,
  TrendingUp
} from 'lucide-react';
import gsap from 'gsap';

const WelcomeScreen = ({ onNavigate }) => {
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const leftContentRef = useRef(null);
  const rightContentRef = useRef(null);
  const logoRef = useRef(null);
  const footerRef = useRef(null);

  // References for scattered icons
  const leftIconsRef = useRef([]);
  const rightIconsRef = useRef([]);

  useEffect(() => {
    // Initial state: hide panels off-screen and set opacity of elements to 0
    gsap.set([leftPanelRef.current, rightPanelRef.current], { xPercent: (i) => (i === 0 ? -100 : 100) });
    gsap.set([logoRef.current, footerRef.current], { opacity: 0 });
    
    const leftChildren = leftContentRef.current.children;
    const rightChildren = rightContentRef.current.children;
    gsap.set([...leftChildren, ...rightChildren], { opacity: 0, y: 30 });

    // Set initial state for scattered icons (off-screen based on data attributes)
    leftIconsRef.current.concat(rightIconsRef.current).forEach((icon) => {
      if (icon) {
        gsap.set(icon, {
          x: icon.dataset.fromx,
          y: icon.dataset.fromy,
          opacity: 0,
          scale: 0.2,
          rotation: parseFloat(icon.dataset.rot) - 45
        });
      }
    });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate panels sliding in
    tl.to([leftPanelRef.current, rightPanelRef.current], {
      xPercent: 0,
      duration: 1.2,
      stagger: 0.1
    })
    // Fade in brand logo
    .to(logoRef.current, {
      opacity: 1,
      duration: 0.6
    }, "-=0.6")
    // Stagger fade/slide up for left panel content
    .to(leftChildren, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15
    }, "-=0.5")
    // Stagger fade/slide up for right panel content
    .to(rightChildren, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15
    }, "-=0.8")
    // Fade in footer links
    .to(footerRef.current, {
      opacity: 1,
      duration: 0.6
    }, "-=0.4");

    // Animate scattered icons flying in and scattering
    const allIcons = [...leftIconsRef.current, ...rightIconsRef.current].filter(Boolean);
    
    gsap.to(allIcons, {
      x: 0,
      y: 0,
      opacity: (index, target) => parseFloat(target.dataset.opacity),
      scale: 1,
      rotation: (index, target) => parseFloat(target.dataset.rot),
      duration: 1.6,
      ease: "back.out(1.2)",
      stagger: {
        amount: 0.4
      },
      delay: 0.4,
      onComplete: () => {
        // Start subtle continuous floating animation for each icon
        allIcons.forEach((icon) => {
          gsap.to(icon, {
            y: "+=12",
            rotation: "+=8",
            duration: gsap.utils.random(3, 5),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        });
      }
    });

  }, []);

  // Icon configuration data for easy rendering
  const leftScatteredIcons = [
    { Icon: DollarSign, top: '15%', left: '12%', size: 'w-10 h-10', opacity: 0.15, rot: -15, fromx: '-150px', fromy: '-150px' },
    { Icon: CreditCard, top: '75%', left: '15%', size: 'w-12 h-12', opacity: 0.18, rot: 12, fromx: '-200px', fromy: '150px' },
    { Icon: Sparkles, top: '22%', right: '15%', size: 'w-10 h-10', opacity: 0.2, rot: 45, fromx: '150px', fromy: '-100px' },
    { Icon: Smile, top: '65%', right: '18%', size: 'w-14 h-14', opacity: 0.15, rot: -20, fromx: '200px', fromy: '200px' },
    { Icon: Calendar, top: '42%', left: '28%', size: 'w-9 h-9', opacity: 0.12, rot: 10, fromx: '-100px', fromy: '50px' }
  ];

  const rightScatteredIcons = [
    { Icon: Shield, top: '15%', left: '18%', size: 'w-11 h-11', opacity: 0.08, rot: 15, fromx: '-150px', fromy: '-150px' },
    { Icon: Heart, top: '72%', left: '12%', size: 'w-12 h-12', opacity: 0.07, rot: -10, fromx: '-200px', fromy: '150px' },
    { Icon: TrendingUp, top: '20%', right: '15%', size: 'w-12 h-12', opacity: 0.09, rot: 25, fromx: '200px', fromy: '-100px' },
    { Icon: Activity, top: '65%', right: '15%', size: 'w-10 h-10', opacity: 0.08, rot: -30, fromx: '150px', fromy: '200px' },
    { Icon: DollarSign, top: '45%', right: '28%', size: 'w-9 h-9', opacity: 0.07, rot: 5, fromx: '100px', fromy: '100px' }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans antialiased overflow-hidden">
      
      {/* LEFT HALF: Full-Screen Blue Section (Sign Up) */}
      <div 
        ref={leftPanelRef}
        className="w-full lg:w-1/2 bg-gradient-to-br from-[#0A567D] to-[#00A3E1] flex flex-col items-center justify-center p-8 min-h-[50vh] lg:min-h-screen relative overflow-hidden"
      >
        {/* Scattered background icons for Left Panel */}
        {leftScatteredIcons.map((item, idx) => (
          <div
            key={`left-icon-${idx}`}
            ref={el => leftIconsRef.current[idx] = el}
            data-fromx={item.fromx}
            data-fromy={item.fromy}
            data-opacity={item.opacity}
            data-rot={item.rot}
            style={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              right: item.right,
              color: '#ffffff',
              pointerEvents: 'none',
              zIndex: 1
            }}
            className="scatter-icon"
          >
            <item.Icon className={item.size} strokeWidth={1.5} />
          </div>
        ))}
        
        {/* App Title in corner for branding */}
        <div ref={logoRef} className="absolute top-8 left-8 flex items-center gap-2 z-20">
          <div className="w-7 h-7 bg-white text-[#0A567D] rounded-lg flex items-center justify-center font-black text-sm">
            B
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Bite</span>
        </div>

        {/* Center Content Group */}
        <div ref={leftContentRef} className="text-center space-y-6 max-w-sm w-full z-10">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Create Your Account
          </h2>
          <p className="text-sm font-medium text-sky-100/80 leading-relaxed">
            Register a brand new workspace profile for your clinic.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate?.('signup')}
              className="inline-flex items-center gap-2.5 bg-white hover:bg-slate-50 text-[#0A567D] font-bold text-base px-8 py-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-5 h-5" />
              <span>Sign Up</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT HALF: Full-Screen White Section (Login) */}
      <div 
        ref={rightPanelRef}
        className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-8 min-h-[50vh] lg:min-h-screen border-t lg:border-t-0 lg:border-l border-slate-100 relative overflow-hidden"
      >
        {/* Scattered background icons for Right Panel */}
        {rightScatteredIcons.map((item, idx) => (
          <div
            key={`right-icon-${idx}`}
            ref={el => rightIconsRef.current[idx] = el}
            data-fromx={item.fromx}
            data-fromy={item.fromy}
            data-opacity={item.opacity}
            data-rot={item.rot}
            style={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              right: item.right,
              color: '#0A567D',
              pointerEvents: 'none',
              zIndex: 1
            }}
            className="scatter-icon"
          >
            <item.Icon className={item.size} strokeWidth={1.5} />
          </div>
        ))}
        
        {/* Center Content Group */}
        <div ref={rightContentRef} className="text-center space-y-6 max-w-sm w-full z-10">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-sm font-medium text-slate-400 leading-relaxed">
            Sign into your existing safe dashboard console.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate?.('login')}
              className="inline-flex items-center gap-2.5 bg-[#0A567D] hover:bg-[#084767] text-white font-bold text-base px-8 py-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5" />
              <span>Login</span>
            </button>
          </div>
        </div>

        {/* Minimal footer links */}
        <div ref={footerRef} className="absolute bottom-6 flex items-center gap-4 text-xs font-semibold text-slate-400">
          <a href="#privacy" className="hover:text-slate-600 transition-colors">Privacy</a>
          <span>•</span>
          <a href="#terms" className="hover:text-slate-600 transition-colors">Terms</a>
        </div>
      </div>

    </div>
  );
};

export default WelcomeScreen;