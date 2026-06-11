import React, { useEffect, useState } from 'react';

export default function IntroScreen({ onComplete }) {
  const [phase, setPhase] = useState('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('glow'), 800);
    const t2 = setTimeout(() => setPhase('tagline'), 1600);
    const t3 = setTimeout(() => onComplete(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className="intro-screen">
      <div className="intro-bg">
        <div className="intro-orb intro-orb-1" />
        <div className="intro-orb intro-orb-2" />
        <div className="intro-orb intro-orb-3" />
      </div>
      <div className="intro-content">
        <div className={`intro-logo-wrap ${phase === 'glow' ? 'glow' : ''} ${phase === 'tagline' ? 'tagline' : ''}`}>
          <div className="intro-logo">
            <svg viewBox="0 0 120 120" width="110" height="110">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="logoGradBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <polygon points="60,8 108,38 90,98 30,98 12,38" fill="none" stroke="url(#logoGradBorder)" strokeWidth="2" opacity="0.6" />
              <polygon points="60,20 96,43 84,88 36,88 24,43" fill="none" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.35" />
              <polygon points="60,30 84,47 76,82 44,82 36,47" fill="url(#logoGrad)" opacity="0.12" />
              <text x="60" y="64" textAnchor="middle" dominantBaseline="middle" fill="url(#logoGrad)" fontFamily="var(--font-display)" fontWeight="800" fontSize="30">A</text>
              <circle cx="60" cy="63" r="26" fill="none" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.5" />
              <circle cx="60" cy="63" r="22" fill="none" stroke="url(#logoGrad)" strokeWidth="0.7" opacity="0.3" />
            </svg>
          </div>
          <div className="intro-text">
            <h1 className={`intro-title ${phase === 'tagline' ? 'visible' : ''}`}>
              <span className="intro-a">A</span><span className="intro-ura">URA</span>
            </h1>
            <p className={`intro-sub ${phase === 'tagline' ? 'visible' : ''}`}>Premium Streetwear</p>
          </div>
        </div>
        <div className="intro-loader" style={{ opacity: phase === 'tagline' ? 0 : 1 }}>
          <div className="intro-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    </div>
  );
}
