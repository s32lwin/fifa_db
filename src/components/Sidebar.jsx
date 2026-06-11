import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '⚽', label: 'HUB' },
  { id: 'fixtures', icon: '📋', label: 'MATCH' },
  { id: 'devotional', icon: '📖', label: 'WORD' },
  { id: 'testimonies', icon: '🃏', label: 'CARDS' },
  { id: 'admin', icon: '🛡️', label: 'ADMIN' },
];

export default function Sidebar({ activePanel, onNavigate }) {
  return (
    <nav className="sidebar">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`nav-btn ${activePanel === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          title={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
