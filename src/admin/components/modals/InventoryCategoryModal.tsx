import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface InvCategory {
  id: string;
  title: string;
  icon: string;
}

interface InventoryCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: InvCategory[];
  onSaveCategory: (cat: { id?: string; title: string; icon: string }) => void;
  onDeleteCategory: (id: string) => void;
}

export const InventoryCategoryModal: React.FC<InventoryCategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📦');
  const [editId, setEditId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a category title');
      return;
    }
    onSaveCategory({
      id: editId || undefined,
      title: title.trim(),
      icon: icon.trim() || '📦',
    });
    setTitle('');
    setIcon('📦');
    setEditId(null);
  };

  const handleEdit = (cat: InvCategory) => {
    setEditId(cat.id);
    setTitle(cat.title);
    setIcon(cat.icon);
  };

  return (
    <div
      id="invCatModal"
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
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--card)',
          border: '1.5px solid var(--gold)',
          borderRadius: '24px',
          padding: '28px',
          textAlign: 'left',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 id="invCatModalTitle" style={{ color: 'var(--gold)', fontSize: '18px', fontWeight: 800 }}>
            Manage Inventory Categories
          </h3>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '4px 10px', fontSize: '12px' }}>
            ✕ Close
          </button>
        </div>

        <input type="hidden" id="invCatEditId" value={editId || ''} />

        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: 'var(--card2)',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '10px' }}>
              {editId ? 'Edit Inventory Category' : 'Create Inventory Category'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  id="invCatTitle"
                  required
                  placeholder="e.g. Shisha Flavors"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--cream)',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Emoji
                </label>
                <input
                  type="text"
                  id="invCatIcon"
                  placeholder="📦"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--cream)',
                    fontSize: '16px',
                    textAlign: 'center',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontWeight: 800 }}
            >
              {editId ? 'Update Inventory Category' : 'Save Inventory Category'}
            </button>
          </div>
        </form>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Existing Inventory Categories
          </div>
          <div
            id="existingInvCatList"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}
          >
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--card2)',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                  <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '13px' }}>{cat.title}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn"
                    onClick={() => handleEdit(cat)}
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      if (confirm(`Delete category "${cat.title}"?`)) onDeleteCategory(cat.id);
                    }}
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                  >
                    <Trash2 style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
