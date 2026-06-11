import { useState, useEffect } from 'react';

const LOAD_MESSAGES = [
  'INITIALIZING SQUADS...',
  'LOADING MATCH DATA...',
  'SYNCING FIXTURES...',
  'LOADING GOSPEL...',
  'PREPARING LEADERBOARD...',
  'BUILDING FAITH CARDS...',
  'CONNECTING TO GOD...',
  'READY',
];

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 8 + 2;
        if (next >= 100) {
          clearInterval(interval);
          setFadingOut(true);
          setTimeout(onComplete, 800); // Wait for fade out animation
          return 100;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const pct = progress / 100;
    const idx = Math.min(Math.floor(pct * LOAD_MESSAGES.length), LOAD_MESSAGES.length - 1);
    setMsgIdx(idx);
  }, [progress]);

  return (
    <div className={`ea-loading-screen ${fadingOut ? 'fade-out' : ''}`}>
      <div className="ea-marble-bg"></div>

      <div className="ea-content-wrapper">
        {/* Left Side: Logos */}
        <div className="ea-logo-section">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '1rem' }}>
            <img src="/assets/dbys-logo.png" alt="DBYS Logo" style={{ width: '100px', height: '100px', objectFit: 'contain', background: '#fff', borderRadius: '50%', padding: '4px', border: '3px solid #000', outline: '2px solid #fff', outlineOffset: '-5px' }} />
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 800, marginTop: '0.75rem', letterSpacing: '2px', color: '#000', textAlign: 'center', lineHeight: 1.4 }}>
              POWERED BY<br/>DBYS_INP
            </div>
          </div>
          
          <div className="ea-main-title">
            <span style={{ letterSpacing: '-2px' }}>WCC</span> 26
          </div>
          
          <div className="ea-official-badge">
            <div style={{ fontSize: '0.45rem', fontWeight: 900 }}>WCC</div>
            <div style={{ fontSize: '0.2rem', marginTop: '2px', lineHeight: 1 }}>
              OFFICIAL<br/>LICENSED<br/>PRODUCT
            </div>
          </div>
        </div>

        {/* Right Side: Ultimate Edition Box */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '1.5rem', letterSpacing: '4px', color: '#b8860b' }}>
            FAITH EDITION
          </div>
          <div className="ea-edition-box">
            <img src="/assets/cover.png" alt="Cover Stars" className="ea-edition-image" />
          </div>
        </div>
      </div>

      {/* Bottom Loading Bar */}
      <div className="ea-loading-bar-container">
        <div className="ea-loading-status">
          <span className="ea-loading-msg">{LOAD_MESSAGES[msgIdx]}</span>
          <span className="ea-loading-pct">{Math.floor(progress)}%</span>
        </div>
        <div className="ea-loading-track">
          <div className="ea-loading-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <style>{`
        .ea-loading-screen {
          position: fixed;
          inset: 0;
          background: #f4f4f4;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          transition: opacity 0.8s ease-out;
        }
        
        .ea-loading-screen.fade-out {
          opacity: 0;
          pointer-events: none;
        }

        .ea-marble-bg {
          position: absolute;
          inset: 0;
          background-color: #f8f9fa;
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(0,0,0,0.02) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(0,0,0,0.02) 0%, transparent 40%),
            url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)" opacity="0.04"/></svg>');
          z-index: 0;
        }

        .ea-content-wrapper {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6rem;
          width: 100%;
          max-width: 1200px;
          padding: 2rem;
        }

        .ea-logo-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transform: translateY(20px);
        }

        .ea-circle-logo {
          width: 90px;
          height: 90px;
          background: #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #000;
          outline: 2px solid #fff;
          outline-offset: -5px;
        }

        .ea-circle-text {
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Arial Black', Impact, sans-serif;
          line-height: 1;
        }

        .ea-circle-text span:first-child {
          font-size: 1.8rem;
          letter-spacing: -1px;
        }

        .ea-circle-sports {
          font-size: 0.7rem;
          letter-spacing: 2px;
          margin-top: 2px;
        }

        .ea-main-title {
          font-family: 'Arial Black', Impact, sans-serif;
          font-size: 7rem;
          color: #000;
          line-height: 1;
        }

        .ea-official-badge {
          border: 1px solid #000;
          padding: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50px;
          width: 40px;
          text-align: center;
          margin-left: -10px;
          color: #000;
        }

        .ea-edition-box {
          position: relative;
          width: 450px;
          height: 550px;
          background: #d4af37; /* Gold base */
          border: 4px solid #b8860b;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .ea-edition-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .ea-loading-bar-container {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ea-loading-status {
          display: flex;
          justify-content: space-between;
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          color: #000;
          letter-spacing: 1px;
        }

        .ea-loading-track {
          width: 100%;
          height: 4px;
          background: rgba(0,0,0,0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .ea-loading-fill {
          height: 100%;
          background: #000;
          transition: width 0.1s linear;
        }

        @media (max-width: 1000px) {
          .ea-content-wrapper {
            flex-direction: column;
            gap: 3rem;
            transform: scale(0.8);
          }
          .ea-logo-section {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
