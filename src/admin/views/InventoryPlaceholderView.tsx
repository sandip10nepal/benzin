import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/Button';

export const InventoryPlaceholderView: React.FC = () => {
  const sampleStock = [
    { name: 'Al Fakher Two Apples', stock: '2,400 g', unit: 'grams', alert: false },
    { name: 'Pan Ras (Supreme)', stock: '450 g', unit: 'grams', alert: true },
    { name: 'Chicken Wings Raw', stock: '18 kg', unit: 'kg', alert: false },
    { name: 'Coconut Charcoal Cubes', stock: '85 boxes', unit: 'boxes', alert: false },
    { name: 'Rooh Afza Syrup', stock: '12 bottles', unit: 'bottles', alert: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            Inventory & Ingredient Stock Tracking
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            149 Tracked inventory items across Hookah, Food, and Beverage recipes
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={15} />}>Add Stock Item</Button>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-secondary)' }}>Item Name</th>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-secondary)' }}>Current Stock</th>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sampleStock.map((s, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{s.name}</td>
                <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)' }}>{s.stock}</td>
                <td style={{ padding: '14px 18px' }}>
                  {s.alert ? (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--danger-glow)', color: 'var(--danger)' }}>
                      LOW STOCK ALERT
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--teal-glow)', color: 'var(--teal)' }}>
                      IN STOCK
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <Button variant="secondary" size="sm">+10</Button>
                    <Button variant="secondary" size="sm">+50</Button>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
