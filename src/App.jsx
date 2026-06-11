import { useState, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import LoadingScreen from './components/LoadingScreen';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Fixtures from './components/Fixtures';
import Devotional from './components/Devotional';
import Testimonies from './components/Testimonies';
import Admin from './components/Admin';
import LoginModal from './components/LoginModal';
import Toast from './components/Toast';
import './index.css';

function AppShell() {
  const [loaded, setLoaded] = useState(false);
  const [panel, setPanel] = useState('dashboard');
  const [loginOpen, setLoginOpen] = useState(false);

  const handleLoadComplete = useCallback(() => setLoaded(true), []);

  if (!loaded) return <LoadingScreen onComplete={handleLoadComplete} />;

  const panels = {
    dashboard: <Dashboard onNavigate={setPanel} />,
    fixtures: <Fixtures />,
    devotional: <Devotional />,
    testimonies: <Testimonies />,
    admin: <Admin />,
  };

  return (
    <>
      <div className="app-shell">
        {/* Top Bar spans full width */}
        <TopBar onLoginClick={() => setLoginOpen(true)} />

        {/* Sidebar */}
        <Sidebar activePanel={panel} onNavigate={setPanel} />

        {/* Main Content */}
        <main className="main-content">
          {panels[panel]}
        </main>
      </div>

      {/* Overlays */}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
