import { useApp } from '../context/AppContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function TopBar({ onLoginClick }) {
  const {
    currentUser, setCurrentUser,
    users, showToast,
    announcement,
  } = useApp();



  const me = users.find(u => u.id === currentUser?.id);
  const pts = me?.points ?? 0;

  const logout = async () => {
    try {
      if (auth.currentUser) await signOut(auth);
      setCurrentUser({ id: 'guest', name: 'Pilgrim', favTeam: 'default', isAdmin: false });
      showToast('Logged out.', 'info');
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  return (
    <>
      {announcement && (
        <div className="announcement">
          <span>📢</span>
          <span>{announcement}</span>
        </div>
      )}
      <header className="top-bar">
        {/* Logo */}
        <div className="top-bar-logo" style={{ alignItems: 'center', gap: '0.75rem' }}>
          <img src="/assets/dbys-logo.png" alt="DBYS Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#fff', borderRadius: '50%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="logo-text" style={{ lineHeight: 1 }}>WCC 2026</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--cyan)', letterSpacing: '1px', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              POWERED BY DBYS_INP
            </div>
          </div>
        </div>



        {/* User Stats */}
        <div className="top-bar-right">
          <div className="stat-pill">
            <div>
              <div className="stat-pill-label">POINTS</div>
              <div className="stat-pill-value">{pts}</div>
            </div>
          </div>
          {currentUser?.id === 'guest' ? (
            <button className="btn-auth" onClick={onLoginClick}>SIGN IN</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cyan)' }}>
                👋 {currentUser.name}
              </span>
              <button
                className="btn-auth"
                style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                onClick={logout}
              >
                OUT
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
