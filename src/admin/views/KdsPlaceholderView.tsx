import React from 'react';
import { Button } from '../components/common/Button';

export const KdsPlaceholderView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            Live Tickets (Kitchen & Hookah Display)
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Real-time SSE order pipeline & department fulfillment station
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm">Active (4)</Button>
          <Button variant="ghost" size="sm">Completed</Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Sample Ticket 1 */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--brand-primary)' }}>Table 1</span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--teal-glow)', color: 'var(--teal)' }}>
              Preparing
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
            1x Anarkali House Mix (Daku $65)
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Base: Rooh Afza &bull; Modifiers: Ice Base, Ice Hose
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button variant="primary" size="sm" style={{ flex: 1 }}>Mark Ready</Button>
            <Button variant="secondary" size="sm">Cash</Button>
          </div>
        </div>

        {/* Sample Ticket 2 */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--gold)' }}>Table P3 (Patio)</span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--danger-glow)', color: 'var(--danger)' }}>
              Pending
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
            2x Crispy Chicken Tenders w/ Fries
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Sauces: Mango Habanero, Garlic Parm
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button variant="primary" size="sm" style={{ flex: 1 }}>Start Prep</Button>
            <Button variant="secondary" size="sm">Print</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
