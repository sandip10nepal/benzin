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
  brand?: string;
  amount: number;
  unit: string;
  mode: 'g' | 'pct' | 'units';
}

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  categories: Array<{ id: string; name: string }>;
  scopedCategory?: string;
  onSaveMenuItem: (item: Partial<MenuItem>) => void;
}

const STOCK_CATALOG = [
  { id: 'inv_1', name: 'Double Apple', brand: 'Al Fakher', unit: 'g', stock: 1200 },
  { id: 'inv_2', name: 'Pan Ras', brand: 'Afzal', unit: 'g', stock: 1500 },
  { id: 'inv_3', name: 'Lady Killer', brand: 'Adalya', unit: 'g', stock: 850 },
  { id: 'inv_4', name: 'Mint Shisha', brand: 'Al Fakher', unit: 'g', stock: 950 },
  { id: 'inv_5', name: 'Love 66', brand: 'Adalya', unit: 'g', stock: 1100 },
  { id: 'inv_6', name: 'Artisan Flatbread Dough', brand: 'Bakery', unit: 'units', stock: 85 },
  { id: 'inv_7', name: 'Turkish Cezve Coffee', brand: 'Mehmet Efendi', unit: 'g', stock: 420 },
  { id: 'inv_8', name: 'Rose Syrup Base', brand: 'Cavalli Craft', unit: 'units', stock: 24 },
];

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  item,
  categories,
  scopedCategory,
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
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setPrice(String(item.price || ''));
      setEmoji(item.emoji || '👑');
      setSelectedCats(item.category ? [item.category] : []);
      setDesc(item.description || '');
      setImageUrl(item.imageUrl || '');
      setModifierGroups([
        {
          id: 'mg_1',
          name: 'Flavor Strength & Ice Level',
          required: false,
          minSelections: 0,
          maxSelections: 1,
          options: [
            { name: 'Regular Ice', priceDelta: 0 },
            { name: 'Extra Icy Chill', priceDelta: 3.0 },
          ],
        },
      ]);
      setRecipeIngredients([
        {
          inventoryItemId: 'inv_2',
          name: 'Pan Ras',
          brand: 'Afzal',
          amount: 12,
          unit: 'g',
          mode: 'g',
        },
        {
          inventoryItemId: 'inv_3',
          name: 'Lady Killer',
          brand: 'Adalya',
          amount: 8,
          unit: 'g',
          mode: 'g',
        },
      ]);
    } else {
      setName('');
      setPrice('');
      setEmoji('👑');
      setSelectedCats(scopedCategory ? [scopedCategory] : categories[0] ? [categories[0].name] : []);
      setDesc('');
      setImageUrl('');
      setModifierGroups([]);
      setRecipeIngredients([]);
    }
  }, [item, isOpen, categories, scopedCategory]);

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
        name: 'Choice Group (e.g. Wing Sauces)',
        required: false,
        minSelections: 0,
        maxSelections: 1,
        options: [
          { name: 'Option 1', priceDelta: 0 },
          { name: 'Option 2', priceDelta: 0 },
        ],
      },
    ]);
  };

  const removeModifierGroup = (idx: number) => {
    setModifierGroups((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateModifierGroupName = (idx: number, newName: string) => {
    setModifierGroups((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, name: newName } : g))
    );
  };

  const updateModifierGroupRequired = (idx: number, required: boolean) => {
    setModifierGroups((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, required } : g))
    );
  };

  const updateModifierGroupLimits = (idx: number, min: number, max: number) => {
    setModifierGroups((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, minSelections: min, maxSelections: max } : g))
    );
  };

  const addModifierOption = (groupIdx: number) => {
    setModifierGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? { ...g, options: [...g.options, { name: 'New Choice Option', priceDelta: 0 }] }
          : g
      )
    );
  };

  const updateModifierOption = (
    groupIdx: number,
    optIdx: number,
    field: 'name' | 'priceDelta',
    val: string | number
  ) => {
    setModifierGroups((prev) =>
      prev.map((g, i) => {
        if (i !== groupIdx) return g;
        const newOpts = g.options.map((opt, oI) => {
          if (oI !== optIdx) return opt;
          return { ...opt, [field]: val };
        });
        return { ...g, options: newOpts };
      })
    );
  };

  const removeModifierOption = (groupIdx: number, optIdx: number) => {
    setModifierGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx ? { ...g, options: g.options.filter((_, oI) => oI !== optIdx) } : g
      )
    );
  };

  const addBlankRecipeRow = () => {
    setRecipeIngredients((prev) => [
      ...prev,
      {
        inventoryItemId: `inv_${Date.now()}`,
        name: 'Raw Material',
        brand: 'Generic',
        amount: 10,
        unit: 'g',
        mode: 'g',
      },
    ]);
  };

  const handleSelectInventoryItem = (stockItem: typeof STOCK_CATALOG[0]) => {
    setRecipeIngredients((prev) => [
      ...prev,
      {
        inventoryItemId: stockItem.id,
        name: stockItem.name,
        brand: stockItem.brand,
        amount: stockItem.unit === 'g' ? 10 : 1,
        unit: stockItem.unit,
        mode: stockItem.unit === 'g' ? 'g' : 'units',
      },
    ]);
    setInventorySearch('');
    setShowSearchResults(false);
  };

  const removeRecipeRow = (idx: number) => {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRecipeRow = (
    idx: number,
    field: 'amount' | 'mode',
    val: number | 'g' | 'pct' | 'units'
  ) => {
    setRecipeIngredients((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    );
  };

  const filteredStock = STOCK_CATALOG.filter(
    (item) =>
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.brand.toLowerCase().includes(inventorySearch.toLowerCase())
  );

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
      recipeIngredientsCount: recipeIngredients.length,
      modifierGroupsCount: modifierGroups.length,
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
          maxWidth: '560px',
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
        <input type="hidden" id="menuEditScopedCategory" value={scopedCategory || ''} />

        {scopedCategory && (
          <div
            id="menuEditCategoryScopeNotice"
            style={{
              display: 'block',
              background: 'rgba(229,177,58,0.12)',
              border: '1px dashed var(--gold)',
              borderRadius: '8px',
              padding: '6px 12px',
              marginBottom: '12px',
              fontSize: '11px',
              color: 'var(--gold)',
              fontWeight: 700,
            }}
          >
            🏷️ Editing within category: <span id="menuEditScopedCategoryName" style={{ color: 'var(--cream)' }}>{scopedCategory}</span> (Changes here are isolated to this category)
          </div>
        )}

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
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => updateModifierGroupName(groupIdx, e.target.value)}
                      placeholder="Group Title (e.g. Sauce Selection)"
                      style={{ flex: 1, minWidth: '160px', padding: '6px 8px', fontSize: '12px', fontWeight: 700, borderRadius: '6px', background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--cream)' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--cream)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={group.required}
                          onChange={(e) => updateModifierGroupRequired(groupIdx, e.target.checked)}
                          style={{ accentColor: '#10B981' }}
                        />
                        Required
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--muted)' }}>
                        <span>Min:</span>
                        <input
                          type="number"
                          value={group.minSelections}
                          onChange={(e) => updateModifierGroupLimits(groupIdx, parseInt(e.target.value, 10) || 0, group.maxSelections)}
                          style={{ width: '40px', padding: '2px 4px', textAlign: 'center', borderRadius: '4px', background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--cream)' }}
                        />
                        <span>Max:</span>
                        <input
                          type="number"
                          value={group.maxSelections}
                          onChange={(e) => updateModifierGroupLimits(groupIdx, group.minSelections, parseInt(e.target.value, 10) || 1)}
                          style={{ width: '40px', padding: '2px 4px', textAlign: 'center', borderRadius: '4px', background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--cream)' }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeModifierGroup(groupIdx)}
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        <Trash2 style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  </div>

                  {/* Options List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {group.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'var(--card)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <input
                          type="text"
                          value={opt.name}
                          onChange={(e) => updateModifierOption(groupIdx, optIdx, 'name', e.target.value)}
                          placeholder="Option Name (e.g. Buffalo Sauce)"
                          style={{ flex: 1, padding: '4px 8px', fontSize: '11px', background: 'var(--card2)', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--cream)' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>+$</span>
                          <input
                            type="number"
                            step="0.5"
                            value={opt.priceDelta}
                            onChange={(e) => updateModifierOption(groupIdx, optIdx, 'priceDelta', parseFloat(e.target.value) || 0)}
                            style={{ width: '60px', padding: '4px', fontSize: '11px', textAlign: 'center', background: 'var(--card2)', border: '1px solid var(--line)', borderRadius: '4px', color: '#10B981', fontWeight: 700 }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => removeModifierOption(groupIdx, optIdx)}
                          style={{ padding: '2px 6px', fontSize: '10px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn"
                      onClick={() => addModifierOption(groupIdx)}
                      style={{ alignSelf: 'flex-start', padding: '4px 10px', fontSize: '11px', background: 'rgba(16,185,129,0.1)', border: '1px dashed #10B981', color: '#10B981' }}
                    >
                      <Plus style={{ width: '10px', height: '10px' }} /> Add Choice Option
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
                onFocus={() => setShowSearchResults(true)}
                onChange={(e) => {
                  setInventorySearch(e.target.value);
                  setShowSearchResults(true);
                }}
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

              {showSearchResults && inventorySearch.trim() && (
                <div
                  id="recipeInventorySearchResults"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: 'var(--card)',
                    border: '1.5px solid var(--gold)',
                    borderRadius: '10px',
                    zIndex: 10000,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.9)',
                    padding: '4px',
                  }}
                >
                  {filteredStock.length > 0 ? (
                    filteredStock.map((stock) => (
                      <div
                        key={stock.id}
                        onClick={() => handleSelectInventoryItem(stock)}
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          borderBottom: '1px solid var(--line)',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 800, color: 'var(--cream)' }}>{stock.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px' }}>[{stock.brand}]</span>
                        </div>
                        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
                          {stock.stock}{stock.unit} available
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--muted)' }}>
                      No matching raw materials found.
                    </div>
                  )}
                </div>
              )}
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
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--cream)' }}>
                      {ing.name}
                    </span>
                    {ing.brand && (
                      <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px' }}>
                        [{ing.brand}]
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={ing.mode}
                      onChange={(e) => updateRecipeRow(idx, 'mode', e.target.value as any)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: 'var(--card)',
                        border: '1px solid var(--line)',
                        borderRadius: '4px',
                        color: 'var(--cream)',
                      }}
                    >
                      <option value="g">Grams (g)</option>
                      <option value="pct">Ratio (%)</option>
                      <option value="units">Units</option>
                    </select>

                    <input
                      type="number"
                      step={ing.mode === 'pct' ? '5' : '1'}
                      value={ing.amount}
                      onChange={(e) => updateRecipeRow(idx, 'amount', parseFloat(e.target.value) || 0)}
                      style={{
                        width: '65px',
                        padding: '4px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        background: 'var(--card)',
                        border: '1px solid var(--line)',
                        color: 'var(--gold)',
                        fontWeight: 700,
                      }}
                    />

                    {/* Preview Pill */}
                    <span
                      style={{
                        fontSize: '11px',
                        background: 'rgba(229,177,58,0.15)',
                        color: 'var(--gold)',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                      }}
                    >
                      {ing.mode === 'pct' ? `${ing.amount}% ratio` : `${ing.amount}${ing.unit}`} deduction
                    </span>

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
