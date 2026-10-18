import React, { useState, useEffect } from 'react';
import { Moon, Sun, Clock, Menu } from 'lucide-react';
import { StaffUser, RestaurantVenue } from '../../types';
import { Badge } from '../common/Badge';

interface HeaderProps {
  venue: RestaurantVenue;
  user: StaffUser;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  venue,
  user,
  theme,
  onToggleTheme,
  onToggleMobileMenu,
}) => {
  const [seconds, setSeconds] = useState(3600 * 2 + 15 * 60 + 42); // 02:15:42 simulated start

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatShiftTimer = (totalSeconds: number) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Left: Mobile hamburger + Venue Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleMobileMenu}
          style={{
            display: 'none',
            padding: '8px',
            borderRadius: '8px',
            color: 'var(--text-main)',
          }}
          className="mobile-menu-btn"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              {venue.name}
            </span>
            {venue.isDemo && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--gold-glow)',
                  color: 'var(--gold)',
                  border: '1px solid var(--gold)33',
                  letterSpacing: '0.05em',
                }}
              >
                ISOLATED DEV
              </span>
            )}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Venue Code: {venue.code} &bull; Benzin Hospitality OS
          </span>
        </div>
      </div>

      {/* Right: Clock Widget, Staff Badge, Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Active Shift Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
          }}
          title="Active Shift Timecard Duration"
        >
          <Clock size={15} color="var(--teal)" />
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--teal)',
              letterSpacing: '0.05em',
            }}
          >
            {formatShiftTimer(seconds)}
          </span>
        </div>

        {/* Staff User & Role */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13px',
            }}
          >
            {user.name.charAt(0)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
              {user.name}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {user.position || user.role.toUpperCase()}
            </span>
          </div>
          <Badge role={user.role} />
        </div>

        {/* Theme Switcher */}
        <button
          onClick={onToggleTheme}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={17} color="var(--gold)" /> : <Moon size={17} color="var(--brand-primary)" />}
        </button>
      </div>
    </header>
  );
};
