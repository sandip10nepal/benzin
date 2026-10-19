import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { AdminTabId, RestaurantVenue, StaffUser } from '../../types';
import { AdminNavigation } from './AdminNavigation';
import { TimeclockControl } from './TimeclockControl';
import { EmployeeProfile } from './EmployeeProfile';
import { ThemeToggle } from './ThemeToggle';

interface AdminHeaderProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  venue: RestaurantVenue;
  user: StaffUser;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleMobileMenu: () => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onSwitchAccountClick?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onSelectTab,
  venue,
  user,
  theme,
  onToggleTheme,
  onToggleMobileMenu,
  onLogout,
  onProfileClick,
  onSwitchAccountClick,
}) => {
  return (
    <header>
      <div className="header-brand">
        <a
          className="logo-badge"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('kds');
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.6))',
              transition: 'transform 0.3s ease',
            }}
          >
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
          aria-expanded="false"
          aria-controls="admin-mobile-navigation"
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
      <AdminNavigation activeTab={activeTab} onSelectTab={onSelectTab} />

      {/* Right Controls: Active Shift Timer, Profile Badge, Theme Switcher & Logout */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <TimeclockControl initialClockedIn={user.isClockedIn} />
        <EmployeeProfile
          user={user}
          onClickProfile={onProfileClick}
          onClickSwitch={onSwitchAccountClick}
        />
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />

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
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onClick={onLogout || (() => { window.location.href = '/'; })}
        >
          <LogOut style={{ width: '14px', height: '14px' }} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
