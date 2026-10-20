import React, { useState } from 'react';

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAddTable: (tableNumber: string, label: string, capacity: number, section: string) => void;
}

export const AddTableModal: React.FC<AddTableModalProps> = ({
  isOpen,
  onClose,
  onSubmitAddTable,
}) => {
  const [tableNumber, setTableNumber] = useState('');
  const [label, setLabel] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [section, setSection] = useState('Main Lounge');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      alert('Please enter a valid table number');
      return;
    }
    onSubmitAddTable(
      tableNumber.trim(),
      label.trim() || `Table ${tableNumber.trim()}`,
      Number(capacity) || 4,
      section
    );
    setTableNumber('');
    setLabel('');
    setCapacity(4);
    setSection('Main Lounge');
    onClose();
  };

  return (
    <div
      id="addTableModal"
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
          border: '1.5px solid var(--line)',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ color: 'var(--gold)', fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
          ➕ Add Floor Table
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              Table Number *
            </label>
            <input
              type="text"
              id="addTableNumber"
              required
              placeholder="Table number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              Table Name / Label (Optional)
            </label>
            <input
              type="text"
              id="newTableLabel"
              data-alias-id="addTableLabel"
              placeholder="Table label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              Section *
            </label>
            <select
              id="newTableSection"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <option value="Main Lounge">Main Lounge</option>
              <option value="Patio">Patio</option>
              <option value="VIP Booth">VIP Booth</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              Seating Capacity
            </label>
            <input
              type="number"
              id="newTableCapacity"
              data-alias-id="addTableCapacity"
              value={capacity}
              min={1}
              max={50}
              onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              style={{ padding: '10px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                background: 'var(--gold)',
                color: '#000',
                borderColor: 'var(--gold)',
                padding: '10px 18px',
                fontWeight: 800,
              }}
            >
              Create Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
