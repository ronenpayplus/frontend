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
            to="/beneficial-owners"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3" />
              <circle cx="16" cy="9" r="2.5" />
              <path d="M4 20c0-3 2.5-5 5-5s5 2 5 5" />
              <path d="M13 20c.3-2.1 1.9-3.6 3.8-4" />
            </svg>
            <span>בעלי שליטה</span>
          </NavLink>
          <NavLink
            to="/contacts"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <span>אנשי קשר</span>
          </NavLink>
          <NavLink
            to="/compliance-documents"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="14" y2="17" />
            </svg>
            <span>מסמכי ציות</span>
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
            to="/sub-merchants"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="8" height="6" rx="1" />
              <rect x="13" y="5" width="8" height="6" rx="1" />
              <rect x="8" y="14" width="8" height="6" rx="1" />
            </svg>
            <span>תתי-סוחרים</span>
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

          <div className="nav-section-title">טבלאות עזר</div>
          <NavLink
            to="/reference/countries"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18" />
              <path d="M12 3a9 9 0 0 1 0 18" />
              <path d="M12 3a9 9 0 0 0 0 18" />
            </svg>
            <span>מדינות</span>
          </NavLink>
          <NavLink
            to="/reference/currencies"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 10c0-1.1 1.8-2 4-2s4 .9 4 2-1.8 2-4 2-4 .9-4 2 1.8 2 4 2 4-.9 4-2" />
            </svg>
            <span>מטבעות</span>
          </NavLink>
          <NavLink
            to="/reference/timezones"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>אזורי זמן</span>
          </NavLink>
          <NavLink
            to="/reference/payment-methods"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <line x1="7" y1="10" x2="17" y2="10" />
              <line x1="7" y1="14" x2="12" y2="14" />
            </svg>
            <span>אמצעי תשלום</span>
          </NavLink>
          <NavLink
            to="/reference/channel-types"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="7" height="16" rx="1" />
              <rect x="14" y="8" width="7" height="12" rx="1" />
              <line x1="6.5" y1="8" x2="6.5" y2="8" />
              <line x1="17.5" y1="12" x2="17.5" y2="12" />
            </svg>
            <span>ערוצי מכירה</span>
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
