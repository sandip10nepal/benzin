import React, { useState } from 'react';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNewItem: (item: {
    name: string;
    brand: string;
    category: string;
    unit: string;
    stock: number;
    minAlert: number;
  }) => void;
}

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  onSaveNewItem,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('shisha');
  const [unit, setUnit] = useState('g');
  const [stock, setStock] = useState('1000');
  const [minAlert, setMinAlert] = useState('200');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an inventory item name');
      return;
    }
    onSaveNewItem({
      name: name.trim(),
      brand: brand.trim(),
      category,
      unit,
      stock: parseFloat(stock) || 0,
      minAlert: parseFloat(minAlert) || 0,
    });
    setName('');
    setBrand('');
    setStock('1000');
    setMinAlert('200');
    onClose();
  };

  return (
    <div
      id="addInventoryModal"
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
          width: '100%',
          maxWidth: '440px',
          background: 'var(--card)',
          border: '1.5px solid var(--gold)',
          borderRadius: '20px',
          padding: '24px',
          textAlign: 'left',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
        }}
      >
        <h3 style={{ color: 'var(--gold)', fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
          Add New Inventory Stock Item
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Ingredient / Item Name *
              </label>
              <input
                type="text"
                id="invNewName"
                required
                placeholder="e.g. Pan Ras or Love 66"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Brand
              </label>
              <input
                type="text"
                id="invNewBrand"
                placeholder="e.g. Al Fakher, Adalya, Afzal, Starbuzz"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--card2)',
                  border: '1px solid var(--gold)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Category *
              </label>
              <select
                id="invNewCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '13px',
                }}
              >
                <option value="shisha">💨 Shisha / Hookah</option>
                <option value="beverage">🥤 Beverages &amp; Bar</option>
                <option value="kitchen">🍔 Kitchen &amp; Food</option>
                <option value="supplies">📦 General Supplies</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Measurement Unit *
              </label>
              <select
                id="invNewUnit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '13px',
                }}
              >
                <option value="g">Grams (g)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="pcs">Pieces / Cans (pcs)</option>
                <option value="lbs">Pounds (lbs)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Initial Stock Quantity *
              </label>
              <input
                type="number"
                step="1"
                id="invNewStock"
                required
                placeholder="1000"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Min Alert Threshold
              </label>
              <input
                type="number"
                step="1"
                id="invNewMinAlert"
                placeholder="200"
                value={minAlert}
                onChange={(e) => setMinAlert(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontWeight: 800 }}
            >
              Save Inventory Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
