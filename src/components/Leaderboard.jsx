import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Leaderboard() {
  const { users, currentUser } = useApp();
  const [search, setSearch] = useState('');

  const sorted = [...users].sort((a, b) => b.points - a.points);
  const filtered = search
    ? sorted.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
    : sorted;

  const teamFlags = {
    default: '🏳️', brazil: '🇧🇷', argentina: '🇦🇷', mexico: '🇲🇽',
    usa: '🇺🇸', canada: '🇨🇦', germany: '🇩🇪', 'south-africa': '🇿🇦',
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <div>
          <h1 className="panel-title">LEADERBOARD</h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--grey)', letterSpacing: '2px', marginTop: '0.25rem' }}>
            {users.length} PARTICIPANTS · LIVE STANDINGS
          </div>
        </div>
        <span className="panel-badge">{sorted[0]?.name?.toUpperCase() || '---'} LEADS</span>
      </div>

      {/* Top 3 Podium */}
      {sorted.length >= 3 && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '1rem', marginBottom: '1.5rem',
        }}>
          {[sorted[1], sorted[0], sorted[2]].map((u, i) => {
            const actualRank = i === 1 ? 1 : i === 0 ? 2 : 3;
            const heights = ['140px', '180px', '120px'];
            const golds = [
              'linear-gradient(135deg, #c0c0c0 0%, #808080 100%)',
              'linear-gradient(135deg, #ffd740 0%, #ffa000 100%)',
              'linear-gradient(135deg, #cd7f32 0%, #8b4513 100%)',
            ];
            if (!u) return <div key={i} />;
            return (
              <div key={u.id} style={{
                background: 'rgba(0,20,40,0.6)',
                border: `1px solid ${actualRank === 1 ? 'rgba(255,215,64,0.4)' : 'rgba(0,180,255,0.12)'}`,
                padding: '1.25rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                height: heights[i],
                justifyContent: 'flex-end',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                position: 'relative',
              }}>

                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '2px', textAlign: 'center' }}>
                  {u.name}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)' }}>
                  {u.points} <span style={{ fontSize: '0.8rem', color: 'var(--grey)' }}>PTS</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--grey)', fontFamily: 'var(--font-mono)' }}>
                  {teamFlags[u.favTeam] || '🏳️'} {u.favTeam?.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <input
        className="lb-search"
        placeholder="🔍  SEARCH PARTICIPANTS..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Table Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 120px 100px',
        gap: '1rem', padding: '0.5rem 1.25rem',
        fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
        color: 'var(--grey)', letterSpacing: '2px',
        borderBottom: '1px solid rgba(0,180,255,0.15)',
      }}>
        <span>PARTICIPANT</span>
        <span>TEAM</span>
        <span style={{ textAlign: 'right' }}>PTS</span>
      </div>

      {/* Rows */}
      {filtered.map(u => {
        const isSelf = u.id === currentUser?.id;
        return (
          <div key={u.id} className={`leaderboard-row ${isSelf ? 'self' : ''}`} style={{ gridTemplateColumns: '1fr 120px 100px' }}>
            <div>
              <div className={`lb-name ${isSelf ? 'self' : ''}`}>
                {u.name} {isSelf && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--cyan)' }}>(YOU)</span>}
              </div>
            </div>
            <div className="lb-team">
              {teamFlags[u.favTeam] || '🏳️'} {u.favTeam?.toUpperCase()}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="lb-points">{u.points}</div>
              <div className="lb-pts-label">POINTS</div>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--grey)', fontFamily: 'var(--font-mono)' }}>
          NO RESULTS FOUND
        </div>
      )}
    </div>
  );
}
