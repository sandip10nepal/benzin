import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  Flame,
  Star,
  FolderPlus,
  PlusCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { MenuItem } from '../types';

interface VibeQuestQuestion {
  id: string;
  title: string;
  prompt: string;
  options: Array<{
    text: string;
    emoji: string;
    targetCategory: string;
  }>;
}

interface MenuViewProps {
  onOpenHookahConfig?: () => void;
  onOpenSpecials?: () => void;
  onOpenAddCategory?: () => void;
  onOpenAddItem?: () => void;
  onOpenEditItem?: (item: MenuItem) => void;
}

const INITIAL_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Anarkali House Blend',
    price: 36.0,
    category: 'Signature Mixes',
    superCategory: 'Hookah',
    emoji: '👑',
    description: 'Our house-crafted blend of Pan Ras, Lady Killer & Bagdadi with iced base.',
    isSpecial: true,
  },
  {
    id: 'm2',
    name: 'Blue Mist Premium',
    price: 34.0,
    category: 'Classic Flavors',
    superCategory: 'Hookah',
    emoji: '🫐',
    description: 'Sweet blueberry flavor with a cool, refined mint finish.',
  },
  {
    id: 'm3',
    name: 'Love 66',
    price: 34.0,
    category: 'Exotic Flavors',
    superCategory: 'Hookah',
    emoji: '❤️',
    description: 'Passion fruit, honeydew melon, watermelon with gentle cool menthol.',
  },
  {
    id: 'm4',
    name: 'Zaatar & Cheese Flatbread',
    price: 13.5,
    category: 'Warm Appetizers',
    superCategory: 'Food',
    emoji: '🫓',
    description: 'Stone-baked artisan flatbread with wild thyme zaatar and melted akkawi cheese.',
  },
  {
    id: 'm5',
    name: 'Crispy Falafel Platter',
    price: 14.0,
    category: 'Warm Appetizers',
    superCategory: 'Food',
    emoji: '🧆',
    description: 'Six house-ground crispy falafels served with tahini sauce and pickled turnips.',
  },
  {
    id: 'm6',
    name: 'Turkish Coffee with Cardamom',
    price: 5.5,
    category: 'Hot Beverages',
    superCategory: 'Drinks',
    emoji: '☕',
    description: 'Traditionally prepared in cezve sand with crushed green cardamom pods.',
  },
  {
    id: 'm7',
    name: 'Iced Fresh Mint Lemonade',
    price: 7.0,
    category: 'Mocktails & Sodas',
    superCategory: 'Drinks',
    emoji: '🍋',
    description: 'Freshly squeezed lemon juice blended with garden mint and simple syrup.',
  },
];

const INITIAL_QUESTIONS: VibeQuestQuestion[] = [
  {
    id: 'q1',
    title: 'Experience Type',
    prompt: 'What are you in the mood for tonight?',
    options: [
      { text: 'Hookah Chill', emoji: '💨', targetCategory: 'Hookah' },
      { text: 'Refreshing Drinks', emoji: '🍹', targetCategory: 'Drinks' },
      { text: 'Bites & Appetizers', emoji: '🫓', targetCategory: 'Food' },
    ],
  },
  {
    id: 'q2',
    title: 'Flavor Profile',
    prompt: 'What flavor notes do you prefer?',
    options: [
      { text: 'Fruity & Sweet', emoji: '🍉', targetCategory: 'Exotic Flavors' },
      { text: 'Cool & Minty', emoji: '❄️', targetCategory: 'Classic Flavors' },
      { text: 'Paan & Spiced', emoji: '🌿', targetCategory: 'Signature Mixes' },
    ],
  },
];

export const MenuView: React.FC<MenuViewProps> = ({
  onOpenHookahConfig,
  onOpenSpecials,
  onOpenAddCategory,
  onOpenAddItem,
  onOpenEditItem,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'vibeQuest'>('items');
  const [superCat, setSuperCat] = useState<'All' | 'Hookah' | 'Food' | 'Drinks'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [items] = useState<MenuItem[]>(INITIAL_MENU);
  const [questions, setQuestions] = useState<VibeQuestQuestion[]>(INITIAL_QUESTIONS);

  const filteredItems = items.filter((item) => {
    if (superCat !== 'All' && item.superCategory !== superCat) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        title: `Question ${prev.length + 1}`,
        prompt: 'Select your preference:',
        options: [
          { text: 'Option A', emoji: '⭐', targetCategory: 'Hookah' },
          { text: 'Option B', emoji: '✨', targetCategory: 'Drinks' },
        ],
      },
    ]);
  };

  const handleSaveQuestions = () => {
    alert('Ordering Questions saved successfully!');
  };

  return (
    <div id="menuPageLayout" style={{ display: 'block' }}>
      {/* Menu Catalog Sub-Navigation (Items vs Vibe Quest) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1.5px solid var(--line)',
          paddingBottom: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          className={`sub-tab ${activeSubTab === 'items' ? 'active' : ''}`}
          id="menuSubTab-items"
          onClick={() => setActiveSubTab('items')}
          style={{
            fontWeight: 800,
            fontSize: '13px',
            padding: '8px 18px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <BookOpen style={{ width: '15px', height: '15px' }} />
          <span>Menu Items &amp; Categories</span>
        </button>
        <button
          className={`sub-tab ${activeSubTab === 'vibeQuest' ? 'active' : ''}`}
          id="menuSubTab-vibeQuest"
          onClick={() => setActiveSubTab('vibeQuest')}
          style={{
            fontWeight: 800,
            fontSize: '13px',
            padding: '8px 18px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <HelpCircle style={{ width: '15px', height: '15px', color: 'var(--gold)' }} />
          <span>Ordering Questions</span>
        </button>
      </div>

      {activeSubTab === 'items' ? (
        <div id="menuCatalogItemsView">
          {/* Row 1: Title & Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <h2
              style={{
                fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                fontSize: '22px',
                fontWeight: 900,
                color: 'var(--gold)',
                margin: 0,
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap',
              }}
            >
              Menu Items
            </h2>

            {/* Integrated Compact Search & Action Toolbar */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flex: 1,
                maxWidth: '680px',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                <input
                  type="text"
                  id="menuSearchInput"
                  placeholder="🔍 Search menu items..."
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
                  onClick={() => setActiveSubTab('vibeQuest')}
                  style={{
                    background: 'rgba(245,158,11,0.14)',
                    color: 'var(--gold)',
                    border: '1.5px solid var(--gold)',
                    fontWeight: 800,
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    minHeight: '36px',
                  }}
                  title="Configure Ordering Questions"
                >
                  <HelpCircle style={{ width: '14px', height: '14px' }} />
                  <span>Ordering Questions</span>
                </button>
                <button
                  className="btn touch-target"
                  onClick={onOpenHookahConfig}
                  style={{
                    background: 'rgba(229,177,58,0.12)',
                    color: 'var(--gold)',
                    border: '1.5px solid var(--gold)',
                    fontWeight: 800,
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    minHeight: '36px',
                  }}
                  title="Configure Hookah Flavors, Bases, Add-ons & Packages"
                >
                  <Flame style={{ width: '14px', height: '14px' }} />
                  <span>💨 Hookah Config</span>
                </button>
                <button
                  className="btn touch-target"
                  onClick={onOpenSpecials}
                  style={{
                    background: 'rgba(168,85,247,0.12)',
                    color: '#c084fc',
                    border: '1.5px solid #a855f7',
                    fontWeight: 800,
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    minHeight: '36px',
                  }}
                  title="Configure Restaurant Specials"
                >
                  <Star style={{ width: '14px', height: '14px' }} />
                  <span>⭐ Specials</span>
                </button>
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
                  title="Add Category"
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
                  title="Add Menu Item"
                >
                  <PlusCircle style={{ width: '14px', height: '14px' }} />
                  <span>+ Add Item</span>
                </button>
              </div>
            </div>
          </div>

          {/* Super-Category Tabs Bar */}
          <div
            id="superCategoryHeaderNav"
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '16px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            {(['All', 'Hookah', 'Food', 'Drinks'] as const).map((sc) => (
              <button
                key={sc}
                className={`sub-tab ${superCat === sc ? 'active' : ''}`}
                onClick={() => setSuperCat(sc)}
                style={{ padding: '7px 16px', fontSize: '13px' }}
              >
                {sc === 'All' ? 'All Sections' : sc}
              </button>
            ))}
          </div>

          {/* Sub-Category Pill Filters Bar placeholder */}
          <div id="subCategoryHeaderNav" style={{ marginBottom: '20px' }} />

          {/* Menu Items Grid */}
          <div
            id="menuGridContainer"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="menu-card"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '24px' }}>{item.emoji}</span>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--cream)', margin: 0 }}>
                          {item.name}
                        </h4>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{item.category}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--gold)' }}>
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.4', margin: '8px 0' }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--line)' }}>
                  <button
                    className="btn"
                    onClick={() => onOpenEditItem && onOpenEditItem(item)}
                    style={{ padding: '6px 10px', fontSize: '11px' }}
                  >
                    <Edit2 style={{ width: '12px', height: '12px' }} />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div id="menuCatalogVibeQuestView" style={{ maxWidth: '1040px', margin: '0 auto' }}>
          {/* Header & Primary Action Toolbar */}
          <div
            style={{
              background: 'var(--card)',
              border: '1.5px solid var(--line)',
              borderRadius: '16px',
              padding: '22px 24px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                  fontSize: '22px',
                  fontWeight: 900,
                  color: 'var(--gold)',
                  margin: 0,
                  letterSpacing: '-0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>🎯</span>
                <span>Ordering Question Configuration</span>
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '6px 0 0 0' }}>
                Configure questions shown when customers click navigation buttons, and destination pages or menu categories for each answer.
              </p>
            </div>
            <button
              className="btn btn-primary"
              id="saveQuestionsTopBtn"
              onClick={handleSaveQuestions}
              style={{
                background: 'var(--gold)',
                borderColor: 'var(--gold)',
                color: '#000',
                fontWeight: 900,
                fontSize: '13px',
                padding: '10px 24px',
                borderRadius: '10px',
                boxShadow: '0 4px 14px rgba(229,177,58,0.25)',
              }}
            >
              💾 Save Questions
            </button>
          </div>

          {/* Question Cards List Container */}
          <div
            id="questionConfigCardsContainer"
            style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}
          >
            {questions.map((q, idx) => (
              <div
                key={q.id}
                style={{
                  background: 'var(--card)',
                  border: '1.5px solid var(--line)',
                  borderRadius: '14px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gold)' }}>
                    Q{idx + 1}: {q.title}
                  </div>
                  <button
                    className="btn btn-danger"
                    onClick={() => setQuestions((prev) => prev.filter((item) => item.id !== q.id))}
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    <Trash2 style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 700, marginBottom: '12px' }}>
                  {q.prompt}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      style={{
                        background: 'var(--card2)',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.text}</span>
                      <span style={{ fontSize: '10px', color: 'var(--gold)', marginLeft: '4px' }}>
                        → {opt.targetCategory}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              marginBottom: '40px',
            }}
          >
            <button
              className="btn"
              onClick={handleAddQuestion}
              style={{
                background: 'var(--card2)',
                border: '1.5px dashed var(--gold)',
                color: 'var(--gold)',
                fontWeight: 800,
                fontSize: '13px',
                padding: '10px 20px',
                borderRadius: '10px',
              }}
            >
              + Add Another Question
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveQuestions}
              style={{
                background: 'var(--gold)',
                borderColor: 'var(--gold)',
                color: '#000',
                fontWeight: 900,
                fontSize: '13px',
                padding: '10px 24px',
                borderRadius: '10px',
                boxShadow: '0 4px 14px rgba(229,177,58,0.25)',
              }}
            >
              💾 Save Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
