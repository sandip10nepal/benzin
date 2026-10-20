import React, { useState, useEffect } from 'react';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    brand?: string;
    category: string;
    unit: string;
    stock: number;
    minAlert?: number;
  } | null;
  categories?: Array<{ id: string; name: string }>;
  onSaveEditItem: (item: {
    id: string;
    name: string;
    brand: string;
    category: string;
    unit: string;
    stock: number;
    minAlert: number;
  }) => void;
  onDeleteItem?: (id: string) => void;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  isOpen,
  onClose,
  item,
  categories = [
    { id: 'shisha', name: '💨 Shisha / Hookah' },
    { id: 'beverage', name: '🥤 Beverages & Bar' },
    { id: 'kitchen', name: '🍔 Kitchen & Food' },
    { id: 'supplies', name: '📦 General Supplies' },
  ],
  onSaveEditItem,
  onDeleteItem,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('shisha');
  const [unit, setUnit] = useState('g');
  const [stock, setStock] = useState('0');
  const [minAlert, setMinAlert] = useState('0');

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setBrand(item.brand || '');
      setCategory(item.category || 'shisha');
      setUnit(item.unit || 'g');
      setStock(String(item.stock || 0));
      setMinAlert(String(item.minAlert || 0));
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${item.name}" from inventory?`)) {
      if (onDeleteItem) onDeleteItem(item.id);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an inventory item name');
      return;
    }
    onSaveEditItem({
      id: item.id,
      name: name.trim(),
      brand: brand.trim(),
      category,
      unit: unit.trim(),
      stock: parseFloat(stock) || 0,
      minAlert: parseFloat(minAlert) || 0,
    });
    onClose();
  };

  return (
    <div
      id="editInventoryModal"
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
          ✏️ Edit Inventory Stock Item
        </h3>
        <input type="hidden" id="invEditId" value={item.id} />

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
                id="invEditName"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                id="invEditBrand"
                placeholder="Brand"
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
                id="invEditCategory"
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
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
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
                Unit *
              </label>
              <input
                type="text"
                id="invEditUnit"
                placeholder="Unit of measure"
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
              />
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
                Stock Quantity *
              </label>
              <input
                type="number"
                step="1"
                id="invEditStock"
                required
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
                id="invEditMinAlert"
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

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700 }}
            >
              Delete Item
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ fontWeight: 800 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
