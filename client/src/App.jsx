import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Brain, LayoutDashboard, History, BarChart2 } from 'lucide-react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import VivaSetup from './pages/VivaSetup';
import VivaRoom from './pages/VivaRoom';
import FinalResult from './pages/FinalResult';
import Analytics from './pages/Analytics';
import SessionHistory from './pages/SessionHistory';
import SessionReview from './pages/SessionReview';
import { getStudentId } from './utils/studentId';

export default function App() {
  const navigate = useNavigate();
  // Ensure studentId exists on first render
  getStudentId();

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-logo">⚡ VivaMate AI</NavLink>
          <div className="navbar-nav">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <LayoutDashboard size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Dashboard
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <History size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              History
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <BarChart2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Analytics
            </NavLink>
            <button className="btn btn-primary btn-sm always-show" style={{ marginLeft: '0.5rem' }} onClick={() => navigate('/setup')}>
              <Brain size={14} /> Start Viva
            </button>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"           element={<Landing />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/setup"      element={<VivaSetup />} />
          <Route path="/viva"       element={<VivaRoom />} />
          <Route path="/result"     element={<FinalResult />} />
          <Route path="/analytics"  element={<Analytics />} />
          <Route path="/history"    element={<SessionHistory />} />
          <Route path="/sessions/:id" element={<SessionReview />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>
          ⚠️ <strong>Demo mode:</strong> Your identity is a random UUID stored in your browser — this is NOT secure authentication. No personal data (name, email) is stored.
          &nbsp;·&nbsp; VivaMate AI © 2025
        </p>
      </footer>
    </div>
  );
}
