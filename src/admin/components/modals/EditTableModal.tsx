import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface EditTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: {
    id: string;
    tableNumber: string | number;
    label: string;
    capacity: number;
    section?: string;
  } | null;
  onSubmitEditTable: (tableId: string, tableNumber: string, label: string, capacity: number, section: string) => void;
  onDeleteTable: (tableId: string) => void;
}

export const EditTableModal: React.FC<EditTableModalProps> = ({
  isOpen,
  onClose,
  table,
  onSubmitEditTable,
  onDeleteTable,
}) => {
  const [tableNumber, setTableNumber] = useState('');
  const [label, setLabel] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [section, setSection] = useState('Main Lounge');

  useEffect(() => {
    if (table) {
      setTableNumber(String(table.tableNumber || ''));
      setLabel(table.label || '');
      setCapacity(table.capacity || 4);
      setSection(table.section || 'Main Lounge');
    }
  }, [table]);

  if (!isOpen || !table) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      alert('Please enter a valid table number');
      return;
    }
    onSubmitEditTable(
      table.id,
      tableNumber.trim(),
      label.trim() || `Table ${tableNumber.trim()}`,
      Number(capacity) || 4,
      section
    );
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to permanently delete "${table.label}"?`)) {
      onDeleteTable(table.id);
      onClose();
    }
  };

  return (
    <div
      id="editTableModal"
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
        <h3 style={{ color: 'var(--gold)', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
          ✏️ Edit Floor Table
        </h3>
        <div id="editTableModalSub" style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
          Modify table label, number, capacity, or remove table.
        </div>
        <input type="hidden" id="editTableId" value={table.id} />

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
              id="editTableNumber"
              required
              placeholder="e.g. 15, P1, P2"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
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
              Table Name / Label
            </label>
            <input
              type="text"
              id="editTableLabel"
              placeholder="e.g. Table 15, P1, Patio 2"
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
              id="editTableSection"
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
              id="editTableCapacity"
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

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              style={{
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Trash2 style={{ width: '14px', height: '14px' }} />
              <span>Delete Table</span>
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
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
                style={{ background: '#0066FF', padding: '10px 18px', fontWeight: 800 }}
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
