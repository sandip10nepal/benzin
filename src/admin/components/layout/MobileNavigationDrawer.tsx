import React from 'react';
import {
  LayoutGrid,
  TableProperties,
  Package,
  BookOpen,
  BarChart3,
  Users,
  User,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { AdminTabId, StaffUser } from '../../types';

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  user: StaffUser;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
}

export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  user,
  theme,
  onToggleTheme,
  onLogout,
  onSwitchAccount,
}) => {
  if (!isOpen) return null;

  const handleTabClick = (tab: AdminTabId) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <div
      id="mobileNavDrawerOverlay"
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 99990,
        padding: '16px',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--card)',
          border: '1.5px solid var(--line)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          color: 'var(--cream)',
          marginTop: '10px',
          animation: 'drawerSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header & User Profile Info */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--line)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User style={{ width: '22px', height: '22px', color: 'var(--gold)' }} />
            <div>
              <div id="mobileDrawerStaffName" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--cream)' }}>
                {user?.name || ''}
              </div>
              <div
                id="mobileDrawerStaffRole"
                style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}
              >
                {user?.position || user?.role?.toUpperCase() || ''}
              </div>
            </div>
          </div>
          <button
            className="btn touch-target"
            onClick={onClose}
            style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 800 }}
          >
            Close ✕
          </button>
        </div>

        {/* Shift Timeclock Banner */}
        <div
          style={{
            background: 'var(--card2)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Active Shift Timer
            </div>
            <div
              id="mobileDrawerShiftTimerText"
              style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--cream)' }}
            >
              00:00:00
            </div>
          </div>
          <button
            className="btn btn-primary touch-target"
            onClick={onClose}
            style={{ padding: '8px 14px', fontWeight: 800, fontSize: '13px' }}
          >
            Toggle Shift
          </button>
        </div>

        {/* Main Dashboard Navigation Items */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--gold)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px',
          }}
        >
          Dashboard Navigation
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <button
            className={`nav-tab ${activeTab === 'kds' ? 'active' : ''}`}
            id="drawerNavTab-kds"
            onClick={() => handleTabClick('kds')}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', fontSize: '14px', fontWeight: 800, borderRadius: '10px' }}
          >
            <LayoutGrid style={{ width: '18px', height: '18px', marginRight: '10px' }} />
            <span>Live Tickets</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'tables' ? 'active' : ''}`}
            id="drawerNavTab-tables"
            onClick={() => handleTabClick('tables')}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', fontSize: '14px', fontWeight: 800, borderRadius: '10px' }}
          >
            <TableProperties style={{ width: '18px', height: '18px', marginRight: '10px' }} />
            <span>Restaurant Overview</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            id="drawerNavTab-inventory"
            onClick={() => handleTabClick('inventory')}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', fontSize: '14px', fontWeight: 800, borderRadius: '10px' }}
          >
            <Package style={{ width: '18px', height: '18px', marginRight: '10px' }} />
            <span>Inventory Stock</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'menu' ? 'active' : ''}`}
            id="drawerNavTab-menu"
            onClick={() => handleTabClick('menu')}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', fontSize: '14px', fontWeight: 800, borderRadius: '10px' }}
          >
            <BookOpen style={{ width: '18px', height: '18px', marginRight: '10px' }} />
            <span>Menu Catalog</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'sales' ? 'active' : ''}`}
            id="drawerNavTab-sales"
            onClick={() => handleTabClick('sales')}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', fontSize: '14px', fontWeight: 800, borderRadius: '10px' }}
          >
            <BarChart3 style={{ width: '18px', height: '18px', marginRight: '10px' }} />
            <span>Sales &amp; Tax Ledger</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'staff' ? 'active' : ''}`}
            id="drawerNavTab-staff"
            onClick={() => handleTabClick('staff')}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', fontSize: '14px', fontWeight: 800, borderRadius: '10px' }}
          >
            <Users style={{ width: '18px', height: '18px', marginRight: '10px' }} />
            <span>Staff &amp; Payroll</span>
          </button>
        </div>

        {/* Controls & Actions */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--gold)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px',
          }}
        >
          Settings &amp; Session
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="btn touch-target"
            onClick={onToggleTheme}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', fontSize: '14px', fontWeight: 700, borderRadius: '10px' }}
          >
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span style={{ marginLeft: '8px' }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            className="btn touch-target"
            onClick={onSwitchAccount || onClose}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', fontSize: '14px', fontWeight: 700, borderRadius: '10px' }}
          >
            <RefreshCw style={{ width: '18px', height: '18px', marginRight: '10px', color: 'var(--gold)' }} />
            <span>Switch Staff Account</span>
          </button>
          <button
            className="btn touch-target"
            onClick={onLogout || (() => { window.location.href = '/'; })}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', fontSize: '14px', fontWeight: 700, borderRadius: '10px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
          >
            <LogOut style={{ width: '18px', height: '18px', marginRight: '10px' }} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
