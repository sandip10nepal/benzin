import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/Button';

export const MenuPlaceholderView: React.FC = () => {
  const sampleItems = [
    { name: 'Anarkali House Mix', price: '$65.00', category: 'Hookah Shisha', emoji: '💨' },
    { name: 'Double Apple Hookah', price: '$40.00', category: 'Hookah Shisha', emoji: '🍏' },
    { name: 'Crispy Wings (10pcs)', price: '$16.00', category: 'Appetizers', emoji: '🍗' },
    { name: 'Vegetable Samosas', price: '$10.00', category: 'Appetizers', emoji: '🥟' },
    { name: 'Mango Lassi', price: '$7.00', category: 'Beverages', emoji: '🥭' },
    { name: 'Turkish Coffee', price: '$6.00', category: 'Beverages', emoji: '☕' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            Menu Catalog & Categories
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Supercategories: Food & Dining, Beverages, Hookah & Shisha
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm">Add Category</Button>
          <Button variant="primary" size="sm" icon={<Plus size={15} />}>Add Item</Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {sampleItems.map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{item.emoji}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.category}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                {item.price}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <Button variant="secondary" size="sm" style={{ flex: 1 }}>Edit</Button>
              <Button variant="ghost" size="sm">Active</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
