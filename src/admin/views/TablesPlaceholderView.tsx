import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/Button';

export const TablesPlaceholderView: React.FC = () => {
  const sampleTables = [
    { number: '1', label: 'Table 1', seats: 4, status: 'occupied', server: 'Suwasna' },
    { number: '2', label: 'Table 2', seats: 4, status: 'available', server: 'Unassigned' },
    { number: '3', label: 'Table 3', seats: 6, status: 'available', server: 'Unassigned' },
    { number: 'P1', label: 'Patio P1', seats: 4, status: 'available', server: 'Unassigned' },
    { number: 'P2', label: 'Patio P2', seats: 4, status: 'available', server: 'Unassigned' },
    { number: 'P3', label: 'Patio P3', seats: 4, status: 'occupied', server: 'Pasang' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            Floor Tables & Seating Layout
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            24 Total tables (Indoor Lounge + Patio Terrace)
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={15} />}>
          Add Table
        </Button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {sampleTables.map((t) => {
          const isOccupied = t.status === 'occupied';
          return (
            <div
              key={t.number}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: `1px solid ${isOccupied ? 'rgba(0, 102, 255, 0.4)' : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)' }}>
                  {t.label}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: isOccupied ? 'var(--brand-primary)22' : 'var(--teal-glow)',
                    color: isOccupied ? 'var(--brand-primary)' : 'var(--teal)',
                    textTransform: 'uppercase',
                  }}
                >
                  {t.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Seats: {t.seats} &bull; Server: {t.server}
              </div>
              <Button variant="secondary" size="sm" style={{ marginTop: '4px' }}>
                Manage Table
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
