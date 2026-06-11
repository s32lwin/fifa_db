import { useState } from 'react';
import { useApp } from '../context/AppContext';

function PlayerImage({ src, name, size = 80 }) {
  const [err, setErr] = useState(false);
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  if (err || !src) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, fontFamily: 'var(--font-display)',
        color: 'rgba(255,255,255,0.6)', flexShrink: 0,
        border: '2px solid rgba(255,255,255,0.15)'
      }}>
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', objectPosition: 'top center',
        flexShrink: 0,
        border: '2px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.05)'
      }}
    />
  );
}

export default function Testimonies() {
  const { players } = useApp();
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.nationality || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.position || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!players.length) return (
    <div className="panel-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--grey)' }}>LOADING FAITH CARDS...</div>
    </div>
  );

  const player = players[idx];
  const accentColor = player.color || '#d4af37';

  const prev = () => { setIdx((idx - 1 + players.length) % players.length); setFlipped(false); };
  const next = () => { setIdx((idx + 1) % players.length); setFlipped(false); };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <div>
          <h1 className="panel-title">FAITH CARDS</h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--grey)', letterSpacing: '2px', marginTop: '0.25rem' }}>
            CHRISTIAN FOOTBALLER TESTIMONIES · {idx + 1} / {players.length}
          </div>
        </div>
        <span className="panel-badge">TAP CARD TO READ TESTIMONY</span>
      </div>

      <div className="faith-layout">

        {/* LEFT — Faith Card */}
        <div className="faith-card-col">
          <div
            className={`faith-card ${flipped ? 'faith-flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
            style={{ '--accent': accentColor }}
          >
            {/* FRONT */}
            <div className="faith-face faith-front">
              <div className="faith-card-header" style={{ background: `linear-gradient(135deg, ${accentColor}33, transparent 60%)` }}>
                <div className="faith-meta-left">
                  <div className="faith-rating">{player.rating}</div>
                  <div className="faith-position">{player.position}</div>
                </div>
                <div className="faith-meta-right">
                  <div className="faith-flag-big">{player.flag}</div>
                  <div className="faith-nationality">{player.nationality}</div>
                </div>
              </div>

              <div className="faith-cross-watermark">✝</div>
              <div className="faith-glow-orb" style={{ background: accentColor }} />

              {/* Player photo */}
              <div className="faith-photo-wrap">
                <div className="faith-photo-ring" style={{ borderColor: accentColor }}>
                  <PlayerImage src={player.image} name={player.name} size={110} />
                </div>
              </div>

              <div className="faith-name">{player.name.toUpperCase()}</div>
              <div className="faith-club">{player.club}</div>

              <div className="faith-quote-block" style={{ borderLeftColor: accentColor }}>
                <div className="faith-quote-mark">"</div>
                <div className="faith-quote-text">{player.quote}</div>
              </div>

              <div className="faith-verse-pill" style={{ borderColor: accentColor, color: accentColor }}>
                📖 {player.bibleVerse}
              </div>

              <div className="faith-flip-hint">TAP TO READ TESTIMONY ↻</div>
            </div>

            {/* BACK */}
            <div className="faith-face faith-back">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                <PlayerImage src={player.image} name={player.name} size={56} />
                <div>
                  <div className="faith-back-header" style={{ color: accentColor, textAlign: 'left' }}>✝ TESTIMONY</div>
                  <div className="faith-back-name" style={{ fontSize: '1.3rem', textAlign: 'left' }}>{player.name.toUpperCase()}</div>
                </div>
              </div>

              <div className="faith-testimony-text">{player.testimony}</div>

              <div className="faith-back-verse" style={{ borderColor: `${accentColor}44`, background: `${accentColor}11` }}>
                <div className="faith-back-ref" style={{ color: accentColor }}>{player.bibleVerse}</div>
                <div className="faith-back-text">"{player.bibleText}"</div>
              </div>

              <div className="faith-flip-hint">TAP TO FLIP ↻</div>
            </div>
          </div>

          {/* Navigation */}
          <div className="faith-nav">
            <button className="faith-nav-btn" onClick={prev}>‹</button>
            <div className="faith-dots">
              {players.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setIdx(i); setFlipped(false); }}
                  className={`faith-dot ${i === idx ? 'faith-dot-active' : ''}`}
                  style={i === idx ? { background: accentColor } : {}}
                />
              ))}
            </div>
            <button className="faith-nav-btn" onClick={next}>›</button>
          </div>
        </div>

        {/* RIGHT — Player List */}
        <div className="faith-list-col">
          <div className="faith-list-header">
            <span>ALL FAITH ATHLETES</span>
            <span className="faith-count-badge">{players.length}</span>
          </div>

          <div className="faith-search-wrap">
            <span className="faith-search-icon">🔍</span>
            <input
              className="faith-search"
              placeholder="Search player, nation, position..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="faith-list-scroll">
            {filtered.map((p) => {
              const realIdx = players.indexOf(p);
              const isActive = realIdx === idx;
              return (
                <div
                  key={p.id}
                  onClick={() => { setIdx(realIdx); setFlipped(false); }}
                  className={`faith-list-item ${isActive ? 'faith-list-active' : ''}`}
                  style={isActive ? { borderLeftColor: p.color || '#d4af37', background: `${p.color || '#d4af37'}15` } : {}}
                >
                  <PlayerImage src={p.image} name={p.name} size={46} />
                  <div className="faith-list-info">
                    <div className="faith-list-name" style={isActive ? { color: p.color || '#d4af37' } : {}}>{p.name}</div>
                    <div className="faith-list-sub">{p.position} · {p.nationality}</div>
                    <div className="faith-list-quote">"{p.quote}"</div>
                  </div>
                  <div className="faith-list-rating" style={isActive ? { color: p.color || '#d4af37' } : {}}>{p.rating}</div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--grey)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                NO ATHLETES FOUND
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
