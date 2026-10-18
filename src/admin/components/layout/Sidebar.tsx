import React from 'react';
import {
  LayoutDashboard,
  Flame,
  LayoutGrid,
  Utensils,
  Boxes,
  Users,
  BarChart3,
  X,
  Sparkles,
} from 'lucide-react';
import { AdminTabId } from '../../types';

interface SidebarProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: AdminTabId;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'kds', label: 'Live Tickets (KDS)', icon: <Flame size={18} />, badge: 'LIVE' },
    { id: 'tables', label: 'Floor Tables', icon: <LayoutGrid size={18} /> },
    { id: 'menu', label: 'Menu Catalog', icon: <Utensils size={18} /> },
    { id: 'inventory', label: 'Inventory Stock', icon: <Boxes size={18} /> },
    { id: 'staff', label: 'Staff Roster', icon: <Users size={18} /> },
    { id: 'sales', label: 'Sales & Revenue', icon: <BarChart3 size={18} /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--overlay-backdrop)',
            zIndex: 40,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          width: '260px',
          height: '100vh',
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          transition: 'transform 0.25s ease',
        }}
        className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Brand Header */}
        <div
          style={{
            height: '64px',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--brand-primary), #38BDF8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '16px',
                  fontWeight: 900,
                  color: 'var(--text-main)',
                  letterSpacing: '0.04em',
                }}
              >
                BENZIN OS
              </span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>
                ADMIN CONTROL
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={onCloseMobile}
            style={{
              display: 'none',
              padding: '6px',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
            }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '8px 12px 4px',
            }}
          >
            Management Suite
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--brand-primary)' : 'transparent',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                className={isActive ? 'nav-active' : 'nav-hover'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: isActive ? '#FFFFFF' : 'var(--text-muted)' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--danger-glow)',
                      color: isActive ? '#FFFFFF' : 'var(--danger)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Architecture</span>
            <span style={{ color: 'var(--teal)', fontWeight: 700 }}>React + Vite</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Status</span>
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>Phase 1 Shell</span>
          </div>
        </div>
      </aside>
    </>
  );
};
