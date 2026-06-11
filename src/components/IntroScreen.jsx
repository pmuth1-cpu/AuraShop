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
