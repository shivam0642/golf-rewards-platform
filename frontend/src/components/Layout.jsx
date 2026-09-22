import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">DH</div>
          <div>
            <div className="brand-name">Digital Heroes</div>
            <div className="brand-tag">Play. Score. Give back.</div>
          </div>
        </div>
        <nav className="main-nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/how-it-works">How it works</NavLink>
          <NavLink to="/charities">Charities</NavLink>
          <NavLink to="/draw">Draw</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              {user.role === 'ADMINISTRATOR' && <NavLink to="/admin">Admin</NavLink>}
              <button className="nav-button" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/signup" className="primary-link">Join now</NavLink>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
