import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';


export default function Admin() {
  const {
    currentUser,
    matches, setMatches,
    devotionals, setDevotionals,
    users, setUsers,
    predictions,
    announcement, setAnnouncement,
    evaluateLeaderboard, showToast,
  } = useApp();

  const isAdmin = currentUser?.email === 'selwinoliver7@gmail.com';

  // Match sim state
  const [selMatch, setSelMatch] = useState(0);
  const [simH, setSimH] = useState(0);
  const [simA, setSimA] = useState(0);

  // CMS state
  const [selDate, setSelDate] = useState('2026-06-10');
  const [cmsFields, setCmsFields] = useState({});





  // Match result
  const submitResult = () => {
    const match = matches[selMatch];
    if (!match) return;
    const updated = matches.map((m, i) =>
      i === selMatch ? { ...m, homeScore: parseInt(simH), awayScore: parseInt(simA), status: 'finished' } : m
    );
    setMatches(updated);
    evaluateLeaderboard(updated, predictions);
    showToast(`✅ RESULT: ${match.homeTeam} ${simH} - ${simA} ${match.awayTeam} SAVED.`, 'success');
  };

  // CMS Load
  const loadDate = (date) => {
    const dev = devotionals.find(d => d.date === date) || {};
    setCmsFields(dev);
    setSelDate(date);
  };

  const saveCMS = async () => {
    const updated = { ...cmsFields, date: selDate };
    
    if (db.app.options.apiKey && db.app.options.apiKey !== "YOUR_API_KEY") {
      try {
        await setDoc(doc(db, "devotionals", selDate), updated);
        showToast(`📖 GOSPEL UPDATED IN FIREBASE FOR ${selDate}`, 'success');
      } catch (error) {
        console.error("Error saving to Firebase:", error);
        showToast("❌ Failed to save to database", "error");
      }
    } else {
      const idx = devotionals.findIndex(d => d.date === selDate);
      const newDevs = idx >= 0
        ? devotionals.map((d, i) => i === idx ? updated : d)
        : [...devotionals, updated];
      setDevotionals(newDevs);
      showToast(`📖 GOSPEL UPDATED LOCALLY FOR ${selDate}`, 'success');
    }
  };

  // User override
  const [selUser, setSelUser] = useState(0);
  const [overridePts, setOverridePts] = useState(0);
  const saveUserPts = () => {
    const updated = users.map((u, i) => i === selUser ? { ...u, points: parseInt(overridePts) } : u);
    setUsers(updated);
    showToast(`🛡️ ${users[selUser]?.name} score set to ${overridePts} PTS`, 'success');
  };

  // Export CSV
  const exportCSV = () => {
    const rows = ['Name,Team,Points', ...users.map(u => `"${u.name}",${u.favTeam},${u.points}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'wcc_standings.csv';
    a.click(); URL.revokeObjectURL(url);
    showToast('📥 STANDINGS EXPORTED AS CSV', 'success');
  };

  // Announcement broadcast
  const [broadcastText, setBroadcastText] = useState('');
  const broadcast = () => { setAnnouncement(broadcastText); showToast('📢 BROADCAST SENT.', 'success'); };
  const clearBroadcast = () => { setAnnouncement(''); showToast('BROADCAST CLEARED.', 'info'); };

  if (!isAdmin) {
    return (
      <div className="panel-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <div className="admin-gate" style={{
          background: 'var(--bg-panel)',
          padding: '4rem 3rem',
          borderRadius: '16px',
          border: 'var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          backdropFilter: 'blur(12px)',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}>
          <div className="admin-gate-icon" style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))' }}>🛡️</div>
          <div className="admin-gate-title" style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', letterSpacing: '2px', textAlign: 'center', lineHeight: 1 }}>ACCESS DENIED</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--secondary)', letterSpacing: '1px', textAlign: 'center', lineHeight: '1.6' }}>
            THIS TERMINAL IS RESTRICTED TO THE SUPER ADMIN.<br />PLEASE SIGN IN WITH THE AUTHORIZED ACCOUNT.
          </div>
        </div>
      </div>
    );
  }

  const curMatchTeams = matches[selMatch] ? `${matches[selMatch].homeTeam} vs ${matches[selMatch].awayTeam}` : '';

  return (
    <div className="panel-container">
      <div className="panel-header">
        <div>
          <h1 className="panel-title">ADMIN TERMINAL</h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--green-neon)', letterSpacing: '2px', marginTop: '0.25rem' }}>
            🔑 SUPER ADMIN AUTHENTICATED · ALL SYSTEMS UNLOCKED
          </div>
        </div>
      </div>

      <div className="admin-grid">

        {/* Match Result Simulator */}
        <div className="admin-section">
          <div className="admin-section-title">⚽ MATCH RESULT SIMULATOR</div>
          <div className="form-group">
            <label className="form-label">Select Match</label>
            <select className="form-select" value={selMatch} onChange={e => { setSelMatch(+e.target.value); setSimH(0); setSimA(0); }}>
              {matches.map((m, i) => (
                <option key={m.id} value={i}>{m.homeTeam} vs {m.awayTeam} [{m.status}]</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Official Score — {curMatchTeams}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="number" className="form-input" style={{ width: 70 }} min="0" value={simH} onChange={e => setSimH(e.target.value)} />
              <span style={{ color: 'var(--grey)', fontFamily: 'var(--font-display)' }}>—</span>
              <input type="number" className="form-input" style={{ width: 70 }} min="0" value={simA} onChange={e => setSimA(e.target.value)} />
            </div>
          </div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={submitResult}>
            FINALIZE & AWARD POINTS
          </button>
        </div>

        {/* User Moderation */}
        <div className="admin-section">
          <div className="admin-section-title">👤 PARTICIPANT MODERATION</div>
          <div className="form-group">
            <label className="form-label">Select Participant</label>
            <select className="form-select" value={selUser} onChange={e => { setSelUser(+e.target.value); setOverridePts(users[+e.target.value]?.points || 0); }}>
              {users.map((u, i) => <option key={u.id} value={i}>{u.name} ({u.points} pts)</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Override Points</label>
            <input type="number" className="form-input" min="0" value={overridePts} onChange={e => setOverridePts(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={saveUserPts}>SAVE SCORE</button>
            <button className="btn-secondary" onClick={exportCSV}>📥 EXPORT CSV</button>
          </div>
        </div>

        {/* Devotional CMS */}
        <div className="admin-section" style={{ gridColumn: '1 / -1' }}>
          <div className="admin-section-title">📖 DEVOTIONAL CMS OVERRIDE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Calendar Date</label>
              <select className="form-select" value={selDate} onChange={e => loadDate(e.target.value)}>
                {['2026-06-10','2026-06-11','2026-06-12','2026-06-13','2026-06-14'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Gospel Reference</label>
              <input className="form-input" value={cmsFields.gospelReference || ''} onChange={e => setCmsFields(p => ({ ...p, gospelReference: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Saint of the Day</label>
              <input className="form-input" value={cmsFields.saintOfDay || ''} onChange={e => setCmsFields(p => ({ ...p, saintOfDay: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Scripture Text</label>
            <textarea className="form-textarea" value={cmsFields.gospelText || ''} onChange={e => setCmsFields(p => ({ ...p, gospelText: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Reflection</label>
              <textarea className="form-textarea" value={cmsFields.reflection || ''} onChange={e => setCmsFields(p => ({ ...p, reflection: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Prayer of the Day</label>
              <textarea className="form-textarea" value={cmsFields.prayer || ''} onChange={e => setCmsFields(p => ({ ...p, prayer: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Faith + Football Connection</label>
              <textarea className="form-textarea" value={cmsFields.footballFaithConnection || ''} onChange={e => setCmsFields(p => ({ ...p, footballFaithConnection: e.target.value }))} />
            </div>
          </div>
          <button className="btn-primary" onClick={saveCMS}>SAVE DEVOTIONAL REFLECTION</button>
        </div>

        {/* Announcement Broadcaster */}
        <div className="admin-section" style={{ gridColumn: '1 / -1' }}>
          <div className="admin-section-title">📢 ANNOUNCEMENT BROADCASTER</div>
          <div className="form-group">
            <label className="form-label">Broadcast Message (shows globally at top)</label>
            <input className="form-input" value={broadcastText} onChange={e => setBroadcastText(e.target.value)} placeholder="Enter your message..." />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-primary" onClick={broadcast}>BROADCAST</button>
            <button className="btn-danger" onClick={clearBroadcast}>CLEAR BANNER</button>
          </div>
        </div>
      </div>
    </div>
  );
}
