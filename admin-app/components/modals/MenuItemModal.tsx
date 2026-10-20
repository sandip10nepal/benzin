import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Link as LinkIcon, Image as ImageIcon, X, RefreshCw, FolderOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { MenuItem } from '../../types';
import { apiClient } from '../../api/client';

export interface SubCategoryWithParent {
  id: string;
  name: string;
  title?: string;
  icon?: string;
  parent_id?: string | null;
  parentTitle?: string;
}

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

interface LiveStockItem {
  id: string;
  name: string;
  brand: string;
  unit: string;
  stock: number;
}

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  categories: SubCategoryWithParent[];
  scopedCategory?: string;
  onSaveMenuItem: (item: any) => Promise<void> | void;
}

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
  const [imageTab, setImageTab] = useState<'upload' | 'url' | 'library'>('upload');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [liveInventory, setLiveInventory] = useState<LiveStockItem[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);
      setImageUploadError(null);
      const res = await apiClient.uploadMediaFile(file, 'menu');
      if (res.success && res.url) {
        setImageUrl(res.url);
      } else {
        setImageUploadError(res.error || 'Failed to upload image.');
      }
    } catch (err: any) {
      setImageUploadError(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const loadMediaLibrary = async () => {
    try {
      setIsLoadingMedia(true);
      const res = await apiClient.listRestaurantMedia('menu', 30);
      if (res.success && Array.isArray(res.media)) {
        setMediaLibrary(res.media);
      }
    } catch (err) {
      console.warn('Failed to load media library:', err);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  // Fetch real inventory raw materials from MongoDB on modal open
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const fetchStock = async () => {
      try {
        const invData = await apiClient.getInventory();
        if (mounted && invData && invData.inventory) {
          const list: LiveStockItem[] = Object.values(invData.inventory).map((inv: any) => ({
            id: inv.id || inv._id || inv.name,
            name: inv.name || 'Raw Material',
            brand: inv.brand || '',
            unit: inv.unit || 'g',
            stock: Number(inv.stock) || 0,
          }));
          setLiveInventory(list);
        }
      } catch (err) {
        console.warn('Failed to load live inventory for recipe ingredients:', err);
      }
    };

    fetchStock();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Initialize form state when item or scoped category changes
  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setPrice(item.price !== undefined ? String(item.price) : '');
      setEmoji(item.emoji || '👑');

      // Resolve category selection IDs
      const rawCats = (Array.isArray(item.category_ids) && item.category_ids.length > 0)
        ? item.category_ids
        : (item.category ? [item.category] : []);
      setSelectedCats(rawCats);

      setDesc(item.description || (item as any).desc || '');
      setImageUrl(item.imageUrl || (item as any).image_url || '');

      // Load actual modifiers if present on the item
      const itemMods = Array.isArray(item.modifier_groups)
        ? item.modifier_groups
        : (Array.isArray(item.modifierGroups) ? item.modifierGroups : []);
      setModifierGroups(
        itemMods.map((mg: any, idx: number) => ({
          id: mg.id || `mg_${idx}`,
          name: mg.name || mg.title || 'Choice Group',
          required: Boolean(mg.required),
          minSelections: mg.minSelections ?? mg.min_selections ?? 0,
          maxSelections: mg.maxSelections ?? mg.max_selections ?? 1,
          options: (mg.options || []).map((opt: any) => ({
            name: opt.name || opt.label || 'Option',
            priceDelta: Number(opt.priceDelta || opt.price_delta || opt.price || 0),
          })),
        }))
      );

      // Load actual recipe ingredients if present on the item
      const itemRecipe = Array.isArray(item.recipe) ? item.recipe : [];
      setRecipeIngredients(
        itemRecipe.map((ing: any) => ({
          inventoryItemId: ing.ingredient_id || ing.ingredientId || '',
          name: ing.name || 'Raw Material',
          brand: ing.brand || '',
          amount: Number(ing.amount ?? ing.quantity ?? 10),
          unit: ing.unit || 'g',
          mode: (ing.percentage !== undefined && ing.percentage > 0 ? 'pct' : (ing.unit === 'g' ? 'g' : 'units')) as any,
        }))
      );
    } else {
      // Adding new menu item
      setName('');
      setPrice('');
      setEmoji('👑');

      // Default category from scopedCategory or first available subcategory
      let defaultSelected: string[] = [];
      if (scopedCategory && scopedCategory !== 'all') {
        const matched = categories.find(
          (c) =>
            c.id.toLowerCase() === scopedCategory.toLowerCase() ||
            c.name.toLowerCase() === scopedCategory.toLowerCase()
        );
        defaultSelected = matched ? [matched.id] : [scopedCategory];
      } else if (categories.length > 0) {
        defaultSelected = [categories[0].id];
      }
      setSelectedCats(defaultSelected);

      setDesc('');
      setImageUrl('');
      setModifierGroups([]);
      setRecipeIngredients([]);
    }
  }, [item, isOpen, categories, scopedCategory]);

  if (!isOpen) return null;

  // Toggle category pill
  const toggleCategory = (catIdOrName: string) => {
    setSelectedCats((prev) => {
      // Match either by ID or Name
      const exists = prev.some((c) => c.toLowerCase() === catIdOrName.toLowerCase());
      if (exists) {
        return prev.filter((c) => c.toLowerCase() !== catIdOrName.toLowerCase());
      } else {
        return [...prev, catIdOrName];
      }
    });
  };

  const isCategorySelected = (cat: SubCategoryWithParent) => {
    return selectedCats.some(
      (c) =>
        c.toLowerCase() === cat.id.toLowerCase() ||
        c.toLowerCase() === cat.name.toLowerCase() ||
        (cat.title && c.toLowerCase() === cat.title.toLowerCase())
    );
  };

  // Modifier Groups Management
  const addModifierGroup = () => {
    setModifierGroups((prev) => [
      ...prev,
      {
        id: `mod_${Date.now()}`,
        name: 'Choice Group',
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

  // Recipe Ingredients Management (Auto Inventory Deduction)
  const addBlankRecipeRow = () => {
    setRecipeIngredients((prev) => [
      ...prev,
      {
        inventoryItemId: '',
        name: 'Select Stock Material',
        brand: '',
        amount: 10,
        unit: 'g',
        mode: 'g',
      },
    ]);
  };

  const handleSelectInventoryItem = (stockItem: LiveStockItem) => {
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

  const filteredStock = liveInventory.filter(
    (item) =>
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.brand.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (selectedCats.length === 0) {
      alert('Please select at least one category for this menu item');
      return;
    }

    try {
      setIsSaving(true);
      const primaryCategory = selectedCats[0];
      const payload = {
        id: item?.id,
        _id: item?.id,
        name: name.trim(),
        price: numPrice,
        emoji: emoji.trim() || '👑',
        category: primaryCategory,
        category_id: primaryCategory,
        category_ids: selectedCats,
        categoryIds: selectedCats,
        description: desc.trim(),
        desc: desc.trim(),
        imageUrl: imageUrl.trim(),
        image_url: imageUrl.trim(),
        modifier_groups: modifierGroups,
        modifierGroups: modifierGroups,
        recipe: recipeIngredients.map((ing) => ({
          ingredient_id: ing.inventoryItemId,
          ingredientId: ing.inventoryItemId,
          name: ing.name,
          brand: ing.brand,
          amount: ing.amount,
          quantity: ing.amount,
          unit: ing.unit,
          mode: ing.mode,
          percentage: ing.mode === 'pct' ? ing.amount : undefined,
        })),
        ingredient_id: recipeIngredients.length > 0 ? recipeIngredients[0].inventoryItemId : undefined,
        ingredient_amount: recipeIngredients.length > 0 ? recipeIngredients[0].amount : undefined,
      };

      await onSaveMenuItem(payload);
    } catch (err: any) {
      alert('Failed to save menu item: ' + err.message);
    } finally {
      setIsSaving(false);
    }
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
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--card)',
          border: '1.5px solid var(--gold)',
          borderRadius: '20px',
          padding: '28px',
          textAlign: 'left',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 id="menuModalTitle" style={{ color: 'var(--gold)', fontSize: '20px', fontWeight: 800, margin: 0 }}>
            {item ? 'Edit Menu Item' : 'Add Menu Item'}
          </h3>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={isSaving}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            ✕ Close
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Item Name */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                marginBottom: '6px',
                letterSpacing: '0.5px',
              }}
            >
              ITEM NAME *
            </label>
            <input
              type="text"
              id="menuItemName"
              required
              placeholder="Item name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '11px 14px',
                background: 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                color: 'var(--cream)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            />
          </div>

          {/* Price and Emoji */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                  letterSpacing: '0.5px',
                }}
              >
                PRICE ($) *
              </label>
              <input
                type="number"
                step="0.01"
                id="menuItemPrice"
                required
                placeholder="12"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                  letterSpacing: '0.5px',
                }}
              >
                EMOJI / ICON
              </label>
              <input
                type="text"
                id="menuItemEmoji"
                placeholder="👑"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '15px',
                  textAlign: 'center',
                }}
              />
            </div>
          </div>

          {/* Categories / Sub-Categories Multi-Select (Matches User Screenshot) */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                CATEGORIES / SUB-CATEGORIES *
              </label>
              <span
                id="selectedCategoriesCount"
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: selectedCats.length > 0 ? '#10B981' : 'var(--danger)',
                }}
              >
                {selectedCats.length} Selected
              </span>
            </div>
            <div
              id="menuItemCategoriesGrid"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                maxHeight: '190px',
                overflowY: 'auto',
                padding: '12px',
                background: 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
              }}
            >
              {categories.length > 0 ? (
                categories.map((cat) => {
                  const isSelected = isCategorySelected(cat);
                  const parentLabel = cat.parentTitle ? cat.parentTitle.toUpperCase() : '';

                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: isSelected ? '1.5px solid #10B981' : '1px solid var(--line)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'var(--card)',
                        color: isSelected ? '#10B981' : 'var(--cream)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 900,
                          width: '12px',
                          textAlign: 'center',
                          color: isSelected ? '#10B981' : 'var(--muted)',
                        }}
                      >
                        {isSelected ? '✓' : '+'}
                      </span>
                      <span>
                        {cat.icon || '📋'} {cat.title || cat.name}
                      </span>
                      {parentLabel && (
                        <span
                          style={{
                            fontSize: '9px',
                            opacity: 0.65,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginLeft: '2px',
                          }}
                        >
                          ({parentLabel})
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '8px' }}>
                  No categories configured in MongoDB.
                </div>
              )}
            </div>
          </div>

          {/* Item Description */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                marginBottom: '6px',
                letterSpacing: '0.5px',
              }}
            >
              ITEM DESCRIPTION
            </label>
            <textarea
              id="menuItemDesc"
              rows={2}
              placeholder="Item description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                color: 'var(--cream)',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Item Photo & Media Management */}
          <div style={{ marginBottom: '22px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                marginBottom: '8px',
                letterSpacing: '0.5px',
              }}
            >
              ITEM PHOTO / MEDIA
            </label>

            {/* Current Image Display & Controls */}
            {imageUrl ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 14px',
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    background: '#0C0806',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.1)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={name || 'Menu preview'}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle style={{ width: '14px', height: '14px', color: '#10B981' }} />
                    Photo Attached
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--muted)',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={imageUrl}
                  >
                    {imageUrl}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <X style={{ width: '12px', height: '12px' }} />
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageTab('upload');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--gold)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <RefreshCw style={{ width: '11px', height: '11px' }} />
                      Replace
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Sub-tabs: Upload File | External URL | Media Library */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: imageTab === 'upload' ? '1px solid var(--gold)' : '1px solid var(--line)',
                  background: imageTab === 'upload' ? 'rgba(229,177,58,0.12)' : 'var(--card2)',
                  color: imageTab === 'upload' ? 'var(--gold)' : 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <Upload style={{ width: '12px', height: '12px' }} />
                Upload Photo
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: imageTab === 'url' ? '1px solid var(--gold)' : '1px solid var(--line)',
                  background: imageTab === 'url' ? 'rgba(229,177,58,0.12)' : 'var(--card2)',
                  color: imageTab === 'url' ? 'var(--gold)' : 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <LinkIcon style={{ width: '12px', height: '12px' }} />
                External URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageTab('library');
                  loadMediaLibrary();
                }}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: imageTab === 'library' ? '1px solid var(--gold)' : '1px solid var(--line)',
                  background: imageTab === 'library' ? 'rgba(229,177,58,0.12)' : 'var(--card2)',
                  color: imageTab === 'library' ? 'var(--gold)' : 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <FolderOpen style={{ width: '12px', height: '12px' }} />
                Media Library
              </button>
            </div>

            {imageUploadError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#EF4444',
                  fontSize: '12px',
                  marginBottom: '10px',
                }}
              >
                <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                <span>{imageUploadError}</span>
              </div>
            )}

            {/* TAB 1: File Upload */}
            {imageTab === 'upload' && (
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  id="menuItemFileInput"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploadingImage}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--card2)',
                    border: '1px dashed var(--line)',
                    borderRadius: '8px',
                    color: 'var(--muted)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                />
                {isUploadingImage && (
                  <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                    Optimizing image (Sharp) & uploading...
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: External URL */}
            {imageTab === 'url' && (
              <div>
                <input
                  type="text"
                  id="menuItemImageUrl"
                  placeholder="https://images.unsplash.com/... or https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--card2)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--cream)',
                    fontSize: '13px',
                  }}
                />
              </div>
            )}

            {/* TAB 3: Media Library Grid */}
            {imageTab === 'library' && (
              <div
                style={{
                  background: 'var(--card2)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '10px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                {isLoadingMedia ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                    <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite', margin: '0 auto 6px' }} />
                    Loading restaurant library...
                  </div>
                ) : mediaLibrary.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                    No previously uploaded photos found in library.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '8px' }}>
                    {mediaLibrary.map((m) => {
                      const isPicked = imageUrl === m.public_url;
                      return (
                        <div
                          key={m._id}
                          onClick={() => setImageUrl(m.public_url)}
                          title={m.original_filename || m._id}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: isPicked ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            position: 'relative',
                            background: '#0C0806',
                          }}
                        >
                          <img
                            src={m.public_url}
                            alt="Media item"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {isPicked && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                background: 'var(--gold)',
                                borderRadius: '50%',
                                width: '14px',
                                height: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <CheckCircle style={{ width: '10px', height: '10px', color: '#000' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
                  CHOICE OPTIONS &amp; MODIFIERS
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
                      placeholder="Group title"
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
                          placeholder="Option name"
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

          {/* Multi-Item Recipe Inventory Deduction Section (Live from Database) */}
          <div
            id="recipeIngredientsContainer"
            style={{
              background: 'rgba(229,177,58,0.06)',
              border: '1px dashed var(--gold)',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '22px',
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

            {/* Live Inventory Stock Search */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type="text"
                id="recipeInventorySearchInput"
                placeholder="🔍 Search live inventory stock by name or brand..."
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
                          {stock.brand && (
                            <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px' }}>
                              [{stock.brand}]
                            </span>
                          )}
                        </div>
                        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
                          {stock.stock} {stock.unit} available
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--muted)' }}>
                      No matching raw materials found in database stock.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Configured Recipe Rows */}
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
                      {ing.mode === 'pct' ? `${ing.amount}% ratio` : `${ing.amount} ${ing.unit}`} deduction
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{ fontWeight: 800, background: 'var(--gold)', color: '#000', padding: '9px 20px' }}
            >
              {isSaving ? 'Saving to Database...' : 'Save Menu Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
