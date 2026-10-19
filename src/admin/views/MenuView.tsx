import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  HelpCircle,
  ArrowLeft,
  Flame,
  Star,
  FolderPlus,
  PlusCircle,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
} from 'lucide-react';
import { MenuItem } from '../types';
import { apiClient } from '../api/client';

export type NavigationTrigger =
  | 'start_order'
  | 'next_food'
  | 'next_drinks'
  | 'cart_dessert'
  | 'cart_drinks';

export interface VibeQuestOption {
  text: string;
  emoji: string;
  hostReply: string;
  destination: string;
}

export interface VibeQuestQuestion {
  id: string;
  trigger: NavigationTrigger;
  active: boolean;
  title: string;
  prompt: string;
  subtitle: string;
  curatedProductIds: string[];
  options: VibeQuestOption[];
}

interface MenuViewProps {
  onOpenHookahConfig?: () => void;
  onOpenSpecials?: () => void;
  onOpenAddCategory?: () => void;
  onOpenAddItem?: (scopedCat?: string) => void;
  onOpenEditItem?: (item: MenuItem, scopedCat?: string) => void;
  refreshKey?: number;
}

const resolveImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${apiClient.baseUrl}${cleanPath}`;
};

export const MenuView: React.FC<MenuViewProps> = ({
  onOpenHookahConfig,
  onOpenSpecials,
  onOpenAddCategory,
  onOpenAddItem,
  onOpenEditItem,
  refreshKey,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'vibeQuest'>('items');
  const [superCat, setSuperCat] = useState<'All' | 'Hookah' | 'Food' | 'Drinks'>('All');
  const [subCat, setSubCat] = useState<string>('All Sub-Categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [questions, setQuestions] = useState<VibeQuestQuestion[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [menuData, vqData] = await Promise.all([
          apiClient.getMenu(),
          apiClient.getVibeQuest(),
        ]);

        if (mounted) {
          if (menuData && Array.isArray(menuData.items)) {
            const mapped: MenuItem[] = menuData.items.map((raw: any) => {
              const rawCatIds = Array.isArray(raw.category_ids) ? raw.category_ids : (raw.category ? [raw.category] : []);
              const superCat = raw.super_category || raw.superCategory || (
                raw.category?.toLowerCase().includes('hookah') || raw.category_id?.toLowerCase().includes('hookah')
                  ? 'Hookah'
                  : (raw.category?.toLowerCase().includes('drink') || raw.category?.toLowerCase().includes('beverage') || raw.category?.toLowerCase().includes('mocktail') || raw.category?.toLowerCase().includes('tea') || raw.category?.toLowerCase().includes('coffee')
                    ? 'Drinks'
                    : 'Food')
              );
              return {
                id: raw.id || raw._id,
                name: raw.name || 'Untitled Item',
                price: typeof raw.price === 'number' ? raw.price : parseFloat(raw.price) || 0,
                category: raw.category || raw.category_id || (rawCatIds[0] || 'General'),
                category_ids: rawCatIds,
                categoryIds: rawCatIds,
                superCategory: superCat,
                emoji: raw.emoji || '🍽️',
                description: raw.desc || raw.description || '',
                imageUrl: raw.image_url || raw.imageUrl || raw.image || raw.img || '',
                isSpecial: !!raw.is_special || !!raw.isSpecial,
                available: raw.available !== false,
                recipe: Array.isArray(raw.recipe) ? raw.recipe : [],
                modifier_groups: Array.isArray(raw.modifier_groups) ? raw.modifier_groups : (Array.isArray(raw.modifierGroups) ? raw.modifierGroups : []),
                recipeIngredientsCount: Array.isArray(raw.recipe) ? raw.recipe.length : 0,
                modifierGroupsCount: Array.isArray(raw.modifier_groups || raw.modifierGroups) ? (raw.modifier_groups || raw.modifierGroups).length : 0,
              };
            });
            setItems(mapped);
          }

          if (menuData && Array.isArray(menuData.categories)) {
            setCategories(menuData.categories);
          }

          if (Array.isArray(vqData) && vqData.length > 0) {
            const mappedQuestions: VibeQuestQuestion[] = vqData.map((q: any) => ({
              id: q.id || q._id,
              trigger: (q.navigation_trigger || q.trigger || 'start_order') as NavigationTrigger,
              active: q.active !== false,
              title: q.title || q.question_text || 'Ordering Discovery',
              prompt: q.question_text || q.prompt || q.title || '',
              subtitle: q.subtitle || q.helper_text || '',
              curatedProductIds: Array.isArray(q.curated_product_ids) ? q.curated_product_ids : (Array.isArray(q.pinned_product_ids) ? q.pinned_product_ids : []),
              options: (q.answers || q.options || []).map((a: any) => ({
                text: a.label || a.text || a.answer_text || '',
                emoji: a.emoji || '✨',
                hostReply: a.host_reply || a.hostReply || a.reaction_message || '',
                destination: typeof a.destination === 'string' ? a.destination : (a.destination?.ref_id ? `${a.destination.type}:${a.destination.ref_id}` : (a.destination || 'skip')),
              })),
            }));
            setQuestions(mappedQuestions);
          }
        }
      } catch (err) {
        console.error('Error loading menu catalog from MongoDB:', err);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const handleToggleItemStatus = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, available: item.available === false ? true : false }
          : item
      )
    );
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const superCategoryList = categories.filter((c: any) => c.parent_id === null || c.is_super);
  const subCategoryList = categories.filter((c: any) => c.parent_id !== null && !c.is_super);

  const activeSuperObj = superCategoryList.find(
    (s: any) =>
      (s.name && s.name.toLowerCase().includes(superCat.toLowerCase())) ||
      (s.title && s.title.toLowerCase().includes(superCat.toLowerCase())) ||
      (superCat === 'Hookah' && (s.name?.toLowerCase().includes('hookah') || s.title?.toLowerCase().includes('hookah'))) ||
      (superCat === 'Food' && (s.name?.toLowerCase().includes('food') || s.title?.toLowerCase().includes('food') || s.title?.toLowerCase().includes('dining'))) ||
      (superCat === 'Drinks' && (s.name?.toLowerCase().includes('drink') || s.title?.toLowerCase().includes('beverage')))
  );

  const matchedSubCatsFromDb = subCategoryList
    .filter((c: any) => superCat === 'All' || (activeSuperObj && c.parent_id === (activeSuperObj.id || activeSuperObj._id)))
    .map((c: any) => c.title || c.name);

  const dynamicSubCats = Array.from(
    new Set([
      ...matchedSubCatsFromDb,
      ...items
        .filter((it) => superCat === 'All' || it.superCategory === superCat)
        .map((it) => it.category)
        .filter(Boolean),
    ])
  );

  const availableSubCats = [
    superCat === 'All' ? 'All Sub-Categories' : `All ${superCat}`,
    ...dynamicSubCats,
  ];

  const handleSuperCatChange = (sc: 'All' | 'Hookah' | 'Food' | 'Drinks') => {
    setSuperCat(sc);
    const targetSuper = superCategoryList.find(
      (s: any) =>
        (s.name && s.name.toLowerCase().includes(sc.toLowerCase())) ||
        (s.title && s.title.toLowerCase().includes(sc.toLowerCase())) ||
        (sc === 'Hookah' && (s.name?.toLowerCase().includes('hookah') || s.title?.toLowerCase().includes('hookah'))) ||
        (sc === 'Food' && (s.name?.toLowerCase().includes('food') || s.title?.toLowerCase().includes('food') || s.title?.toLowerCase().includes('dining'))) ||
        (sc === 'Drinks' && (s.name?.toLowerCase().includes('drink') || s.title?.toLowerCase().includes('beverage')))
    );

    const subCats = subCategoryList
      .filter((c: any) => sc === 'All' || (targetSuper && c.parent_id === (targetSuper.id || targetSuper._id)))
      .map((c: any) => c.title || c.name);

    const subList = [
      sc === 'All' ? 'All Sub-Categories' : `All ${sc}`,
      ...Array.from(
        new Set([
          ...subCats,
          ...items
            .filter((it) => sc === 'All' || it.superCategory === sc)
            .map((it) => it.category)
            .filter(Boolean),
        ])
      ),
    ];
    setSubCat(subList[0] || 'All Sub-Categories');
  };

  const filteredItems = items.filter((item) => {
    if (superCat !== 'All') {
      const matchSuper =
        item.superCategory?.toLowerCase() === superCat.toLowerCase() ||
        (superCat === 'Hookah' && (item.category?.toLowerCase().includes('hookah') || item.superCategory?.toLowerCase().includes('hookah'))) ||
        (superCat === 'Food' && (item.category?.toLowerCase().includes('food') || item.superCategory?.toLowerCase().includes('food') || item.superCategory?.toLowerCase().includes('dining'))) ||
        (superCat === 'Drinks' && (item.category?.toLowerCase().includes('drink') || item.superCategory?.toLowerCase().includes('beverage')));
      if (!matchSuper) return false;
    }

    if (subCat && !subCat.startsWith('All')) {
      const itemCatIds = (Array.isArray(item.category_ids) && item.category_ids.length > 0)
        ? item.category_ids.map((c) => String(c).toLowerCase())
        : [String(item.category || '').toLowerCase()];

      const targetLower = subCat.toLowerCase();
      const matchedCat = categories.find(
        (c) =>
          (c.name && c.name.toLowerCase() === targetLower) ||
          (c.title && c.title.toLowerCase() === targetLower) ||
          (c.id && c.id.toLowerCase() === targetLower) ||
          (c._id && c._id.toLowerCase() === targetLower)
      );

      const matches = itemCatIds.some(
        (cid) =>
          cid === targetLower ||
          (matchedCat && (cid === (matchedCat.id || matchedCat._id)?.toLowerCase() || cid === (matchedCat.name || matchedCat.title)?.toLowerCase())) ||
          (item.category && item.category.toLowerCase() === targetLower)
      );

      if (!matches) return false;
    }

    if (
      searchTerm &&
      !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        trigger: 'start_order',
        active: true,
        title: `Custom Question ${prev.length + 1}`,
        prompt: 'What would you like to select?',
        subtitle: 'Custom ordering prompt configured by admin.',
        curatedProductIds: [],
        options: [
          {
            text: 'Option A',
            emoji: '⭐',
            hostReply: 'Great choice!',
            destination: 'cat:Hookah',
          },
          {
            text: 'Option B',
            emoji: '✨',
            hostReply: 'Selected Option B.',
            destination: 'cat:Drinks',
          },
        ],
      },
    ]);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleMoveQuestion = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleToggleQuestionActive = (index: number, active: boolean) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, active } : q))
    );
  };

  const handleUpdateQuestionField = (
    index: number,
    field: 'title' | 'prompt' | 'subtitle' | 'trigger',
    val: string
  ) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, [field]: val } : q))
    );
  };

  const handleAddOptionToQuestion = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        return {
          ...q,
          options: [
            ...q.options,
            {
              text: 'New Choice Option',
              emoji: '🎯',
              hostReply: 'Thank you for your choice!',
              destination: 'cat:Hookah',
            },
          ],
        };
      })
    );
  };

  const handleUpdateOption = (
    qIndex: number,
    optIndex: number,
    field: keyof VibeQuestOption,
    val: string
  ) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const newOpts = q.options.map((opt, oI) =>
          oI === optIndex ? { ...opt, [field]: val } : opt
        );
        return { ...q, options: newOpts };
      })
    );
  };

  const handleMoveOption = (qIndex: number, optIndex: number, dir: -1 | 1) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const target = optIndex + dir;
        if (target < 0 || target >= q.options.length) return q;
        const newOpts = [...q.options];
        const temp = newOpts[optIndex];
        newOpts[optIndex] = newOpts[target];
        newOpts[target] = temp;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        return { ...q, options: q.options.filter((_, oI) => oI !== optIndex) };
      })
    );
  };

  const handleSaveQuestions = async () => {
    try {
      const formattedQuestions = questions.map((q, idx) => ({
        id: q.id,
        navigation_trigger: q.trigger,
        question_text: q.prompt,
        subtitle: q.subtitle,
        active: q.active,
        curated_product_ids: q.curatedProductIds,
        pinned_product_ids: q.curatedProductIds,
        answers: q.options.map((opt, aIdx) => ({
          id: `ans_${idx + 1}_${aIdx + 1}`,
          label: opt.text.trim(),
          host_reply: opt.hostReply.trim(),
          reaction_message: opt.hostReply.trim(),
          destination: opt.destination || 'skip',
          emoji: opt.emoji || '✨',
          curated_product_ids: q.curatedProductIds,
          pinned_product_ids: q.curatedProductIds,
        })),
      }));

      const res = await apiClient.saveVibeQuest(formattedQuestions);
      if (res && (res.success || res.config)) {
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 3000);
        alert('Ordering questions successfully saved and published for customer ordering!');
      } else {
        alert('Could not save questions: ' + (res?.error || res?.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Network error saving questions: ' + err.message);
    }
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
                  id="toolbarOrderingQuestionsBtn"
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
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
                  onClick={() => onOpenAddItem && onOpenAddItem(subCat.startsWith('All') ? undefined : subCat)}
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

          {/* Super-Category Tabs Bar (Hookah, Food, Drinks) */}
          <div
            id="superCategoryHeaderNav"
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '12px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            {(['All', 'Hookah', 'Food', 'Drinks'] as const).map((sc) => (
              <button
                key={sc}
                className={`sub-tab ${superCat === sc ? 'active' : ''}`}
                onClick={() => handleSuperCatChange(sc)}
                style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 800 }}
              >
                {sc === 'All' ? 'All Sections' : sc}
              </button>
            ))}
          </div>

          {/* Sub-Category Pill Filters Bar */}
          <div
            id="subCategoryHeaderNav"
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            {availableSubCats.map((sub) => {
              const isSelected = subCat === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSubCat(sub)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: isSelected ? '1.5px solid var(--gold)' : '1px solid var(--line)',
                    background: isSelected ? 'rgba(229,177,58,0.15)' : 'var(--card)',
                    color: isSelected ? 'var(--gold)' : 'var(--muted)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {sub}
                </button>
              );
            })}
          </div>

          {/* Menu Items Grid with compact sizing */}
          <div
            id="menuGridContainer"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredItems.map((item) => {
              const isAvail = item.available !== false;
              const resolvedImg = resolveImageUrl(item.imageUrl);
              return (
                <div
                  key={item.id}
                  className="menu-card"
                  style={{
                    background: '#151D2A',
                    border: isAvail ? '1.5px solid #233044' : '1.5px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                    opacity: isAvail ? 1 : 0.65,
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div>
                    {/* Top Row: Thumbnail + Title + Price */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1.5px solid #38BDF8',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#0B0F19',
                          }}
                        >
                          {resolvedImg ? (
                            <img
                              src={resolvedImg}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.menu-emoji-fallback') as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span
                            className="menu-emoji-fallback"
                            style={{ fontSize: '26px', display: resolvedImg ? 'none' : 'block' }}
                          >
                            {item.emoji}
                          </span>
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <h3
                            style={{
                              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                              fontSize: '15px',
                              fontWeight: 800,
                              color: '#FFFFFF',
                              margin: 0,
                              lineHeight: 1.25,
                              letterSpacing: '-0.2px',
                              wordBreak: 'break-word',
                            }}
                          >
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      <div
                        style={{
                          fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                          fontSize: '16px',
                          fontWeight: 900,
                          color: '#38BDF8',
                          whiteSpace: 'nowrap',
                          alignSelf: 'flex-start',
                          paddingTop: '2px',
                        }}
                      >
                        ${item.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Description */}
                    {item.description ? (
                      <p
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#94a3b8',
                          lineHeight: 1.4,
                          margin: '6px 0 10px 0',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.description}
                      </p>
                    ) : null}

                    {/* Pill Badges Row */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                      {/* Category Pill */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          background: 'rgba(20, 26, 36, 0.85)',
                          border: '1.5px solid #ca8a04',
                          color: '#38BDF8',
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        <span>{item.emoji}</span>
                        <span>{item.category.toUpperCase()}</span>
                      </span>

                      {/* Status Pill */}
                      {isAvail ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1.5px solid #10B981',
                            color: '#10B981',
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.4px',
                          }}
                        >
                          ACTIVE
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1.5px solid #ef4444',
                            color: '#ef4444',
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.4px',
                          }}
                        >
                          DISABLED
                        </span>
                      )}

                      {item.isSpecial && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            background: 'rgba(168,85,247,0.18)',
                            color: '#c084fc',
                            border: '1.5px solid #a855f7',
                            fontSize: '10px',
                            fontWeight: 900,
                            letterSpacing: '0.4px',
                          }}
                        >
                          ⭐ SPECIAL
                        </span>
                      )}

                      {item.recipeIngredientsCount && item.recipeIngredientsCount > 0 ? (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            background: 'rgba(229,177,58,0.12)',
                            color: 'var(--gold)',
                            border: '1px dashed var(--gold)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          📦 {item.recipeIngredientsCount} Ingredients
                        </span>
                      ) : null}

                      {item.modifierGroupsCount && item.modifierGroupsCount > 0 ? (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            background: 'rgba(16,185,129,0.12)',
                            color: '#10B981',
                            border: '1px dashed #10B981',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          ⚡ {item.modifierGroupsCount} Choice Groups
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Bottom Action Row: Edit, Disable/Enable, Delete */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => onOpenEditItem && onOpenEditItem(item, subCat.startsWith('All') ? (item.category || undefined) : subCat)}
                      style={{
                        flex: 1,
                        height: '34px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1.5px solid #2b394e',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit2 style={{ width: '13px', height: '13px' }} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleItemStatus(item.id)}
                      style={{
                        height: '34px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        background: isAvail ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                        border: isAvail ? '1.5px solid rgba(248, 113, 113, 0.65)' : '1.5px solid rgba(34, 197, 94, 0.65)',
                        color: isAvail ? '#f87171' : '#34d399',
                        fontWeight: 800,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{isAvail ? '🚫' : '🟢'}</span>
                      <span>{isAvail ? 'Disable' : 'Enable'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      style={{
                        width: '36px',
                        height: '34px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1.5px solid rgba(248, 113, 113, 0.35)',
                        color: '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title="Delete Item"
                    >
                      <Trash2 style={{ width: '13px', height: '13px' }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div id="menuCatalogVibeQuestView" style={{ maxWidth: '1040px', margin: '0 auto' }}>
          {/* Header Bar with Back to Menu Items & Save Questions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1.5px solid var(--line)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn touch-target"
                onClick={() => setActiveSubTab('items')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 800,
                  background: 'var(--card2)',
                  border: '1.5px solid var(--line)',
                  color: 'var(--cream)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft style={{ width: '14px', height: '14px' }} />
                <span>Back to Menu Items</span>
              </button>
              <h2
                style={{
                  fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                  fontSize: '18px',
                  fontWeight: 900,
                  color: 'var(--gold)',
                  margin: 0,
                  letterSpacing: '-0.2px',
                }}
              >
                🎯 Ordering Questions
              </h2>
            </div>

            <button
              type="button"
              className="btn btn-primary touch-target"
              id="saveQuestionsTopBtn"
              onClick={handleSaveQuestions}
              style={{
                background: 'var(--gold)',
                borderColor: 'var(--gold)',
                color: '#000',
                fontWeight: 900,
                fontSize: '12px',
                padding: '8px 18px',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(229,177,58,0.25)',
                cursor: 'pointer',
              }}
            >
              💾 Save Questions
            </button>
          </div>

          {saveToast && (
            <div
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1.5px solid #10B981',
                borderRadius: '10px',
                padding: '10px 16px',
                marginBottom: '16px',
                color: '#10B981',
                fontWeight: 800,
                fontSize: '13px',
                textAlign: 'center',
              }}
            >
              ✅ Ordering Question Configuration saved successfully!
            </div>
          )}

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
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        className="btn"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, -1)}
                        style={{ padding: '2px 6px', fontSize: '10px', minHeight: 'unset', opacity: idx === 0 ? 0.3 : 1 }}
                      >
                        <ArrowUp style={{ width: '10px', height: '10px' }} />
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={idx === questions.length - 1}
                        onClick={() => handleMoveQuestion(idx, 1)}
                        style={{ padding: '2px 6px', fontSize: '10px', minHeight: 'unset', opacity: idx === questions.length - 1 ? 0.3 : 1 }}
                      >
                        <ArrowDown style={{ width: '10px', height: '10px' }} />
                      </button>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase' }}>
                        QUESTION #{idx + 1}
                      </div>
                      <input
                        type="text"
                        value={q.title}
                        onChange={(e) => handleUpdateQuestionField(idx, 'title', e.target.value)}
                        placeholder="Internal Question Title"
                        style={{
                          fontSize: '16px',
                          fontWeight: 800,
                          color: 'var(--cream)',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px dashed var(--line)',
                          padding: '2px 4px',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Trigger Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>STAGE:</span>
                      <select
                        value={q.trigger}
                        onChange={(e) => handleUpdateQuestionField(idx, 'trigger', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: 'var(--card2)',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          color: 'var(--gold)',
                        }}
                      >
                        <option value="start_order">start_order (Hookah Experience)</option>
                        <option value="next_food">next_food (Food Suggestions)</option>
                        <option value="next_drinks">next_drinks (Drink Pairings)</option>
                        <option value="cart_dessert">cart_dessert (Dessert Reminder)</option>
                        <option value="cart_drinks">cart_drinks (Hydration Reminder)</option>
                      </select>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: 'var(--cream)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={q.active}
                        onChange={(e) => handleToggleQuestionActive(idx, e.target.checked)}
                        style={{ accentColor: 'var(--gold)', width: '15px', height: '15px' }}
                      />
                      Active
                    </label>

                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteQuestion(q.id)}
                      style={{ padding: '6px 10px', fontSize: '11px' }}
                      title="Delete Question"
                    >
                      <Trash2 style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                </div>

                {/* Prompt & Subtitle Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Customer Prompt *
                    </label>
                    <input
                      type="text"
                      value={q.prompt}
                      onChange={(e) => handleUpdateQuestionField(idx, 'prompt', e.target.value)}
                      placeholder="e.g. What are you in the mood for tonight?"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--card2)',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        color: 'var(--cream)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Host Explanatory Subtitle
                    </label>
                    <input
                      type="text"
                      value={q.subtitle}
                      onChange={(e) => handleUpdateQuestionField(idx, 'subtitle', e.target.value)}
                      placeholder="e.g. Guides guest to signature mixes..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--card2)',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        color: 'var(--cream)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>

                {/* Answer Options List */}
                <div style={{ background: 'var(--card2)', borderRadius: '12px', padding: '14px', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase' }}>
                      🎯 Customer Options &amp; Navigation Destinations ({q.options.length})
                    </div>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleAddOptionToQuestion(idx)}
                      style={{ padding: '4px 10px', fontSize: '11px', background: 'rgba(229,177,58,0.15)', border: '1px solid var(--gold)', color: 'var(--gold)', fontWeight: 800 }}
                    >
                      <Plus style={{ width: '10px', height: '10px' }} /> Add Option
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'var(--card)',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <button
                            type="button"
                            className="btn"
                            disabled={oIdx === 0}
                            onClick={() => handleMoveOption(idx, oIdx, -1)}
                            style={{ padding: '2px 4px', fontSize: '8px', minHeight: 'unset', opacity: oIdx === 0 ? 0.3 : 1 }}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="btn"
                            disabled={oIdx === q.options.length - 1}
                            onClick={() => handleMoveOption(idx, oIdx, 1)}
                            style={{ padding: '2px 4px', fontSize: '8px', minHeight: 'unset', opacity: oIdx === q.options.length - 1 ? 0.3 : 1 }}
                          >
                            ▼
                          </button>
                        </div>

                        {/* Emoji */}
                        <input
                          type="text"
                          value={opt.emoji}
                          onChange={(e) => handleUpdateOption(idx, oIdx, 'emoji', e.target.value)}
                          placeholder="💨"
                          style={{ width: '36px', padding: '6px 4px', textAlign: 'center', fontSize: '14px', background: 'var(--card2)', border: '1px solid var(--line)', borderRadius: '6px', color: 'var(--cream)' }}
                        />

                        {/* Label */}
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleUpdateOption(idx, oIdx, 'text', e.target.value)}
                          placeholder="Option Label"
                          style={{ flex: 1, minWidth: '130px', padding: '6px 8px', fontSize: '12px', fontWeight: 700, background: 'var(--card2)', border: '1px solid var(--line)', borderRadius: '6px', color: 'var(--cream)' }}
                        />

                        {/* Host Reply Bubble */}
                        <input
                          type="text"
                          value={opt.hostReply}
                          onChange={(e) => handleUpdateOption(idx, oIdx, 'hostReply', e.target.value)}
                          placeholder="Host Reply Bubble Text"
                          style={{ flex: 1.2, minWidth: '150px', padding: '6px 8px', fontSize: '11px', background: 'var(--card2)', border: '1px solid var(--line)', borderRadius: '6px', color: 'var(--muted)' }}
                        />

                        {/* Destination */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 800 }}>→</span>
                          <select
                            value={opt.destination}
                            onChange={(e) => handleUpdateOption(idx, oIdx, 'destination', e.target.value)}
                            style={{
                              padding: '6px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: 'var(--card2)',
                              border: '1px solid var(--gold)',
                              borderRadius: '6px',
                              color: 'var(--gold)',
                              maxWidth: '220px',
                            }}
                          >
                            <optgroup label="Standard Actions">
                              <option value="menu:hookah">House Mix Hookahs Menu (menu:hookah)</option>
                              <option value="flow:mix_lab">Custom Hookah Mix Lab (flow:mix_lab)</option>
                              <option value="menu:food">All Food Menu (menu:food)</option>
                              <option value="menu:drinks">All Drinks Menu (menu:drinks)</option>
                              <option value="stage:checkout">Review Order (stage:checkout)</option>
                              <option value="skip">Skip Question (skip)</option>
                            </optgroup>
                            {categories && categories.length > 0 && (
                              <optgroup label="Menu Categories">
                                {categories.map((c: any) => {
                                  const cid = c.id || c._id;
                                  const val = `category:${cid}`;
                                  return (
                                    <option key={cid} value={val}>
                                      Category: {c.title || c.name || cid} ({cid})
                                    </option>
                                  );
                                })}
                              </optgroup>
                            )}
                            {items && items.length > 0 && (
                              <optgroup label="Menu Items">
                                {items.slice(0, 30).map((it: MenuItem) => (
                                  <option key={it.id} value={`item:${it.id}`}>
                                    Item: {it.name} (${Number(it.price).toFixed(2)})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {opt.destination &&
                              !['menu:hookah', 'flow:mix_lab', 'menu:food', 'menu:drinks', 'stage:checkout', 'skip'].includes(opt.destination) &&
                              !categories.some((c: any) => `category:${c.id || c._id}` === opt.destination || (c.id || c._id) === opt.destination) &&
                              !items.some((it: MenuItem) => `item:${it.id}` === opt.destination) && (
                                <option value={opt.destination}>Current: {opt.destination}</option>
                              )}
                          </select>
                        </div>

                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDeleteOption(idx, oIdx)}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="Delete Option"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
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
