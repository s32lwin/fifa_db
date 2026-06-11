import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const VATICAN_RSS = 'https://www.vaticannews.va/content/vaticannews/en/word-of-the-day.rss.xml';
const PROXY = 'https://api.allorigins.win/get?url=';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
}

function parseTitle(title) {
  if (!title) return { day: '', reference: '' };
  const parts = title.split('–');
  if (parts.length >= 2) return { day: parts[0].trim(), reference: parts.slice(1).join('–').trim() };
  const dashParts = title.split('-');
  if (dashParts.length >= 2) return { day: dashParts[0].trim(), reference: dashParts.slice(1).join('-').trim() };
  return { day: title, reference: '' };
}

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

export default function Dashboard({ onNavigate }) {
  const { simulatedTime, simDateStr, getDevotional, matches, getLockStatus, predictions, currentUser, players } = useApp();

  const [vatData, setVatData] = useState(null);
  const [vatLoading, setVatLoading] = useState(true);

  useEffect(() => {
    const cacheKey = 'wcc_vatican_gospel';
    const cacheDate = 'wcc_vatican_date';
    const today = new Date().toISOString().slice(0, 10);

    const cachedDate = localStorage.getItem(cacheDate);
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedDate === today && cachedData) {
      try {
        setVatData(JSON.parse(cachedData));
        setVatLoading(false);
        return;
      } catch {}
    }

    fetch(`${PROXY}${encodeURIComponent(VATICAN_RSS)}`)
      .then(r => r.json())
      .then(json => {
        const xml = json.contents;
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');
        const items = doc.querySelectorAll('item');
        if (!items.length) throw new Error('No items');

        const item = items[0];
        const title = item.querySelector('title')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const link = item.querySelector('link')?.textContent || 'https://www.vaticannews.va/en/word-of-the-day.html';

        const cleanDesc = stripHtml(description);
        const { day, reference } = parseTitle(title);
        const lines = cleanDesc.split(/\n+/).map(l => l.trim()).filter(Boolean);
        const gospelIdx = lines.findIndex(l => l.length > 40);
        const gospelText = lines.slice(gospelIdx, gospelIdx + 4).join(' ');

        const parsed = { title, day, reference, gospelText, link };
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
        localStorage.setItem(cacheDate, today);
        setVatData(parsed);
        setVatLoading(false);
      })
      .catch(() => setVatLoading(false));
  }, []);

  const hours = simulatedTime.getHours();
  const greeting = hours < 12 ? 'GOOD MORNING' : hours < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const name = currentUser?.name || 'PILGRIM';

  const dateStr = simDateStr();
  const dev = getDevotional(dateStr);

  const todayStr = simDateStr();
  const todayMatches = matches.filter(m => new Date(m.date).toISOString().split('T')[0] === todayStr).sort((a, b) => new Date(a.date) - new Date(b.date));

  const me = players[new Date(simulatedTime).getDate() % (players.length || 1)];
  const predCount = Object.keys(predictions).filter(k => k.startsWith(currentUser?.id + '_')).length;

  // Use Vatican data for gospel, fallback to local
  const gospelRef = vatData?.reference || dev?.gospelReference || '';
  const gospelText = vatData?.gospelText || dev?.gospelText || '';

  return (
    <div className="panel-container">
      {/* Hero Greeting */}
      <div className="dashboard-hero">
        <div className="hero-date">
          {new Date(simulatedTime).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
        </div>
        <div className="hero-greeting">{greeting}, {name}</div>
        <div className="hero-sub">WELCOME BACK TO THE FIELD OF FAITH</div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-val">{todayMatches.length}</div>
            <div className="hero-stat-lbl">Today's Matches</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val" style={{ color: 'var(--accent)' }}>{predCount}</div>
            <div className="hero-stat-lbl">My Predictions</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val" style={{ color: 'var(--accent-green)' }}>
              {matches.filter(m => m.status === 'finished').length}
            </div>
            <div className="hero-stat-lbl">Results In</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val" style={{ color: 'var(--accent-red)' }}>
              {matches.filter(m => getLockStatus(m).type === 'live').length}
            </div>
            <div className="hero-stat-lbl">Live Now</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Today's Matches */}
        <div className="game-card">
          <div className="card-header">
            <span>TODAY'S FIXTURES</span>
            <button className="card-link" onClick={() => onNavigate('fixtures')}>ALL MATCHES →</button>
          </div>
          
          {todayMatches.length === 0 ? (
            <div style={{ color: 'var(--secondary)', textAlign: 'center', padding: '2rem 0', fontWeight: 600 }}>
              NO MATCHES SCHEDULED TODAY<br />
              <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>Use time controls to advance</span>
            </div>
          ) : (
            todayMatches.map(m => {
              const ls = getLockStatus(m);
              const typeMap = { live: 'tag-red', locked: 'tag-cyan', open: 'tag-green', finished: 'tag-gold' };
              return (
                <div key={m.id} className="mini-fixture">
                  <div>
                    <div className="fixture-matchup">
                      {m.homeFlag} {m.homeTeam} <span style={{ color: 'var(--secondary)' }}>vs</span> {m.awayTeam} {m.awayFlag}
                    </div>
                    <div className="fixture-meta-info">
                      {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {m.venue.split(',')[0]}
                    </div>
                  </div>
                  <span className={`tag ${typeMap[ls.type]}`}>{ls.label}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Featured Athlete — with real photo */}
        {me && (
          <div className="game-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => onNavigate('testimonies')}>
            <div className="card-header">
              <span>FEATURED FAITH ATHLETE</span>
              <button className="card-link">VIEW CARDS →</button>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1 }}>
              <PlayerImage src={me.image} name={me.name} size={90} />
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', lineHeight: 1 }}>{me.name}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 700, marginTop: '0.25rem' }}>
                  {me.position} · OVR {me.rating}{me.nationality ? ` · ${me.nationality}` : ''}
                </div>
                <div style={{ fontStyle: 'italic', fontSize: '0.95rem', marginTop: '1rem', borderLeft: `3px solid ${me.color || 'var(--accent)'}`, paddingLeft: '1rem', color: 'rgba(255,255,255,0.85)' }}>
                  "{me.quote}"
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gospel Preview — live from Vatican News */}
        <div className="game-card" style={{ cursor: 'pointer', borderTop: '4px solid var(--accent)', gridColumn: '1 / -1' }} onClick={() => onNavigate('devotional')}>
          <div className="card-header" style={{ borderBottom: 'none' }}>
            <span>TODAY'S GOSPEL</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Live badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
                letterSpacing: '1px',
                color: vatLoading ? '#888' : vatData ? '#00e676' : '#aaa',
                padding: '3px 8px',
                border: `1px solid ${vatLoading ? '#333' : vatData ? '#00e67633' : '#333'}`,
                borderRadius: '100px',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: vatLoading ? '#555' : vatData ? '#00e676' : '#555',
                  display: 'inline-block',
                  boxShadow: vatData ? '0 0 6px #00e676' : 'none',
                }} />
                {vatLoading ? 'LOADING...' : vatData ? 'LIVE' : 'LOCAL'}
              </span>
              <button className="card-link">OPEN DEVOTIONAL →</button>
            </div>
          </div>
          
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {gospelRef}
          </div>
          <div style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--secondary)', fontStyle: 'italic', marginBottom: '1rem' }}>
            "{gospelText?.substring(0, 200)}{gospelText?.length > 200 ? '...' : ''}"
          </div>
          {vatData && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
              SOURCE: VATICANNEWS.VA · UPDATED DAILY
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
