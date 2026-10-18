import React from 'react';
import { DollarSign, CreditCard, Wallet } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';

export const SalesPlaceholderView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
          Financial Sales & Analytics
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Gross Revenue &bull; Payment Settlement &bull; Tips & Taxes
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          title="Today's Gross Sales"
          value="$2,840.50"
          subtitle="42 Completed orders"
          accentColor="var(--teal)"
          icon={<DollarSign size={20} />}
        />
        <StatCard
          title="Digital Card Payments"
          value="$2,120.00"
          subtitle="Square Terminal"
          accentColor="var(--brand-primary)"
          icon={<CreditCard size={20} />}
        />
        <StatCard
          title="Cash Drawer Collected"
          value="$720.50"
          subtitle="Physical cash drawer"
          accentColor="var(--gold)"
          icon={<Wallet size={20} />}
        />
      </div>
    </div>
  );
};
