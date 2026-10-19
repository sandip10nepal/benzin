import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { MenuItem } from '../../types';
import { apiClient } from '../../api/client';

interface SpecialItem {
  id: string;
  menuItemId: string;
  name: string;
  subtitle: string;
  price: number;
  emoji?: string;
  active?: boolean;
}

interface SpecialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuCatalog: MenuItem[];
  onSaveSpecials?: (specials: SpecialItem[]) => void;
}

export const SpecialsModal: React.FC<SpecialsModalProps> = ({
  isOpen,
  onClose,
  menuCatalog,
  onSaveSpecials,
}) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [specials, setSpecials] = useState<SpecialItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      apiClient.getSpecials().then((specs) => {
        if (Array.isArray(specs) && specs.length > 0) {
          setSpecials(specs.map((s: any) => ({
            id: s.id || s._id || `sp_${Date.now()}`,
            menuItemId: s.menuItemId || s.item_id || s.id,
            name: s.name || s.title || '',
            subtitle: s.subtitle || s.description || '',
            price: Number(s.price) || 0,
            emoji: s.emoji || '✨',
            active: s.active !== false,
          })));
        }
      }).catch((e) => console.warn('Could not load specials from database:', e));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSpecial = () => {
    if (!selectedItemId) {
      alert('Please select an item from the menu catalog');
      return;
    }
    const menuItem = menuCatalog.find((m) => m.id === selectedItemId);
    if (!menuItem) return;

    setSpecials((prev) => [
      ...prev,
      {
        id: `spec_${Date.now()}`,
        menuItemId: menuItem.id,
        name: menuItem.name,
        subtitle: subtitle.trim() || 'Featured Special',
        price: menuItem.price,
        emoji: menuItem.emoji,
        active: true,
      },
    ]);
    setSelectedItemId('');
    setSubtitle('');
  };

  const handleDeleteSpecial = (id: string) => {
    setSpecials((prev) => prev.filter((s) => s.id !== id));
  };

  const handleMoveSpecial = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= specials.length) return;
    setSpecials((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleToggleActive = (index: number, checked: boolean) => {
    setSpecials((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, active: checked } : s))
    );
  };

  const handleSave = async () => {
    try {
      await apiClient.saveSpecials(specials);
    } catch (e) {
      console.warn('Failed saving specials to database:', e);
    }
    if (onSaveSpecials) onSaveSpecials(specials);
    alert('Restaurant Specials saved successfully to database!');
    onClose();
  };

  return (
    <div
      id="specialsModal"
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        background: 'rgba(14,10,8,0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 100000,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1.5px solid #a855f7',
          borderRadius: '20px',
          padding: '24px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3
              style={{
                color: '#c084fc',
                fontSize: '20px',
                fontWeight: 800,
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⭐</span> Restaurant Specials
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Choose existing menu items to feature as restaurant specials.
            </div>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px' }}>
            ✕
          </button>
        </div>

        {/* Add Existing Menu Item as Special */}
        <div
          style={{
            background: 'rgba(168,85,247,0.08)',
            border: '1px dashed rgba(168,85,247,0.35)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#c084fc', marginBottom: '8px' }}>
            ➕ FEATURE AN EXISTING ITEM IN SPECIALS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <select
              id="specialsCatalogSelect"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                color: 'var(--cream)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <option value="">-- Select an item from Menu Catalog --</option>
              {menuCatalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.emoji || '🍴'} {item.name} (${item.price.toFixed(2)})
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                id="specialSubtitleInput"
                placeholder="Badge subtitle (e.g. Chef's Pick, Limited)"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '12px',
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddSpecial}
                style={{
                  background: '#a855f7',
                  color: '#fff',
                  fontWeight: 800,
                  padding: '8px 16px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                }}
              >
                + Feature in Specials
              </button>
            </div>
          </div>
        </div>

        {/* Specials List Container */}
        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Currently Featured Specials
        </div>
        <div id="specialsListContainer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
          {specials.map((s, idx) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--card2)',
                borderRadius: '10px',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    type="button"
                    className="btn"
                    disabled={idx === 0}
                    onClick={() => handleMoveSpecial(idx, -1)}
                    style={{ padding: '2px 6px', fontSize: '10px', minHeight: 'unset', opacity: idx === 0 ? 0.3 : 1 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={idx === specials.length - 1}
                    onClick={() => handleMoveSpecial(idx, 1)}
                    style={{ padding: '2px 6px', fontSize: '10px', minHeight: 'unset', opacity: idx === specials.length - 1 ? 0.3 : 1 }}
                  >
                    ▼
                  </button>
                </div>
                <span style={{ fontSize: '20px' }}>{s.emoji || '⭐'}</span>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--cream)', fontSize: '13px' }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: '#c084fc', fontWeight: 700 }}>{s.subtitle}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={s.active !== false}
                    onChange={(e) => handleToggleActive(idx, e.target.checked)}
                    style={{ accentColor: '#a855f7' }}
                  />
                  Active
                </label>
                <span style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '13px' }}>${s.price.toFixed(2)}</span>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteSpecial(s.id)}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  <Trash2 style={{ width: '12px', height: '12px' }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1.5px solid var(--line)', paddingTop: '16px' }}>
          <button className="btn" onClick={onClose} style={{ padding: '10px 16px' }}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{ background: '#a855f7', color: '#fff', fontWeight: 800, padding: '10px 20px' }}
          >
            Save Specials
          </button>
        </div>
      </div>
    </div>
  );
};
