import React, { useState } from 'react';
import { FolderPlus, PlusCircle } from 'lucide-react';

export interface InventoryItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  stock: number;
  unit: string;
  minThreshold: number;
}

interface InventoryViewProps {
  onOpenAddCategory?: () => void;
  onOpenAddItem?: () => void;
  onOpenEditItem?: (item: InventoryItem) => void;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'i1', name: 'Al Fakher Two Apples', brand: 'Al Fakher', category: 'Hookah Tobacco', stock: 12, unit: 'tins', minThreshold: 3 },
  { id: 'i2', name: 'Starbuzz Blue Mist', brand: 'Starbuzz', category: 'Hookah Tobacco', stock: 8, unit: 'tins', minThreshold: 2 },
  { id: 'i3', name: 'Adalya Love 66', brand: 'Adalya', category: 'Hookah Tobacco', stock: 15, unit: 'tins', minThreshold: 4 },
  { id: 'i4', name: 'Coconut Charcoal 1kg', brand: 'CocoUrth', category: 'Coals & Heads', stock: 42, unit: 'boxes', minThreshold: 10 },
  { id: 'i5', name: 'Clay Phunnel Bowls', brand: 'Alpaca', category: 'Coals & Heads', stock: 18, unit: 'units', minThreshold: 5 },
  { id: 'i6', name: 'Disposable Iced Hoses', brand: 'Benzin', category: 'Coals & Heads', stock: 65, unit: 'units', minThreshold: 20 },
  { id: 'i7', name: 'Red Bull Energy Drink', brand: 'Red Bull', category: 'Beverages', stock: 38, unit: 'cans', minThreshold: 12 },
  { id: 'i8', name: 'Perrier Sparkling 330ml', brand: 'Perrier', category: 'Beverages', stock: 24, unit: 'bottles', minThreshold: 8 },
  { id: 'i9', name: 'Authentic Turkish Coffee', brand: 'Kurukahveci', category: 'Beverages', stock: 5, unit: 'kg', minThreshold: 2 },
];

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenAddCategory,
  onOpenAddItem,
  onOpenEditItem,
}) => {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = ['all', 'Hookah Tobacco', 'Coals & Heads', 'Beverages'];

  const adjustStock = (e: React.MouseEvent, id: string, delta: number) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item
      )
    );
  };

  const filteredItems = items.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="inventory-page-layout" id="inventoryPageLayout" style={{ display: 'block' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ minWidth: '160px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cream)', margin: 0 }}>
            Inventory Stock Levels
          </h2>
        </div>

        {/* Integrated Compact Search & Action Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flex: 1,
            minWidth: '280px',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
            <input
              type="text"
              id="inventorySearchInput"
              placeholder="🔍 Search stock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px 8px 34px',
                background: 'var(--card)',
                border: '1.5px solid var(--line)',
                borderRadius: '8px',
                color: 'var(--cream)',
                fontSize: '13px',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '13px',
                opacity: 0.6,
              }}
            >
              🔍
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
            <button
              className="btn touch-target"
              onClick={onOpenAddCategory}
              style={{
                background: 'var(--card2)',
                color: 'var(--gold)',
                border: '1.5px solid var(--gold)',
                fontWeight: 800,
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                minHeight: '36px',
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
                fontWeight: 800,
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                minHeight: '36px',
              }}
              title="Add Stock Item"
            >
              <PlusCircle style={{ width: '14px', height: '14px' }} />
              <span>+ Add Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Category Tabs */}
      <div
        id="inventoryCategoryTabs"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            className={`sub-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'all' ? 'All Items' : cat}
          </button>
        ))}
      </div>

      {/* Grid of square inventory boxes */}
      <div className="inventory-grid-square" id="inventoryGridSquare">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="inventory-box"
            onClick={() => onOpenEditItem && onOpenEditItem(item)}
            style={{ cursor: 'pointer' }}
            title="Click to edit stock item"
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
              <span>{item.category}</span>
              {item.stock <= item.minThreshold && (
                <span style={{ color: 'var(--danger)', fontWeight: 800 }}>LOW STOCK</span>
              )}
            </div>

            <div className="inventory-box-title">{item.name}</div>

            <div
              className="inventory-box-stock"
              style={{
                color: item.stock <= item.minThreshold ? 'var(--danger)' : 'var(--cream)',
              }}
            >
              {item.stock} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>{item.unit}</span>
            </div>

            <div className="inventory-box-controls">
              <button
                className="inventory-box-btn"
                onClick={(e) => adjustStock(e, item.id, -1)}
                title="Decrease Stock"
              >
                -
              </button>
              <button
                className="inventory-box-btn"
                onClick={(e) => adjustStock(e, item.id, 1)}
                title="Increase Stock"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
