import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  PlusCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { apiClient } from '../api/client';

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  categoryId: string;
  stock: number;
  unit: string;
  minThreshold: number;
}

interface InventoryViewProps {
  onOpenAddCategory?: () => void;
  onOpenAddItem?: () => void;
  onOpenEditItem?: (item: InventoryItem) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenAddCategory,
  onOpenAddItem,
  onOpenEditItem,
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string; emoji: string }[]>([
    { id: 'all', label: 'All Items', emoji: '📋' },
    { id: 'INVCAT_1862EED65A2E', label: 'Hookah', emoji: '💨' },
    { id: 'INVCAT_RES_EED4E9D266DF_RAW', label: 'Food', emoji: '🍅' },
    { id: 'INVCAT_0AB839BB0513', label: 'Drinks', emoji: '🧉' },
    { id: 'INVCAT_B6EFBD60AE5B', label: 'Essentials', emoji: '📦' },
  ]);
  const [activeCategory, setActiveCategory] = useState<string>('INVCAT_1862EED65A2E');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [prioritizeLowStock, setPrioritizeLowStock] = useState<boolean>(true);
  const [onlyBelowThreshold, setOnlyBelowThreshold] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load real inventory items and categories from database
  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getInventory();
      if (data && Array.isArray(data.categories) && data.categories.length > 0) {
        const catList = [
          ...data.categories.map((c: any) => ({
            id: c._id || c.id,
            label: c.title || 'Category',
            emoji: c.icon || '📦',
          })),
        ];
        setCategories(catList);
        if (!activeCategory || activeCategory === 'all') {
          setActiveCategory(catList[0].id);
        }
      }

      if (data && data.inventory) {
        const rawList = Object.values(data.inventory);
        const mapped: InventoryItem[] = rawList.map((item: any) => {
          let brand = item.brand ? String(item.brand).trim() : '';
          if (!brand) {
            const uName = String(item.name || '').toUpperCase();
            if (uName.includes('AFZAL')) brand = 'AFZAL';
            else if (uName.includes('AL FAKHER')) brand = 'AL FAKHER';
            else if (uName.includes('ETERNAL SMOKE')) brand = 'ETERNAL SMOKE';
            else if (uName.includes('ADALYA')) brand = 'ADALYA';
            else brand = 'HOUSE';
          }
          const catId = item.category_id || item.category || 'INVCAT_1862EED65A2E';
          return {
            id: item._id || item.id,
            name: item.name || 'Inventory Item',
            brand: brand.toUpperCase(),
            category: catId,
            categoryId: catId,
            stock: Number(item.stock) || 0,
            unit: item.unit || 'g',
            minThreshold: Number(item.reorder_threshold ?? item.minThreshold) || 100,
          };
        });
        setItems(mapped);
      }
    } catch (err) {
      console.error('Error loading inventory from MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const adjustStock = async (e: React.MouseEvent, id: string, delta: number) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item
      )
    );
    try {
      await apiClient.adjustInventory(id, Math.abs(delta), delta > 0 ? 'add' : 'remove');
    } catch (err) {
      console.error('Error adjusting inventory in database:', err);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this stock item?')) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      try {
        await fetch(`${apiClient.baseUrl}/api/orders/inventory/${id}`, {
          method: 'DELETE',
          headers: apiClient.getHeaders(),
        });
      } catch (_) {}
    }
  };

  // Count total items below threshold
  const totalBelowThresholdCount = items.filter(
    (item) => item.stock <= item.minThreshold
  ).length;

  // Filter items by category, search query, and threshold filter
  let filteredItems = items.filter((item) => {
    if (onlyBelowThreshold && item.stock > item.minThreshold) return false;
    if (
      activeCategory !== 'all' &&
      item.category !== activeCategory &&
      item.categoryId !== activeCategory
    ) {
      return false;
    }
    if (
      searchTerm &&
      !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.brand.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.categoryId.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Sort items: if prioritizeLowStock is true, items below threshold float to the very top!
  if (prioritizeLowStock) {
    filteredItems = [...filteredItems].sort((a, b) => {
      const aIsLow = a.stock <= a.minThreshold;
      const bIsLow = b.stock <= b.minThreshold;
      if (aIsLow && !bIsLow) return -1;
      if (!aIsLow && bIsLow) return 1;
      return 0;
    });
  }

  const lowStockInCurrentView = filteredItems.filter(
    (item) => item.stock <= item.minThreshold
  );

  return (
    <div className="inventory-page-layout" id="inventoryPageLayout" style={{ display: 'block' }}>
      {/* Top Header Row with Search and Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ minWidth: '220px' }}>
          <h2
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              fontSize: '22px',
              fontWeight: 900,
              color: '#FFFFFF',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            Inventory Stock Levels
          </h2>
        </div>

        {/* Integrated Search & Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flex: 1,
            minWidth: '280px',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Input Bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '480px' }}>
            <input
              type="text"
              id="inventorySearchInput"
              placeholder="Search stock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px 10px 38px',
                background: '#151D2A',
                border: '1.5px solid #233044',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '13px',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Search style={{ width: '16px', height: '16px', color: '#64748b' }} />
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap' }}>
            {/* Prioritize Low Stock Toggle Button */}
            <button
              className="btn touch-target"
              onClick={() => setPrioritizeLowStock((prev) => !prev)}
              style={{
                background: prioritizeLowStock ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                color: prioritizeLowStock ? '#f87171' : 'var(--muted)',
                border: prioritizeLowStock ? '1.5px solid #ef4444' : '1.5px solid #233044',
                fontWeight: 800,
                padding: '8px 12px',
                fontSize: '12px',
                borderRadius: '10px',
                whiteSpace: 'nowrap',
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              title="Toggle listing below-threshold items at the top"
            >
              <ArrowUpDown style={{ width: '13px', height: '13px' }} />
              <span>Low Stock First {prioritizeLowStock ? '✓' : ''}</span>
            </button>

            <button
              className="btn touch-target"
              onClick={onOpenAddCategory}
              style={{
                background: 'rgba(14, 165, 233, 0.1)',
                color: '#38BDF8',
                border: '1.5px solid #0284C7',
                fontWeight: 800,
                padding: '8px 14px',
                fontSize: '12px',
                borderRadius: '10px',
                whiteSpace: 'nowrap',
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              title="Add Inventory Category"
            >
              <FolderPlus style={{ width: '14px', height: '14px' }} />
              <span>+ Category</span>
            </button>

            <button
              className="btn btn-primary touch-target"
              onClick={onOpenAddItem}
              style={{
                background: '#0ea5e9',
                color: '#FFFFFF',
                fontWeight: 800,
                padding: '8px 16px',
                fontSize: '12px',
                borderRadius: '10px',
                whiteSpace: 'nowrap',
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)',
              }}
              title="Add Stock Item"
            >
              <PlusCircle style={{ width: '14px', height: '14px' }} />
              <span>+ Add Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div
        id="inventoryCategoryTabs"
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '4px',
          alignItems: 'center',
        }}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setOnlyBelowThreshold(false);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                border: isActive ? '1.5px solid #0ea5e9' : '1.5px solid #233044',
                background: isActive ? '#0ea5e9' : '#1e293b',
                color: isActive ? '#FFFFFF' : '#94a3b8',
                boxShadow: isActive ? '0 4px 14px rgba(14, 165, 233, 0.35)' : 'none',
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}

        {/* Below Threshold Quick Filter Pill */}
        <button
          onClick={() => setOnlyBelowThreshold((prev) => !prev)}
          style={{
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            border: onlyBelowThreshold ? '1.5px solid #ef4444' : '1.5px solid rgba(239,68,68,0.4)',
            background: onlyBelowThreshold ? '#ef4444' : 'rgba(239,68,68,0.12)',
            color: onlyBelowThreshold ? '#FFFFFF' : '#f87171',
          }}
        >
          <span>⚠️</span>
          <span>Below Threshold ({totalBelowThresholdCount})</span>
        </button>
      </div>

      {/* Prominent Alert Banner when items are below threshold */}
      {lowStockInCurrentView.length > 0 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1.5px solid rgba(239, 68, 68, 0.45)',
            borderRadius: '16px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle style={{ width: '20px', height: '20px', color: '#f87171', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171' }}>
                Stock Below Reorder Threshold ({lowStockInCurrentView.length} item{lowStockInCurrentView.length > 1 ? 's' : ''})
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Items below threshold are automatically prioritized and displayed at the top of the inventory grid.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
            >
              Sorted at Top
            </span>
          </div>
        </div>
      )}

      {/* Grid of Inventory Cards matching the user screenshot */}
      <div
        className="inventory-grid-square"
        id="inventoryGridSquare"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredItems.map((item) => {
          const isLow = item.stock <= item.minThreshold;
          return (
            <div
              key={item.id}
              className="inventory-card"
              style={{
                background: '#151D2A',
                border: isLow ? '1.5px solid #ef4444' : '1.5px solid #233044',
                borderRadius: '24px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isLow ? '0 8px 24px rgba(239,68,68,0.18)' : '0 8px 24px rgba(0,0,0,0.3)',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div>
                {/* Top Row: Title + Status Pill */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                      fontSize: '19px',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      lineHeight: 1.25,
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.name}
                  </div>

                  {/* Status Pill */}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.6px',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      background: isLow ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)',
                      color: isLow ? '#f87171' : '#10B981',
                      border: isLow ? '1.5px solid #ef4444' : '1.5px solid #10B981',
                    }}
                  >
                    {isLow ? 'LOW STOCK' : 'IN STOCK'}
                  </span>
                </div>

                {/* Brand Tag */}
                <div style={{ marginBottom: '8px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(139,92,246,0.15)',
                      color: '#c4b5fd',
                      border: '1.5px solid #8B5CF6',
                      borderRadius: '9999px',
                      padding: '2px 10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    <span style={{ color: '#E5B13A' }}>🟡</span>
                    <span>{item.brand}</span>
                  </span>
                </div>

                {/* Category ID Pill */}
                <div style={{ marginBottom: '8px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'rgba(14, 165, 233, 0.1)',
                      color: '#38BDF8',
                      border: '1.5px solid #0284C7',
                      borderRadius: '9999px',
                      padding: '2px 10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {item.categoryId}
                  </span>
                </div>

                {/* Threshold Line */}
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isLow ? '#f87171' : '#94a3b8',
                    marginBottom: '12px',
                  }}
                >
                  Threshold: {item.minThreshold}{item.unit}
                </div>

                {/* Big Stock Display */}
                <div
                  style={{
                    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                    fontSize: '32px',
                    fontWeight: 900,
                    color: isLow ? '#f87171' : '#FFFFFF',
                    lineHeight: 1,
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '6px',
                  }}
                >
                  <span>{item.stock}</span>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: isLow ? '#f87171' : '#FFFFFF',
                    }}
                  >
                    {item.unit}
                  </span>
                </div>
              </div>

              {/* Bottom Adjustment and Action Buttons */}
              <div>
                {/* Quick Increment/Decrement Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={(e) => adjustStock(e, item.id, 10)}
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: 'rgba(16,185,129,0.1)',
                      borderColor: '#10B981',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      borderRadius: '10px',
                      color: '#10B981',
                      cursor: 'pointer',
                    }}
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={(e) => adjustStock(e, item.id, 50)}
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: 'rgba(16,185,129,0.1)',
                      borderColor: '#10B981',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      borderRadius: '10px',
                      color: '#10B981',
                      cursor: 'pointer',
                    }}
                  >
                    +50
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={(e) => adjustStock(e, item.id, -10)}
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: 'rgba(239,68,68,0.1)',
                      borderColor: '#ef4444',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      borderRadius: '10px',
                      color: '#f87171',
                      cursor: 'pointer',
                    }}
                  >
                    -10
                  </button>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onOpenEditItem && onOpenEditItem(item)}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1.5px solid #233044',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 style={{ width: '14px', height: '14px', color: '#94a3b8' }} strokeWidth={2.2} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    style={{
                      width: '44px',
                      height: '40px',
                      padding: 0,
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1.5px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    title="Delete Stock Item"
                  >
                    <Trash2 size={16} color="#f87171" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
