import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export interface SuperCategoryOption {
  id: string;
  title: string;
}

export interface MenuCatItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  superCategory?: string;
  isSuper?: boolean;
  is_super?: boolean;
  parent_id?: string | null;
}

interface MenuCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MenuCatItem[];
  superCategories: Array<SuperCategoryOption | string>;
  onSaveCategory: (cat: any) => Promise<void> | void;
  onDeleteCategory: (id: string) => Promise<void> | void;
}

export const MenuCategoryModal: React.FC<MenuCategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  superCategories,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [mode, setMode] = useState<'sub' | 'super'>('sub');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [icon, setIcon] = useState('💨');
  const firstSuperId = superCategories[0] ? (typeof superCategories[0] === 'string' ? superCategories[0] : superCategories[0].id) : 'Hookah';
  const [superCat, setSuperCat] = useState(firstSuperId);
  const [color, setColor] = useState('#FF5A1F');
  const [editId, setEditId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a category title');
      return;
    }

    const parentId = mode === 'super' ? null : superCat;

    await onSaveCategory({
      id: editId || undefined,
      title: title.trim(),
      name: title.trim(),
      subtitle: subtitle.trim(),
      description: subtitle.trim(),
      icon: icon.trim() || (mode === 'super' ? '👑' : '📋'),
      color,
      parent_id: parentId,
      isSuper: mode === 'super',
      is_super: mode === 'super',
    });

    setTitle('');
    setSubtitle('');
    setIcon('💨');
    setEditId(null);
  };

  const handleEdit = (cat: MenuCatItem) => {
    setEditId(cat.id);
    setTitle(cat.title);
    setSubtitle(cat.subtitle || '');
    setIcon(cat.icon || '💨');
    setColor(cat.color || '#FF5A1F');
    setMode(cat.isSuper ? 'super' : 'sub');
    if (cat.superCategory) setSuperCat(cat.superCategory);
  };

  const displayedList = categories.filter((c) =>
    mode === 'super' ? Boolean(c.isSuper) : !c.isSuper
  );

  return (
    <div
      id="menuCatModal"
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
          maxWidth: '560px',
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
        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 id="menuCatModalTitle" style={{ color: 'var(--gold)', fontSize: '18px', fontWeight: 800, margin: 0 }}>
            Manage Menu Categories
          </h3>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '4px 10px', fontSize: '12px' }}>
            ✕ Close
          </button>
        </div>

        {/* Mode Switcher Tabs: Sub-Categories vs Super Categories */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '18px',
            background: 'var(--card2)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '4px',
          }}
        >
          <button
            id="tabSubCatBtn"
            onClick={() => setMode('sub')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              border: 'none',
              background: mode === 'sub' ? 'var(--gold)' : 'transparent',
              color: mode === 'sub' ? '#000' : 'var(--cream)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📁 Sub-Categories
          </button>
          <button
            id="tabSuperCatBtn"
            onClick={() => setMode('super')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              border: 'none',
              background: mode === 'super' ? 'var(--gold)' : 'transparent',
              color: mode === 'super' ? '#000' : 'var(--cream)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            👑 Super Categories (Menu Sections)
          </button>
        </div>

        <input type="hidden" id="menuCatEditId" value={editId || ''} />
        <input type="hidden" id="menuCatIsSuper" value={mode === 'super' ? 'true' : 'false'} />

        {/* Form Container */}
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
            <div
              id="catFormHeaderTitle"
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--gold)',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              {editId
                ? `Edit ${mode === 'super' ? 'Super Category' : 'Sub-Category'}`
                : `Create ${mode === 'super' ? 'Super Category' : 'Sub-Category'}`}
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label
                id="catTitleLabel"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                {mode === 'super' ? 'Super Category Title *' : 'Sub-Category Title *'}
              </label>
              <input
                type="text"
                id="menuCatTitle"
                required
                placeholder={mode === 'super' ? 'e.g. Hookah Lounge' : 'e.g. Appetizers & Starters'}
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

            <div id="catSubtitleRow" style={{ marginBottom: '10px' }}>
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
                Subtitle / Tagline
              </label>
              <input
                type="text"
                id="menuCatSubtitle"
                placeholder="e.g. Small Plates to Share"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
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
                  Emoji Icon
                </label>
                <input
                  type="text"
                  id="menuCatIcon"
                  placeholder="💨"
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

              {mode === 'sub' && (
                <div id="catSuperDropdownRow">
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
                    Belongs to Super Category *
                  </label>
                  <select
                    id="menuCatType"
                    value={superCat}
                    onChange={(e) => setSuperCat(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--card)',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      color: 'var(--cream)',
                      fontSize: '14px',
                    }}
                  >
                    {superCategories.map((sc) => {
                      const scId = typeof sc === 'string' ? sc : sc.id;
                      const scTitle = typeof sc === 'string' ? sc : sc.title;
                      return (
                        <option key={scId} value={scId}>
                          {scTitle}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  id="menuCatColor"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    width: '38px',
                    height: '34px',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    background: 'none',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Accent Color</span>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontWeight: 800 }}
              >
                Save Category
              </button>
            </div>
          </div>
        </form>

        {/* Existing Categories Manager List */}
        <div>
          <div
            id="rosterTitleText"
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            {mode === 'super' ? 'Existing Super Categories' : 'Existing Sub-Categories'}
          </div>
          <div
            id="existingMenuCatList"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}
          >
            {displayedList.map((cat) => (
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
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '13px' }}>{cat.title}</div>
                    {cat.subtitle && (
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{cat.subtitle}</div>
                    )}
                  </div>
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
