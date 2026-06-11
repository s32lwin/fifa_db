import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function LoginModal({ onClose }) {
  const { users, setUsers, setCurrentUser, showToast } = useApp();
  const [step, setStep] = useState(1);
  const [team, setTeam] = useState('default');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  const allTeams = [
    { name: "Algeria", flag: "🇩🇿" },
    { name: "Argentina", flag: "🇦🇷" },
    { name: "Australia", flag: "🇦🇺" },
    { name: "Austria", flag: "🇦🇹" },
    { name: "Belgium", flag: "🇧🇪" },
    { name: "Bosnia and Herzegovina", flag: "🇧🇦" },
    { name: "Brazil", flag: "🇧🇷" },
    { name: "Cabo Verde", flag: "🇨🇻" },
    { name: "Canada", flag: "🇨🇦" },
    { name: "Colombia", flag: "🇨🇴" },
    { name: "Congo DR", flag: "🇨🇩" },
    { name: "Côte d'Ivoire", flag: "🇨🇮" },
    { name: "Croatia", flag: "🇭🇷" },
    { name: "Curaçao", flag: "🇨🇼" },
    { name: "Czechia", flag: "🇨🇿" },
    { name: "Ecuador", flag: "🇪🇨" },
    { name: "Egypt", flag: "🇪🇬" },
    { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { name: "France", flag: "🇫🇷" },
    { name: "Germany", flag: "🇩🇪" },
    { name: "Ghana", flag: "🇬🇭" },
    { name: "Haiti", flag: "🇭🇹" },
    { name: "IR Iran", flag: "🇮🇷" },
    { name: "Iraq", flag: "🇮🇶" },
    { name: "Japan", flag: "🇯🇵" },
    { name: "Jordan", flag: "🇯🇴" },
    { name: "Korea Republic", flag: "🇰🇷" },
    { name: "Mexico", flag: "🇲🇽" },
    { name: "Morocco", flag: "🇲🇦" },
    { name: "Netherlands", flag: "🇳🇱" },
    { name: "New Zealand", flag: "🇳🇿" },
    { name: "Norway", flag: "🇳🇴" },
    { name: "Panama", flag: "🇵🇦" },
    { name: "Paraguay", flag: "🇵🇾" },
    { name: "Portugal", flag: "🇵🇹" },
    { name: "Qatar", flag: "🇶🇦" },
    { name: "Saudi Arabia", flag: "🇸🇦" },
    { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
    { name: "Senegal", flag: "🇸🇳" },
    { name: "South Africa", flag: "🇿🇦" },
    { name: "Spain", flag: "🇪🇸" },
    { name: "Sweden", flag: "🇸🇪" },
    { name: "Switzerland", flag: "🇨🇭" },
    { name: "Tunisia", flag: "🇹🇳" },
    { name: "Türkiye", flag: "🇹🇷" },
    { name: "Uruguay", flag: "🇺🇾" },
    { name: "USA", flag: "🇺🇸" },
    { name: "Uzbekistan", flag: "🇺🇿" }
  ];

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        showToast(`🙏 Welcome back, ${userSnap.data().name}!`, 'success');
        onClose();
      } else {
        setPendingUser(firebaseUser);
        setStep(2);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      showToast(`❌ Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const finalizeOnboarding = async () => {
    if (!pendingUser) return;
    setLoading(true);
    try {
      const newUser = {
        id: pendingUser.uid,
        name: pendingUser.displayName || 'Pilgrim',
        email: pendingUser.email,
        favTeam: team,
        points: 0
      };
      
      await setDoc(doc(db, 'users', pendingUser.uid), newUser);
      
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      
      showToast(`🙏 Welcome ${newUser.name}! KICK OFF!`, 'success');
      onClose();
    } catch (error) {
      console.error("Onboarding error:", error);
      showToast(`❌ Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !loading && onClose()}>
      <div className="modal-box">
        {step === 1 ? (
          <>
            <h2 className="modal-title">ENTER SQUAD</h2>
            <div className="modal-subtitle">Sign in securely to track your predictions, climb the leaderboard, and save your daily reflections.</div>
            
            <button className="btn-google" onClick={handleGoogleSignIn} disabled={loading}>
              {loading ? 'CONNECTING...' : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  SIGN IN WITH GOOGLE
                </>
              )}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={onClose} disabled={loading} style={{ background: 'transparent', border: 'none', color: 'var(--secondary)' }}>
                CANCEL
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="modal-title">FINAL STEP</h2>
            <div className="modal-subtitle">Welcome {pendingUser?.displayName}! Choose your favorite World Cup team.</div>

            <div className="form-group">
              <label className="form-label">Favorite World Cup Team</label>
              <select className="form-select" value={team} onChange={e => setTeam(e.target.value)}>
                <option value="default">Neutral / None</option>
                {allTeams.map(t => (
                  <option key={t.name} value={t.name}>{t.name} {t.flag}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn-primary" onClick={finalizeOnboarding} disabled={loading} style={{ width: '100%' }}>
                {loading ? 'SAVING...' : 'KICK OFF'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
