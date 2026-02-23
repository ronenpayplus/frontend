import { Outlet, NavLink } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">P+</span>
          <span className="logo-text">PayPlus</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/companies"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>חברות</span>
          </NavLink>
          <NavLink
            to="/legal-entities"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="7" y1="9" x2="17" y2="9" />
              <line x1="7" y1="13" x2="17" y2="13" />
            </svg>
            <span>ישויות משפטיות</span>
          </NavLink>
          <NavLink
            to="/merchants"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 7h-9" />
              <path d="M14 17H5" />
              <circle cx="17" cy="17" r="3" />
              <circle cx="7" cy="7" r="3" />
            </svg>
            <span>סוחרים</span>
          </NavLink>
          <NavLink
            to="/merchant-accounts"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>חשבונות סוחר</span>
          </NavLink>
          <NavLink
            to="/stores"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9h18l-1 10H4L3 9z" />
              <path d="M7 9V5h10v4" />
            </svg>
            <span>חנויות</span>
          </NavLink>
          <NavLink
            to="/terminal-groups"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="8" height="7" rx="1" />
              <rect x="13" y="4" width="8" height="7" rx="1" />
              <rect x="8" y="14" width="8" height="7" rx="1" />
            </svg>
            <span>קבוצות טרמינל</span>
          </NavLink>
          <NavLink
            to="/terminals"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="7" y="2" width="10" height="20" rx="2" />
              <line x1="11" y1="5" x2="13" y2="5" />
              <line x1="11" y1="19" x2="13" y2="19" />
            </svg>
            <span>טרמינלים</span>
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
