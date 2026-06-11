import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const AppCtx = createContext(null);

const DEFAULT_USERS = [
  { id: 'user_1', name: 'Father Thomas', favTeam: 'brazil', points: 12 },
  { id: 'user_2', name: 'Sister Maria', favTeam: 'argentina', points: 9 },
  { id: 'user_3', name: 'GospelGoalie', favTeam: 'mexico', points: 7 },
  { id: 'user_4', name: 'FaithStriker', favTeam: 'usa', points: 4 },
  { id: 'user_5', name: 'Hope_FC', favTeam: 'default', points: 2 },
];

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function AppProvider({ children }) {
  const [matches, setMatchesRaw] = useState([]);
  const [devotionals, setDevotionalsRaw] = useState([]);
  const [players, setPlayersRaw] = useState([]);
  const [users, setUsersRaw] = useState(() => lsGet('wcc_users', DEFAULT_USERS));
  const [currentUser, setCurrentUserRaw] = useState(() => lsGet('wcc_current_user', { id: 'guest', name: 'Pilgrim', favTeam: 'default', isAdmin: false }));
  const [predictions, setPredictionsRaw] = useState(() => lsGet('wcc_predictions', {}));
  const [challenges, setChallengesRaw] = useState(() => lsGet('wcc_challenges', {}));
  const [announcement, setAnnouncementRaw] = useState(() => lsGet('wcc_announcement', '⚽ Welcome to World Cup with Christ 2026! Predictions lock 15 mins before kickoff. ✝️'));
  const [simulatedTime, setSimulatedTime] = useState(new Date());
  const [toast, setToast] = useState(null);
  const [synthActive, setSynthActive] = useState(false);
  const toastTimer = useRef(null);
  const audioCtxRef = useRef(null);
  const synthNodesRef = useRef(null);

  // Load JSON databases on mount
  useEffect(() => {
    let unsubDevotionals = () => {};
    let unsubUsers = () => {};
    let unsubAuth = () => {};
    let unsubPredictions = () => {};
    let unsubChallenges = () => {};
    let unsubMatches = () => {};

    const setupFirebaseListeners = () => {
      if (!db.app.options.apiKey || db.app.options.apiKey === "YOUR_API_KEY") {
        console.warn("Firebase not configured. Using local storage mode.");
        return false;
      }
      try {
        unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
          const fetchedMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (fetchedMatches.length > 0) {
            // Sort to ensure consistent order if needed
            fetchedMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
            setMatchesRaw(fetchedMatches);
            lsSet('wcc_matches', fetchedMatches);
          }
        }, (error) => console.error("Firebase matches error:", error));

        unsubDevotionals = onSnapshot(collection(db, "devotionals"), (snapshot) => {
          const devs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (devs.length > 0) {
            setDevotionalsRaw(devs);
            lsSet('wcc_devotionals', devs);
          }
        }, (error) => console.error("Firebase devs error:", error));

        unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
          const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (fetchedUsers.length > 0) {
            setUsersRaw(fetchedUsers);
            lsSet('wcc_users', fetchedUsers);
            
            // If we are logged in, make sure our currentUser state is fresh
            if (auth.currentUser) {
              const freshMe = fetchedUsers.find(u => u.id === auth.currentUser.uid);
              if (freshMe) setCurrentUserRaw(freshMe);
            }
          }
        }, (error) => console.error("Firebase users error:", error));

        unsubPredictions = onSnapshot(collection(db, "predictions"), (snapshot) => {
          const fetchedPreds = {};
          snapshot.docs.forEach(doc => {
            fetchedPreds[doc.id] = doc.data();
          });
          if (Object.keys(fetchedPreds).length > 0) {
            setPredictionsRaw(fetchedPreds);
            lsSet('wcc_predictions', fetchedPreds);
          }
        }, (error) => console.error("Firebase preds error:", error));

        unsubChallenges = onSnapshot(collection(db, "challenges"), (snapshot) => {
          const fetchedChalls = {};
          snapshot.docs.forEach(doc => {
            fetchedChalls[doc.id] = doc.data().completed;
          });
          if (Object.keys(fetchedChalls).length > 0) {
            setChallengesRaw(fetchedChalls);
            lsSet('wcc_challenges', fetchedChalls);
          }
        }, (error) => console.error("Firebase challenges error:", error));

        unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
              if (userDoc.exists()) {
                setCurrentUserRaw(userDoc.data());
                lsSet('wcc_current_user', userDoc.data());
              }
            } catch (e) {
              console.error("Auth fetch user error:", e);
            }
          } else {
            setCurrentUserRaw({ id: 'guest', name: 'Pilgrim', favTeam: 'default', isAdmin: false });
            localStorage.removeItem('wcc_current_user');
          }
        });

        return true;
      } catch (e) {
        console.error("Firebase init failed:", e);
        return false;
      }
    };

    const isFirebaseActive = setupFirebaseListeners();

    (async () => {
      try {
        const [mRes, dRes, pRes] = await Promise.all([
          fetch('/api/fixtures.json'),
          fetch('/api/gospel.json'),
          fetch('/api/players.json'),
        ]);
        const mData = await mRes.json();
        const dData = await dRes.json();
        const pData = await pRes.json();

        const storedM = lsGet('wcc_matches', []);
        const mergedMatches = [...storedM];
        let hasNewMatches = false;

        mData.forEach(apiMatch => {
          if (!mergedMatches.find(m => m.id === apiMatch.id)) {
            mergedMatches.push(apiMatch);
            hasNewMatches = true;
          }
        });

        if (hasNewMatches) {
          mergedMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
          setMatchesRaw(mergedMatches);
          lsSet('wcc_matches', mergedMatches);
          if (db.app.options.apiKey && db.app.options.apiKey !== "YOUR_API_KEY") {
            mergedMatches.forEach(async (match) => {
              try { await setDoc(doc(db, "matches", String(match.id)), match); } catch (e) {}
            });
          }
        } else {
          setMatchesRaw(storedM);
        }

        if (!isFirebaseActive) {
          const storedD = lsGet('wcc_devotionals', null);
          setDevotionalsRaw(storedD || dData);
          if (!storedD) lsSet('wcc_devotionals', dData);
        }

        if (!isFirebaseActive && lsGet('wcc_users', null) === null) {
          // Keep defaults if no firebase
        }

        const storedP = lsGet('wcc_players', null);
        setPlayersRaw(storedP || pData);
        if (!storedP) lsSet('wcc_players', pData);
      } catch (e) {
        console.error('API load error:', e);
      }
    })();

    return () => {
      unsubDevotionals();
      unsubUsers();
      unsubAuth();
      unsubPredictions();
      unsubChallenges();
      unsubMatches();
    };
  }, []);

  // Persist state
  const setMatches = (v) => { 
    const prev = matches;
    setMatchesRaw(v); 
    lsSet('wcc_matches', v); 
    if (db.app.options.apiKey && db.app.options.apiKey !== "YOUR_API_KEY") {
      v.forEach(async (match) => {
        const pMatch = prev.find(m => m.id === match.id);
        if (JSON.stringify(pMatch) !== JSON.stringify(match)) {
          try {
            await setDoc(doc(db, "matches", match.id), match);
          } catch (e) {
            console.error("Failed to sync match:", e);
          }
        }
      });
    }
  };
  const setDevotionals = (v) => { setDevotionalsRaw(v); lsSet('wcc_devotionals', v); };
  const setPlayers = (v) => { setPlayersRaw(v); lsSet('wcc_players', v); };
  const setUsers = (v) => { 
    setUsersRaw(v); 
    lsSet('wcc_users', v);
    if (db.app.options.apiKey && db.app.options.apiKey !== "YOUR_API_KEY") {
      v.forEach(async (user) => {
        try {
          await setDoc(doc(db, "users", user.id), user);
        } catch (e) {
          console.error("Failed to sync user:", e);
        }
      });
    }
  };
  const setPredictions = (v) => { 
    const prev = predictions;
    setPredictionsRaw(v); 
    lsSet('wcc_predictions', v); 
    if (db.app.options.apiKey && db.app.options.apiKey !== "YOUR_API_KEY") {
      Object.entries(v).forEach(async ([key, pred]) => {
        if (JSON.stringify(prev[key]) !== JSON.stringify(pred)) {
          try { await setDoc(doc(db, "predictions", key), pred); } catch (e) { console.error("Sync error:", e); }
        }
      });
    }
  };
  const setChallenges = (v) => { 
    const prev = challenges;
    setChallengesRaw(v); 
    lsSet('wcc_challenges', v); 
    if (db.app.options.apiKey && db.app.options.apiKey !== "YOUR_API_KEY") {
      Object.entries(v).forEach(async ([key, val]) => {
        if (prev[key] !== val) {
          try { await setDoc(doc(db, "challenges", key), { completed: val }); } catch (e) {}
        }
      });
    }
  };
  const setAnnouncement = (v) => { setAnnouncementRaw(v); lsSet('wcc_announcement', v); };
  const setCurrentUser = (v) => {
    setCurrentUserRaw(v);
    if (v?.id !== 'guest') lsSet('wcc_current_user', v);
    else localStorage.removeItem('wcc_current_user');
  };

  // Toast
  function showToast(msg, type = 'info') {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }

  // Time travel
  const advanceTime = (hours) => setSimulatedTime(prev => {
    const next = new Date(prev);
    next.setHours(next.getHours() + hours);
    return next;
  });
  const advanceDay = () => setSimulatedTime(prev => {
    const next = new Date(prev);
    next.setDate(next.getDate() + 1);
    return next;
  });
  const resetTime = () => setSimulatedTime(new Date());

  // Date utils
  const simDateStr = () => {
    const y = simulatedTime.getFullYear();
    const m = String(simulatedTime.getMonth() + 1).padStart(2, '0');
    const d = String(simulatedTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Lock logic
  const getLockStatus = (match) => {
    const matchMs = new Date(match.date).getTime();
    const simMs = simulatedTime.getTime();
    const lockMs = matchMs - 15 * 60 * 1000;
    if (match.status === 'finished') return { locked: true, label: 'FINISHED', type: 'finished' };
    if (simMs >= matchMs && simMs < matchMs + 2 * 60 * 60 * 1000) return { locked: true, label: 'LIVE', type: 'live' };
    if (simMs >= lockMs) return { locked: true, label: 'LOCKED', type: 'locked' };
    const mins = Math.ceil((lockMs - simMs) / 60000);
    if (mins > 1440) return { locked: false, label: `${Math.ceil(mins / 1440)}D LEFT`, type: 'open' };
    if (mins > 60) return { locked: false, label: `${Math.ceil(mins / 60)}H LEFT`, type: 'open' };
    return { locked: false, label: `${mins}M LEFT`, type: 'open' };
  };

  // Scoring
  const calcPoints = (pH, pA, aH, aA) => {
    if (pH === aH && pA === aA) return 3;
    const pd = pH - pA, ad = aH - aA;
    if ((pd > 0 && ad > 0) || (pd < 0 && ad < 0) || (pd === 0 && ad === 0)) return 1;
    return 0;
  };

  const evaluateLeaderboard = (newMatches, newPredictions) => {
    const m = newMatches || matches;
    const p = newPredictions || predictions;
    const finished = m.filter(x => x.status === 'finished');
    const updated = users.map(u => {
      let pts = 0;
      finished.forEach(match => {
        const pred = p[`${u.id}_${match.id}`];
        if (pred) pts += calcPoints(pred.home, pred.away, match.homeScore, match.awayScore);
      });
      for (const k in challenges) {
        if (k.endsWith(`_${u.id}`) && challenges[k]) pts += 1;
      }
      return { ...u, points: pts };
    });
    const sorted = [...updated].sort((a, b) => b.points - a.points);
    setUsers(sorted);
    if (currentUser?.id !== 'guest') {
      const me = sorted.find(u => u.id === currentUser.id);
      if (me) setCurrentUser({ ...currentUser, points: me.points });
    }
    return sorted;
  };

  // Devotional for date
  const getDevotional = (dateStr) => {
    const found = devotionals.find(d => d.date === dateStr);
    if (found) return found;
    if (devotionals.length > 0) return devotionals[new Date(dateStr).getDate() % devotionals.length];
    return { gospelReference: 'John 15:5', gospelText: 'Apart from me you can do nothing.', reflection: '...', prayer: '...', challenge: '...', footballFaithConnection: '...', saintOfDay: 'St. Polycarp' };
  };

  // Worship Synth
  const toggleSynth = () => {
    if (synthActive) {
      stopSynth();
      setSynthActive(false);
    } else {
      startSynth();
      setSynthActive(true);
    }
  };

  const startSynth = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 450;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 180;
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    lfo.start();
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.55;
    const fb = ctx.createGain();
    fb.gain.value = 0.4;
    delay.connect(fb);
    fb.connect(delay);
    [98, 146.83, 196, 246.94, 293.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 12;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.3 : 0.15;
      osc.connect(g);
      g.connect(lp);
      osc.start();
    });
    lp.connect(gain);
    lp.connect(delay);
    delay.connect(gain);
    gain.connect(ctx.destination);
    synthNodesRef.current = { gain };
  };

  const stopSynth = () => {
    if (synthNodesRef.current?.gain) {
      const g = synthNodesRef.current.gain;
      g.gain.setValueAtTime(g.gain.value, audioCtxRef.current.currentTime);
      g.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 1);
      setTimeout(() => { try { audioCtxRef.current?.close(); } catch {} }, 1100);
    }
    audioCtxRef.current = null;
    synthNodesRef.current = null;
  };

  const value = {
    matches, setMatches,
    devotionals, setDevotionals,
    players, setPlayers,
    users, setUsers,
    currentUser, setCurrentUser,
    predictions, setPredictions,
    challenges, setChallenges,
    announcement, setAnnouncement,
    simulatedTime,
    advanceTime, advanceDay, resetTime,
    simDateStr,
    getLockStatus,
    calcPoints,
    evaluateLeaderboard,
    getDevotional,
    toast, showToast,
    synthActive, toggleSynth,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
