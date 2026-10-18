import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  TableProperties,
  Archive,
  Package,
  BookOpen,
  BarChart3,
  Users,
  Menu,
  User,
  LogOut,
} from 'lucide-react';
import { AdminTabId, RestaurantVenue, StaffUser } from '../../types';

interface HeaderProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  venue: RestaurantVenue;
  user: StaffUser;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleMobileMenu: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  venue,
  user,
  theme,
  onToggleTheme,
  onToggleMobileMenu,
  onLogout,
}) => {
  const [isClockedIn, setIsClockedIn] = useState<boolean>(user.isClockedIn || false);
  const [shiftSeconds, setShiftSeconds] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isClockedIn) {
      timer = setInterval(() => {
        setShiftSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isClockedIn]);

  const toggleShiftClock = () => {
    setIsClockedIn((prev) => !prev);
  };

  const formatShiftTimer = (totalSeconds: number) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <header>
      <div className="header-brand">
        <a className="logo-badge" href="#" onClick={(e) => { e.preventDefault(); onSelectTab('kds'); }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.6))' }}>
            <defs>
              <linearGradient id="benzinGradHeader" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0099FF" />
                <stop offset="50%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#E5B13A" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.5 L20.22 7.25 V16.75 L12 21.5 L3.78 16.75 V7.25 Z"
              stroke="url(#benzinGradHeader)"
              strokeWidth="2.2"
              strokeLinejoin="round"
              fill="rgba(0,153,255,0.06)"
            />
            <circle cx="12" cy="12" r="5" stroke="url(#benzinGradHeader)" strokeWidth="1.8" fill="none" />
            <circle cx="20.22" cy="7.25" r="1.6" fill="#38BDF8" />
            <circle cx="20.22" cy="16.75" r="1.6" fill="#38BDF8" />
            <circle cx="12" cy="21.5" r="1.6" fill="#E5B13A" />
            <circle cx="3.78" cy="16.75" r="1.6" fill="#E5B13A" />
            <circle cx="3.78" cy="7.25" r="1.6" fill="#38BDF8" />
          </svg>
          <div>
            <h1>BENZIN</h1>
            <p id="currentRestaurantName">{venue.name || 'Cavalli'}</p>
          </div>
        </a>

        {/* ☰ Mobile Navigation Menu Toggle Button */}
        <button
          className="btn touch-target"
          id="adminMobileMenuBtn"
          aria-label="Open navigation menu"
          onClick={onToggleMobileMenu}
          style={{
            display: 'none',
            padding: '6px 12px',
            background: 'var(--card2)',
            border: '1.5px solid var(--line)',
            borderRadius: '10px',
            color: 'var(--cream)',
            fontWeight: 800,
            fontSize: '13px',
            gap: '6px',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Menu style={{ width: '18px', height: '18px', color: 'var(--ember)' }} />
          <span>Menu</span>
        </button>
      </div>

      {/* Navigation Tabs across all pages */}
      <div className="nav-tabs" id="admin-mobile-navigation" aria-label="Admin navigation">
        <button
          className={`nav-tab ${activeTab === 'kds' ? 'active' : ''}`}
          id="navTab-kds"
          onClick={() => onSelectTab('kds')}
        >
          <LayoutGrid style={{ width: '15px', height: '15px' }} />
          <span>Live Tickets</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'tables' ? 'active' : ''}`}
          id="navTab-tables"
          onClick={() => onSelectTab('tables')}
        >
          <TableProperties style={{ width: '15px', height: '15px' }} />
          <span>Tables Overview</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'archive' ? 'active' : ''}`}
          id="navTab-archive"
          onClick={() => onSelectTab('archive')}
        >
          <Archive style={{ width: '15px', height: '15px' }} />
          <span>Archive Tickets</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          id="navTab-inventory"
          onClick={() => onSelectTab('inventory')}
        >
          <Package style={{ width: '15px', height: '15px' }} />
          <span>Inventory Stock</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'menu' ? 'active' : ''}`}
          id="navTab-menu"
          onClick={() => onSelectTab('menu')}
        >
          <BookOpen style={{ width: '15px', height: '15px' }} />
          <span>Menu Catalog</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'sales' ? 'active' : ''}`}
          id="navTab-sales"
          onClick={() => onSelectTab('sales')}
        >
          <BarChart3 style={{ width: '15px', height: '15px' }} />
          <span>Sales &amp; Tax Ledger</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'staff' ? 'active' : ''}`}
          id="navTab-staff"
          onClick={() => onSelectTab('staff')}
        >
          <Users style={{ width: '15px', height: '15px' }} />
          <span>Staff &amp; Payroll</span>
        </button>
      </div>

      {/* Right Controls: Active Shift Timer, Profile Badge, Theme Switcher & Logout */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Interactive Clock In / Clock Out Button */}
        <button
          id="headerTimeclockBtn"
          className="btn"
          style={{
            padding: '6px 14px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: isClockedIn ? '1.5px solid var(--success)' : '1px solid var(--line)',
          }}
          onClick={toggleShiftClock}
          title="Toggle Clock In / Clock Out for current user"
        >
          <div
            id="headerClockDot"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isClockedIn ? 'var(--success)' : 'var(--muted)',
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <div id="headerShiftTimerText" style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'monospace' }}>
              {formatShiftTimer(shiftSeconds)}
            </div>
            <div id="headerClockBtnText" style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>
              {isClockedIn ? 'CLOCK OUT' : 'CLOCK IN'}
            </div>
          </div>
        </button>

        {/* Logged-in Profile Badge */}
        <div
          id="loggedInUserBox"
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--gold)',
            borderRadius: '10px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
          title="Staff Profile & Work Hours"
        >
          <User style={{ width: '16px', height: '16px', color: 'var(--gold)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div id="headerStaffName" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--cream)' }}>
                {user.name || 'Manager'}
              </div>
            </div>
            <div id="headerStaffRole" style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>
              {user.position || user.role.toUpperCase() || 'OWNER'}
            </div>
          </div>
        </div>

        {/* Theme Switcher Button */}
        <button
          className="btn"
          id="themeToggleBtn"
          onClick={onToggleTheme}
          style={{ padding: '8px 12px', fontSize: '12px' }}
          title="Toggle Light/Dark Theme"
        >
          <span id="themeIcon">{theme === 'dark' ? '🌙' : '☀️'}</span>{' '}
          <span id="themeLabel">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        {/* Logout */}
        <button
          className="btn"
          style={{
            background: 'rgba(239,68,68,0.15)',
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
          }}
          onClick={onLogout || (() => window.location.href = '/')}
        >
          <LogOut style={{ width: '14px', height: '14px' }} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
