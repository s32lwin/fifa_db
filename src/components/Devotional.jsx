import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const VATICAN_RSS = 'https://www.vaticannews.va/content/vaticannews/en/word-of-the-day.rss.xml';
const PROXY = 'https://api.allorigins.win/get?url=';

// Strip HTML tags cleanly
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
}

// Extract gospel reference from title like "Thursday 11 June 2026 – Matthew 10:7-13"
function parseTitle(title) {
  if (!title) return { day: '', reference: '' };
  const parts = title.split('–');
  if (parts.length >= 2) return { day: parts[0].trim(), reference: parts.slice(1).join('–').trim() };
  const dashParts = title.split('-');
  if (dashParts.length >= 2) return { day: dashParts[0].trim(), reference: dashParts.slice(1).join('-').trim() };
  return { day: title, reference: '' };
}

export default function Devotional() {
  const { simulatedTime, simDateStr, getDevotional, showToast } = useApp();
  const [vatData, setVatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  useEffect(() => {
    const cacheKey = 'wcc_vatican_gospel';
    const cacheDate = 'wcc_vatican_date';
    const today = new Date().toISOString().slice(0, 10);

    // Use cached data if already fetched today
    const cachedDate = localStorage.getItem(cacheDate);
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedDate === today && cachedData) {
      try {
        setVatData(JSON.parse(cachedData));
        setLoading(false);
        setLastFetched(cachedDate);
        return;
      } catch {}
    }

    setLoading(true);
    setError(false);

    fetch(`${PROXY}${encodeURIComponent(VATICAN_RSS)}`)
      .then(r => r.json())
      .then(json => {
        const xml = json.contents;
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');
        const items = doc.querySelectorAll('item');
        if (!items.length) throw new Error('No items');

        const item = items[0]; // Latest entry
        const title = item.querySelector('title')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const link = item.querySelector('link')?.textContent || 'https://www.vaticannews.va/en/word-of-the-day.html';
        const pubDate = item.querySelector('pubDate')?.textContent || '';

        // description is usually CDATA with the full gospel text + reflection
        const cleanDesc = stripHtml(description);
        const { day, reference } = parseTitle(title);

        // Try to split into gospel text and reflection (Vatican format usually separates them)
        const lines = cleanDesc.split(/\n+/).map(l => l.trim()).filter(Boolean);
        const gospelIdx = lines.findIndex(l => l.length > 40);
        const gospelText = lines.slice(gospelIdx, gospelIdx + 4).join(' ');
        const reflection = lines.slice(gospelIdx + 4).join(' ').slice(0, 600) || cleanDesc.slice(0, 400);

        const parsed = { title, day, reference, gospelText, reflection, link, pubDate };

        localStorage.setItem(cacheKey, JSON.stringify(parsed));
        localStorage.setItem(cacheDate, today);
        setVatData(parsed);
        setLastFetched(today);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  // Fallback to local gospel.json data
  const dateStr = simDateStr();
  const localDev = getDevotional(dateStr);

  const gospel = vatData?.reference || localDev?.gospelReference || '';
  const gospelText = vatData?.gospelText || localDev?.gospelText || '';
  const reflection = vatData?.reflection || localDev?.reflection || '';
  const prayer = localDev?.prayer || '';
  const saintOfDay = localDev?.saintOfDay || '';
  const footballFaith = localDev?.footballFaithConnection || '';
  const dayLabel = vatData?.day || new Date(simulatedTime).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  return (
    <div className="panel-container">
      <div className="panel-header">
        <div>
          <h1 className="panel-title">DEVOTIONAL ROOM</h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--grey)', letterSpacing: '2px', marginTop: '0.25rem' }}>
            WORLD CUP WITH CHRIST · {dayLabel.toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          {saintOfDay && <div className="saint-badge">✝ {saintOfDay}</div>}
          {/* Live source badge */}
          <a
            href="https://www.vaticannews.va/en/word-of-the-day.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              letterSpacing: '1px', color: loading ? '#aaa' : error ? '#ff6666' : '#00e676',
              textDecoration: 'none', padding: '4px 10px',
              border: `1px solid ${loading ? '#444' : error ? '#ff666644' : '#00e67644'}`,
              borderRadius: '100px', background: 'rgba(0,0,0,0.3)',
              transition: 'all 0.3s',
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: loading ? '#888' : error ? '#ff6666' : '#00e676',
              display: 'inline-block',
              boxShadow: loading || error ? 'none' : '0 0 6px #00e676',
              animation: loading ? 'none' : error ? 'none' : 'pulse 2s infinite',
            }} />
            {loading ? 'CONNECTING...' : error ? 'OFFLINE · LOCAL DATA' : 'LIVE · VATICAN NEWS'}
          </a>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '200px', flexDirection: 'column', gap: '1rem'
        }}>
          <div style={{
            width: 40, height: 40, border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: '#00e676', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--grey)', letterSpacing: '3px' }}>
            FETCHING TODAY'S GOSPEL FROM VATICAN NEWS...
          </div>
        </div>
      )}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>
          {/* Left: Scripture Reader */}
          <div className="bible-panel cut-corner">
            <div className="bible-cross-bg">✝</div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--gold)', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              HOLY GOSPEL
            </div>

            <div className="scripture-ref">{gospel}</div>

            <div className="scripture-quote">
              "{gospelText}"
            </div>

            <div className="section-divider" />

            {/* Reflection */}
            <div className="devotional-section-label">REFLECTION</div>
            <div className="devotional-text">{reflection}</div>

            {/* Vatican attribution */}
            {vatData && (
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
                  SOURCE:
                </span>
                <a href={vatData.link || 'https://www.vaticannews.va/en/word-of-the-day.html'} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textDecoration: 'none' }}>
                  VATICANNEWS.VA ↗
                </a>
              </div>
            )}

            {/* Faith + Football */}
            {footballFaith && (
              <>
                <div className="devotional-section-label" style={{ marginTop: '1rem' }}>FAITH + FOOTBALL</div>
                <div className="devotional-text" style={{ fontSize: '0.85rem', color: 'var(--grey)' }}>
                  {footballFaith}
                </div>
              </>
            )}
          </div>

          {/* Right: Prayer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {prayer && (
              <div style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(255,193,7,0.15)', padding: '1.25rem' }}>
                <div className="devotional-section-label">🙏 PRAYER OF THE DAY</div>
                <div className="prayer-block">
                  <div className="devotional-text" style={{ marginBottom: 0, fontStyle: 'italic' }}>
                    {prayer}
                  </div>
                </div>
              </div>
            )}

            {/* Live feed info card */}
            <div style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)', padding: '1.25rem', borderRadius: '8px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#00e676', letterSpacing: '2px', marginBottom: '0.75rem' }}>
                📡 LIVE DAILY GOSPEL
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--grey)', lineHeight: '1.6' }}>
                Today's Gospel is fetched live from{' '}
                <a href="https://www.vaticannews.va/en/word-of-the-day.html" target="_blank" rel="noopener noreferrer"
                  style={{ color: '#00e676', textDecoration: 'none' }}>Vatican News</a>
                {' '}and refreshes automatically every day to match the official Catholic liturgical calendar.
              </div>
            </div>

            {/* Previous Devotionals nav hint */}
            <div style={{ background: 'rgba(0,20,40,0.3)', border: 'var(--border-cyan)', padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--cyan)', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                📅 DEVOTIONAL JOURNEY
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--grey)', lineHeight: '1.5' }}>
                The live Vatican feed always shows <span style={{ color: 'var(--cyan)' }}>today's reading</span>.
                Admin can also post custom reflections for any match day via the Admin panel.
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
