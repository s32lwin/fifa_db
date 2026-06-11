import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Fixtures() {
  const { matches, predictions, setPredictions, getLockStatus, currentUser, evaluateLeaderboard, showToast } = useApp();
  const [filter, setFilter] = useState('all');
  const [localInputs, setLocalInputs] = useState({});

  const filtered = matches.filter(m => {
    if (filter === 'group') return m.stage === 'Group Stage';
    if (filter === 'knockout') return m.stage !== 'Group Stage';
    return true;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const setInput = (matchId, side, val) => {
    setLocalInputs(prev => ({ ...prev, [`${matchId}_${side}`]: val }));
  };

  const savePrediction = (match) => {
    if (currentUser?.id === 'guest') {
      showToast('🔒 Sign in to save predictions!', 'warning');
      return;
    }
    const ls = getLockStatus(match);
    if (ls.locked) { showToast('🔒 Predictions locked for this match!', 'error'); return; }

    const homeVal = localInputs[`${match.id}_home`];
    const awayVal = localInputs[`${match.id}_away`];
    const predKey = `${currentUser.id}_${match.id}`;
    const existing = predictions[predKey];

    const home = homeVal !== undefined ? parseInt(homeVal) : existing?.home;
    const away = awayVal !== undefined ? parseInt(awayVal) : existing?.away;

    if (home === undefined || away === undefined || isNaN(home) || isNaN(away)) {
      showToast('⚠️ Enter scores for both teams!', 'warning');
      return;
    }
    const newPreds = { ...predictions, [predKey]: { home, away, points: null } };
    setPredictions(newPreds);
    showToast(`🎯 Predicted: ${match.homeTeam} ${home} - ${away} ${match.awayTeam}`, 'success');
  };

  const getScoreDisplay = (match) => {
    if (match.status === 'finished') return `${match.homeScore} - ${match.awayScore}`;
    if (match.status === 'live') return 'LIVE';
    return 'vs';
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <div>
          <h1 className="panel-title">FIXTURES</h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--grey)', letterSpacing: '2px', marginTop: '0.25rem' }}>
            FIFA WORLD CUP 2026 · {matches.length} MATCHES
          </div>
        </div>
        <div className="filter-row">
          {[['all', 'ALL'], ['group', 'GROUP STAGE'], ['knockout', 'KNOCKOUT']].map(([val, label]) => (
            <button
              key={val}
              className={`filter-chip ${filter === val ? 'active' : ''}`}
              onClick={() => setFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--grey)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          NO KNOCKOUT MATCHES YET — CHECK BACK AFTER GROUP STAGE
        </div>
      )}

      {filtered.map(match => {
        const ls = getLockStatus(match);
        const predKey = `${currentUser?.id}_${match.id}`;
        const pred = predictions[predKey];
        const localH = localInputs[`${match.id}_home`];
        const localA = localInputs[`${match.id}_away`];
        const dispH = localH !== undefined ? localH : (pred?.home ?? '');
        const dispA = localA !== undefined ? localA : (pred?.away ?? '');

        const scoreClass = match.status === 'live' ? 'live' : match.status === 'finished' ? 'finished' : '';
        const cardClass = ls.type === 'live' ? 'locked' : ls.type === 'finished' ? 'finished' : '';

        const lockTagClass = { live: 'tag-red', locked: 'tag-red', open: 'tag-green', finished: 'tag-gold' }[ls.type];

        return (
          <div key={match.id} className={`fixture-card ${cardClass}`}>
            {/* Match Meta */}
            <div className="fixture-meta">
              <span className="fixture-group-tag">{match.group} · {match.stage}</span>
              <span className="fixture-time">
                {new Date(match.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="fixture-venue">{match.venue}</span>
              <span className={`tag ${lockTagClass}`} style={{ marginTop: '0.25rem', alignSelf: 'flex-start' }}>{ls.label}</span>
            </div>

            {/* Teams */}
            <div className="fixture-teams">
              <div className="team-side home">
                <span className="team-name">{match.homeTeam}</span>
                <span className="team-flag">{match.homeFlag}</span>
              </div>
              <div className={`score-display ${scoreClass}`}>
                {getScoreDisplay(match)}
              </div>
              <div className="team-side away">
                <span className="team-flag">{match.awayFlag}</span>
                <span className="team-name">{match.awayTeam}</span>
              </div>
            </div>

            {/* Predict Zone */}
            <div className="predict-zone">
              <div className="predict-label">
                {pred ? `YOUR PICK: ${pred.home} - ${pred.away}` : 'YOUR PREDICTION'}
              </div>
              <div className="predict-inputs">
                <input
                  type="number" min="0" max="20"
                  className="score-input"
                  value={dispH}
                  disabled={ls.locked}
                  onChange={e => setInput(match.id, 'home', e.target.value)}
                  placeholder="H"
                />
                <span className="score-input-sep">—</span>
                <input
                  type="number" min="0" max="20"
                  className="score-input"
                  value={dispA}
                  disabled={ls.locked}
                  onChange={e => setInput(match.id, 'away', e.target.value)}
                  placeholder="A"
                />
                <button
                  className="btn-save"
                  disabled={ls.locked}
                  onClick={() => savePrediction(match)}
                >
                  SAVE
                </button>
              </div>
              {pred?.points !== null && pred?.points !== undefined && (
                <div className={`pts-earned ${pred.points > 0 ? 'positive' : 'zero'}`}>
                  {pred.points > 0 ? `+${pred.points} PTS` : '0 PTS'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
