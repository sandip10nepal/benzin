import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { MenuItem } from '../../types';

interface ModifierOption {
  name: string;
  priceDelta: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
}

interface RecipeIngredient {
  inventoryItemId: string;
  name: string;
  amount: number;
  unit: string;
}

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  categories: Array<{ id: string; name: string }>;
  onSaveMenuItem: (item: Partial<MenuItem>) => void;
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  item,
  categories,
  onSaveMenuItem,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [emoji, setEmoji] = useState('👑');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setPrice(String(item.price || ''));
      setEmoji(item.emoji || '👑');
      setSelectedCats(item.category ? [item.category] : []);
      setDesc(item.description || '');
      setImageUrl(item.imageUrl || '');
      setModifierGroups([]);
      setRecipeIngredients([]);
    } else {
      setName('');
      setPrice('');
      setEmoji('👑');
      setSelectedCats(categories[0] ? [categories[0].name] : []);
      setDesc('');
      setImageUrl('');
      setModifierGroups([]);
      setRecipeIngredients([]);
    }
  }, [item, isOpen, categories]);

  if (!isOpen) return null;

  const toggleCategory = (catName: string) => {
    setSelectedCats((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  const addModifierGroup = () => {
    setModifierGroups((prev) => [
      ...prev,
      {
        id: `mod_${Date.now()}`,
        name: 'Choice Option',
        required: false,
        minSelections: 0,
        maxSelections: 1,
        options: [{ name: 'Option 1', priceDelta: 0 }],
      },
    ]);
  };

  const removeModifierGroup = (idx: number) => {
    setModifierGroups((prev) => prev.filter((_, i) => i !== idx));
  };

  const addModifierOption = (groupIdx: number) => {
    setModifierGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? { ...g, options: [...g.options, { name: 'New Choice', priceDelta: 0 }] }
          : g
      )
    );
  };

  const addBlankRecipeRow = () => {
    setRecipeIngredients((prev) => [
      ...prev,
      {
        inventoryItemId: `inv_${Date.now()}`,
        name: 'Ingredient',
        amount: 20,
        unit: 'g',
      },
    ]);
  };

  const removeRecipeRow = (idx: number) => {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a menu item name');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      alert('Please enter a valid price');
      return;
    }

    onSaveMenuItem({
      id: item?.id,
      name: name.trim(),
      price: numPrice,
      emoji: emoji.trim() || '👑',
      category: selectedCats[0] || 'Hookah',
      description: desc.trim(),
      imageUrl: imageUrl.trim(),
    });
    onClose();
  };

  return (
    <div
      id="menuItemModal"
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
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--card)',
          border: '1.5px solid var(--gold)',
          borderRadius: '20px',
          padding: '24px',
          textAlign: 'left',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
        }}
      >
        <h3 id="menuModalTitle" style={{ color: 'var(--gold)', fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
          {item ? 'Edit Menu Item' : 'Add Menu Item'}
        </h3>
        <input type="hidden" id="menuEditId" value={item?.id || ''} />
        <input type="hidden" id="menuEditScopedCategory" value="" />

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
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
              Item Name *
            </label>
            <input
              type="text"
              id="menuItemName"
              required
              placeholder="e.g. Anarkali House Blend"
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
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                id="menuItemPrice"
                required
                placeholder="36.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
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
                Emoji / Icon
              </label>
              <input
                type="text"
                id="menuItemEmoji"
                placeholder="👑"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '14px',
                  textAlign: 'center',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                }}
              >
                Categories / Sub-Categories *
              </label>
              <span id="selectedCategoriesCount" style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 800 }}>
                {selectedCats.length} Selected
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>
              Tap any category to toggle. An item can belong to multiple categories simultaneously.
            </div>
            <div
              id="menuItemCategoriesGrid"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '10px',
                background: 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '10px',
              }}
            >
              {categories.map((cat) => {
                const isSelected = selectedCats.includes(cat.name);
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => toggleCategory(cat.name)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid var(--gold)' : '1px solid var(--line)',
                      background: isSelected ? 'rgba(229,177,58,0.18)' : 'var(--card)',
                      color: isSelected ? 'var(--gold)' : 'var(--cream)',
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
            <input type="hidden" id="menuItemCategory" value={selectedCats.join(',')} />
          </div>

          {/* Description Field */}
          <div style={{ marginBottom: '12px' }}>
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
              Item Description
            </label>
            <textarea
              id="menuItemDesc"
              rows={2}
              placeholder="e.g. Signature blend of Pan Ras, Lady Killer & Bagdadi with iced base..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                color: 'var(--cream)',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Image URL Field */}
          <div style={{ marginBottom: '16px' }}>
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
              Item Image URL
            </label>
            <input
              type="text"
              id="menuItemImageUrl"
              placeholder="e.g. https://... or /images/menu/anarkali.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
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

          {/* Choice Options & Modifiers Section */}
          <div
            style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1.5px dashed #10B981',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>
                  Choice Options &amp; Modifiers (e.g. Wing Sauces, Flavors)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  Prompts customer with choice popup when selecting this item.
                </div>
              </div>
              <button
                type="button"
                className="btn"
                onClick={addModifierGroup}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background: 'rgba(16,185,129,0.15)',
                  border: '1.5px solid #10B981',
                  color: '#10B981',
                  borderRadius: '8px',
                }}
              >
                + Add Choice Group
              </button>
            </div>

            <div id="modifierGroupsContainer" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {modifierGroups.map((group, groupIdx) => (
                <div
                  key={group.id}
                  style={{
                    background: 'var(--card2)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModifierGroups((prev) =>
                          prev.map((g, i) => (i === groupIdx ? { ...g, name: val } : g))
                        );
                      }}
                      style={{ padding: '6px', fontSize: '12px', fontWeight: 700, borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeModifierGroup(groupIdx)}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      <Trash2 style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {group.options.map((opt, optIdx) => (
                      <span
                        key={optIdx}
                        style={{
                          background: 'var(--card)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          border: '1px solid var(--line)',
                        }}
                      >
                        {opt.name}
                      </span>
                    ))}
                    <button
                      type="button"
                      className="btn"
                      onClick={() => addModifierOption(groupIdx)}
                      style={{ padding: '2px 8px', fontSize: '10px' }}
                    >
                      <Plus style={{ width: '10px', height: '10px' }} /> Option
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Item Recipe Inventory Deduction Section */}
          <div
            id="recipeIngredientsContainer"
            style={{
              background: 'rgba(229,177,58,0.06)',
              border: '1px dashed var(--gold)',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase' }}>
                📦 Multi-Item Recipe (Auto Inventory Deduction)
              </div>
              <button
                type="button"
                className="btn"
                onClick={addBlankRecipeRow}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background: 'rgba(229,177,58,0.15)',
                  borderColor: 'var(--gold)',
                  color: 'var(--gold)',
                }}
              >
                + Add Blank Row
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 10px 0' }}>
              Combine multiple raw stock materials to make a single menu item (e.g. House Mixes or Cocktail Recipes).
            </p>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type="text"
                id="recipeInventorySearchInput"
                placeholder="🔍 Search inventory item by name or brand (e.g. Al Fakher, Pan Ras)..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--card2)',
                  border: '1.5px solid var(--gold)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div id="recipeRowsContainer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recipeIngredients.map((ing, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--card2)',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)' }}>{ing.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      value={ing.amount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setRecipeIngredients((prev) =>
                          prev.map((itemRow, i) => (i === idx ? { ...itemRow, amount: val } : itemRow))
                        );
                      }}
                      style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{ing.unit}</span>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeRecipeRow(idx)}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      <Trash2 style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>
              Save Menu Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
