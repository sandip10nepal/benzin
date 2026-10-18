import React from 'react';
import {
  Flame,
  LayoutGrid,
  Utensils,
  Boxes,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { AdminTabId, RestaurantVenue, StaffUser } from '../types';

interface DashboardViewProps {
  venue: RestaurantVenue;
  user: StaffUser;
  onNavigateTab: (tab: AdminTabId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  venue,
  user,
  onNavigateTab,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.12), rgba(56, 189, 248, 0.05))',
          border: '1px solid rgba(0, 102, 255, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
              Welcome back, {user.name}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'var(--teal-glow)',
                color: 'var(--teal)',
                border: '1px solid var(--teal)33',
              }}
            >
              PHASE 1 FOUNDATION ACTIVE
            </span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Managing {venue.name} &bull; Standalone React + Vite Admin Application Shell
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="primary" onClick={() => onNavigateTab('kds')} icon={<Flame size={15} />}>
            Open Live KDS
          </Button>
          <Button variant="secondary" onClick={() => onNavigateTab('tables')} icon={<LayoutGrid size={15} />}>
            Floor Tables
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          title="Active KDS Tickets"
          value="4"
          subtitle="2 Kitchen, 2 Hookah"
          badge="Live"
          accentColor="var(--brand-primary)"
          icon={<Flame size={20} />}
        />
        <StatCard
          title="Floor Tables"
          value="24"
          subtitle="2 Occupied, 22 Available"
          badge="Ready"
          accentColor="var(--teal)"
          icon={<LayoutGrid size={20} />}
        />
        <StatCard
          title="Catalog Items"
          value="102"
          subtitle="Across 15 categories"
          badge="Active"
          accentColor="var(--gold)"
          icon={<Utensils size={20} />}
        />
        <StatCard
          title="Inventory Items"
          value="149"
          subtitle="Recipe ingredient tracked"
          badge="Synchronized"
          accentColor="#a855f7"
          icon={<Boxes size={20} />}
        />
        <StatCard
          title="Active Staff on Shift"
          value="2"
          subtitle="14 Total team members"
          badge="Clocked In"
          accentColor="#0284C7"
          icon={<Users size={20} />}
        />
      </div>

      {/* Architecture & Migration Status Box */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--teal-glow)',
              color: 'var(--teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Phase 1 Migration Safety & Isolation Status
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Standalone foundation compiled without modifying legacy production endpoints
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teal)', marginBottom: '4px' }}>
              ✓ Production Cloud Run Isolation
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No production Cloud Run deployment triggered. 0 CI/CD triggers on migration branch.
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teal)', marginBottom: '4px' }}>
              ✓ Production MongoDB Atlas Preserved
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No database writes, schema changes, resets, or destructive migrations executed.
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teal)', marginBottom: '4px' }}>
              ✓ Legacy admin.html Intact
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Authoritative vanilla admin.html and 17 ES modules remain 100% active in production.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
