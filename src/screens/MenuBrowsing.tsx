import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput
} from 'react-native';
import { Search, Plus, Minus, X, Check, ShoppingBag } from 'lucide-react-native';
import { useRestaurantTheme } from '../theme/ThemeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { BenzinHeader } from '../components/Navigation/BenzinHeader';
import { BottomNavigation } from '../components/Navigation/BottomNavigation';
import { MenuItem, SelectedModifier, CartItem, ConversationStep } from '../types';
import { MENU_IMAGES, getItemImageSource } from '../data/menu_images';

interface MenuBrowsingProps {
  onBack: () => void;
  onSelectItem: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem, qty: number, modifiers: SelectedModifier[], notes?: string) => void;
  onOpenCart: () => void;
  onCallServer: () => void;
  onOpenHost?: (initialStep?: ConversationStep) => void;
  onOpenMixLab?: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartItems?: CartItem[];
  onUpdateQuantity?: (cartItemId: string, newQty: number) => void;
  onRemoveItem?: (cartItemId: string) => void;
  allCategories?: any[];
  allMenuItems: MenuItem[];
}

export const MenuBrowsing: React.FC<MenuBrowsingProps> = ({
  onBack,
  onSelectItem,
  onAddToCart,
  onOpenCart,
  onCallServer,
  onOpenHost,
  onOpenMixLab,
  cartCount,
  cartSubtotal,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  allCategories,
  allMenuItems,
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();
  const isMobile = layout.isMobilePhone;

  // Dynamic layout metrics based on iPad / Phone & Orientation
  const cardWidth = isMobile ? '100%' : layout.cardWidthPercent;
  const imageHeight = isMobile ? 180 : 250;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isGlobalSearch = searchQuery.trim().length > 0;

  // 1. Super Categories (parent_id === null && active !== false)
  const superCategories = useMemo(() => {
    if (allCategories && allCategories.length > 0) {
      const supers = allCategories
        .filter(c => c.parent_id === null && c.active !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      if (supers.length > 0) {
        return supers.map(s => ({
          _id: s._id || s.id,
          name: (s.name || s.title || 'Category').toUpperCase(),
          icon: s.icon || '📋',
        }));
      }
    }

    // Fallback if allCategories is empty
    const list: Array<{ _id: string; name: string; icon?: string }> = [];
    const hasFood = (allMenuItems || []).some(i => i.category === 'food');
    const hasHookah = (allMenuItems || []).some(i => i.category === 'hookah');
    const hasDrinks = (allMenuItems || []).some(i => i.category === 'drinks');
    if (hasFood || (!hasHookah && !hasDrinks)) list.push({ _id: 'cat_super_food', name: 'FOOD & DINING', icon: '🍔' });
    if (hasHookah) list.push({ _id: 'cat_super_hookah', name: 'HOOKAH', icon: '💨' });
    if (hasDrinks) list.push({ _id: 'cat_super_drinks', name: 'BEVERAGES', icon: '🍸' });
    return list;
  }, [allCategories, allMenuItems]);

  const [activeSuperCatId, setActiveSuperCatId] = useState<string>('');

  React.useEffect(() => {
    if (superCategories.length > 0 && (!activeSuperCatId || !superCategories.some(s => s._id === activeSuperCatId))) {
      setActiveSuperCatId(superCategories[0]._id);
    }
  }, [superCategories]);

  // 2. Sub Categories for active Super Category
  const activeSubCategories = useMemo(() => {
    if (allCategories && allCategories.length > 0) {
      const subs = allCategories
        .filter(c => c.parent_id === activeSuperCatId && c.active !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return [{ _id: 'ALL', name: 'ALL' }, ...subs.map(s => ({ _id: s._id || s.id, name: s.name || s.title || s._id }))];
    }

    const legacyCat = activeSuperCatId.replace('cat_super_', '');
    const categoryItems = (allMenuItems || []).filter(item => item.category === legacyCat);
    const subSet = new Set<string>();
    categoryItems.forEach(item => { if (item.subcategory) subSet.add(item.subcategory); });
    return [{ _id: 'ALL', name: 'ALL' }, ...Array.from(subSet).map(s => ({ _id: s, name: s }))];
  }, [allCategories, activeSuperCatId, allMenuItems]);

  const [activeSubCatId, setActiveSubCatId] = useState<string>('ALL');

  React.useEffect(() => {
    setActiveSubCatId('ALL');
  }, [activeSuperCatId]);

  // 3. Filtered Items
  const filteredItems = useMemo(() => {
    const activeItems = (allMenuItems || []).filter(i => i.active !== false);

    if (isGlobalSearch) {
      const q = searchQuery.toLowerCase().trim();
      return activeItems.filter((item) => 
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q))
      ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }

    if (!allCategories || allCategories.length === 0) {
      const legacyCat = activeSuperCatId.replace('cat_super_', '');
      return activeItems.filter((item) => {
        const matchesCategory = item.category === legacyCat;
        const matchesSubcategory = activeSubCatId === 'ALL' || item.subcategory === activeSubCatId;
        return matchesCategory && matchesSubcategory;
      }).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }

    const validSubIds = activeSubCategories.filter(s => s._id !== 'ALL').map(s => s._id);
    const activeSuperObj = superCategories.find(s => s._id === activeSuperCatId);
    const superName = (activeSuperObj?.name || '').toLowerCase();
    let legacyCat: 'hookah' | 'food' | 'drinks' = 'food';
    if (superName.includes('hookah')) legacyCat = 'hookah';
    else if (superName.includes('beverage') || superName.includes('drink')) legacyCat = 'drinks';

    return activeItems.filter((item) => {
      if (activeSubCatId === 'ALL') {
        return validSubIds.includes(item.category_id) || item.category === legacyCat;
      }
      return item.category_id === activeSubCatId;
    }).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [allMenuItems, allCategories, activeSuperCatId, superCategories, activeSubCategories, activeSubCatId, searchQuery, isGlobalSearch]);

  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  const handleUpdateItemQty = (item: MenuItem, delta: number, e: any) => {
    e.stopPropagation();
    if (item.available === false && delta > 0) return;

    const currentQty = itemQuantities[item.id] || 0;
    const newQty = Math.max(0, currentQty + delta);

    setItemQuantities(prev => ({
      ...prev,
      [item.id]: newQty,
    }));

    if (delta > 0 && onAddToCart) {
      onAddToCart(item, 1, []);
      setToastMessage(` Added "${item.name}" to cart`);
      setTimeout(() => setToastMessage(null), 2200);
    } else if (delta < 0) {
      const existingCartItem = cartItems?.find(ci => ci.item.id === item.id);
      if (existingCartItem) {
        if (existingCartItem.quantity > 1 && onUpdateQuantity) {
          onUpdateQuantity(existingCartItem.cartItemId, existingCartItem.quantity - 1);
        } else if (onRemoveItem) {
          onRemoveItem(existingCartItem.cartItemId);
        }
      }
    }
  };

  const handleQuickAdd = (item: MenuItem, e: any) => {
    if (item.available === false) return;
    handleUpdateItemQty(item, 1, e);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.floatingToast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Header */}
      <BenzinHeader
        showBackButton
        onBack={onBack}
        onOpenCart={onOpenCart}
        onOpenCallServer={onCallServer}
        onOpenHost={onOpenHost || onBack}
        cartCount={cartCount}
        title="RESTAURANT MENU"
        subtitle={`TABLE ${theme.tableNumber} • ${theme.name || 'LOUNGE'}`}
      />

      {/* Main Content Area */}
      <View style={[styles.content, { paddingHorizontal: layout.contentPadding }]}>
        {/* Category Navigation Tabs & Global Search */}
        <View style={[styles.topControlRow, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
          {/* Category Tabs Scroll View */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {superCategories.map((cat, idx) => {
              const isActive = activeSuperCatId === cat._id && !isGlobalSearch;
              return (
                <TouchableOpacity
                  key={cat._id || `cat_${idx}`}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSearchQuery('');
                    setActiveSuperCatId(cat._id);
                    setActiveSubCatId('ALL');
                  }}
                  style={[
                    styles.tabPill,
                    { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                    isActive && { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor },
                    isMobile && { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 }
                  ]}
                >
                  <Text style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : theme.textColor, fontSize: isMobile ? 11 : 12 }]}>
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Search Bar */}
          <View style={[styles.searchBox, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }, isMobile && { minWidth: '100%', paddingVertical: 8 }]}>
            <Search size={isMobile ? 16 : 18} color={theme.mutedTextColor} />
            <TextInput
              style={[styles.searchInput, { color: theme.textColor, fontSize: isMobile ? 12 : 13 }]}
              placeholder="Search entire menu..."
              placeholderTextColor={theme.mutedTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {isGlobalSearch && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={theme.mutedTextColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Global Search Indicator Banner */}
        {isGlobalSearch && (
          <View style={styles.globalSearchBanner}>
            <Text style={[styles.globalSearchText, { color: theme.secondaryColor }]}>
              🔍 GLOBAL SEARCH RESULT: {filteredItems.length} ITEMS FOUND FOR "{searchQuery.toUpperCase()}"
            </Text>
          </View>
        )}

        {/* Subcategories Filter Pills Bar */}
        {!isGlobalSearch && activeSubCategories.length > 1 && (
          <View style={styles.subcatRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcatScroll}>
              {activeSubCategories.map((sub, idx) => {
                const isActive = activeSubCatId === sub._id;
                return (
                  <TouchableOpacity
                    key={sub._id || `sub_${idx}`}
                    activeOpacity={0.8}
                    onPress={() => setActiveSubCatId(sub._id)}
                    style={[
                      styles.subcatPill,
                      { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                      isActive && { backgroundColor: theme.secondaryColor, borderColor: theme.secondaryColor },
                      isMobile && { paddingHorizontal: 10, paddingVertical: 5 }
                    ]}
                  >
                    <Text style={[
                      styles.subcatText, 
                      { color: isActive ? '#000000' : theme.textColor, fontSize: isMobile ? 10 : 11 }
                    ]}>
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Mix Lab Launch Banner when Hookah Category is Selected */}
        {!isGlobalSearch && activeSuperCatId.toLowerCase().includes('hookah') && onOpenMixLab && (
          <TouchableOpacity
            onPress={onOpenMixLab}
            activeOpacity={0.88}
            style={[styles.mixLabCtaBanner, { backgroundColor: theme.cardColor, borderColor: '#E5B13A', borderWidth: 2 }, isMobile && { paddingHorizontal: 14, paddingVertical: 10 }]}
          >
            <View style={styles.mixLabCtaLeft}>
              <Text style={{ fontSize: isMobile ? 24 : 32 }}>🧪</Text>
              <View style={{ flexShrink: 1 }}>
                <View style={[styles.mixLabPill, { backgroundColor: 'rgba(229,177,58,0.12)' }]}>
                  <Text style={[styles.mixLabPillText, { color: '#E5B13A' }]}>FLAVOR LABORATORY</Text>
                </View>
                <Text style={[styles.mixLabCtaTitle, { color: theme.textColor, fontSize: isMobile ? 13 : 16 }]} numberOfLines={1}>
                  CREATE YOUR OWN HOOKAH MIX
                </Text>
              </View>
            </View>
            <View style={[styles.mixLabCtaBtn, { backgroundColor: '#E5B13A', paddingHorizontal: isMobile ? 12 : 18 }]}>
              <Text style={[styles.mixLabCtaBtnText, { color: '#000000', fontSize: isMobile ? 10 : 12 }]}>MIX LAB</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Menu Items Grid */}
        <ScrollView contentContainerStyle={[styles.gridContainer, { gap: isMobile ? 12 : 20 }]} showsVerticalScrollIndicator={false}>
          {filteredItems.map((item, idx) => {
            const imageSource = getItemImageSource(item);
            const isPortraitCategory = item.category === 'drinks' || item.category === 'hookah';

            return (
              <TouchableOpacity
                key={item.id || `item_${idx}`}
                activeOpacity={0.88}
                onPress={() => onSelectItem(item)}
                style={[
                  styles.itemCard,
                  { width: cardWidth, backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                  item.available === false && { opacity: 0.6 },
                  (itemQuantities[item.id] || 0) > 0 && { borderColor: '#10B981', borderWidth: 2.5 }
                ]}
              >
                {/* Image & Badge Header */}
                <View style={[
                  styles.cardImageWrapper, 
                  { height: imageHeight, backgroundColor: theme.cardColor }
                ]}>
                  {imageSource ? (
                    <Image 
                      source={imageSource} 
                      style={styles.cardImage} 
                      resizeMode={isPortraitCategory ? 'contain' : 'cover'} 
                    />
                  ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <Text style={{ fontSize: isMobile ? 32 : 44 }}>
                        {item.emoji || '🍽️'}
                      </Text>
                    </View>
                  )}

                  {/* Unavailable / Sold Out Overlay Badge */}
                  {item.available === false && (
                    <View style={[styles.cardBadge, { backgroundColor: '#EF4444' }]}>
                      <Text style={styles.cardBadgeText}>SOLD OUT</Text>
                    </View>
                  )}

                  {/* Badge */}
                  {item.available !== false && item.badge && (
                    <View style={[styles.cardBadge, { backgroundColor: theme.primaryColor }]}>
                      <Text style={styles.cardBadgeText}>{item.badge}</Text>
                    </View>
                  )}

                  {/* Quantities in Order Indicator */}
                  {(itemQuantities[item.id] || 0) > 0 && (
                    <View style={[styles.selectedCountBadge, { backgroundColor: '#10B981' }]}>
                      <Check size={12} color="#FFFFFF" />
                      <Text style={styles.selectedCountText}>{itemQuantities[item.id]} IN ORDER</Text>
                    </View>
                  )}
                </View>

                {/* Card Body */}
                <View style={[styles.cardBody, isMobile && { padding: 12, gap: 4 }]}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.itemName, { color: theme.textColor, fontSize: isMobile ? 14 : 18 }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemPrice, { color: theme.secondaryColor, fontSize: isMobile ? 14 : 18 }]}>
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={[styles.itemDesc, { color: theme.mutedTextColor, fontSize: isMobile ? 10 : 12, height: isMobile ? 28 : 36 }]} numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* HIGH VISIBILITY ADD BUTTON BAR */}
                  {(() => {
                    if (item.available === false) {
                      return (
                        <View style={styles.cardBtnRow}>
                          <View style={[styles.quickAddBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.borderColor, borderWidth: 1 }]}>
                            <Text style={[styles.quickAddText, { color: theme.mutedTextColor, fontSize: isMobile ? 10 : 13 }]}>UNAVAILABLE</Text>
                          </View>
                        </View>
                      );
                    }

                    const qty = itemQuantities[item.id] || 0;
                    return (
                      <View style={[styles.cardBtnRow, isMobile && { gap: 6, marginTop: 4 }]}>
                        {qty === 0 ? (
                          <TouchableOpacity
                            onPress={(e) => handleQuickAdd(item, e)}
                            activeOpacity={0.8}
                            style={[styles.quickAddBtn, { backgroundColor: 'transparent', borderColor: '#22C55E', borderWidth: 1.5 }, isMobile && { paddingVertical: 8 }]}
                          >
                            <Plus size={isMobile ? 14 : 16} color="#22C55E" />
                            <Text style={[styles.quickAddText, { color: '#22C55E', fontSize: isMobile ? 11 : 13 }]}>+ ADD</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.browseStepperRow}>
                            <TouchableOpacity
                              onPress={(e) => handleUpdateItemQty(item, -1, e)}
                              activeOpacity={0.8}
                              style={[styles.browseStepBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor }, isMobile && { width: 28, height: 28 }]}
                            >
                              <Minus size={isMobile ? 12 : 14} color={theme.textColor} />
                            </TouchableOpacity>

                            <View style={[styles.browseCountBadge, { backgroundColor: '#2C2B2A' }, isMobile && { height: 28 }]}>
                              <Text style={[styles.browseCountText, isMobile && { fontSize: 11 }]}>{qty}</Text>
                            </View>

                            <TouchableOpacity
                              onPress={(e) => handleUpdateItemQty(item, 1, e)}
                              activeOpacity={0.8}
                              style={[styles.browseStepBtn, { backgroundColor: '#2C2B2A', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }, isMobile && { width: 28, height: 28 }]}
                            >
                              <Plus size={isMobile ? 12 : 14} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        )}

                        {item.modifierGroups && item.modifierGroups.length > 0 && (
                          <TouchableOpacity
                            onPress={() => onSelectItem(item)}
                            activeOpacity={0.8}
                            style={[styles.customizeBtn, { borderColor: '#E5B13A', borderWidth: 1.5 }, isMobile && { paddingHorizontal: 10, paddingVertical: 7 }]}
                          >
                            <Text style={[styles.customizeBtnText, { color: '#E5B13A', fontSize: isMobile ? 9 : 11 }]}>OPTIONS</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })()}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Footer Nav Bar */}
      <BottomNavigation
        onBack={onBack}
        backText="HOME"
        totalCartSubtotal={cartSubtotal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  floatingToast: {
    position: 'absolute',
    bottom: 95,
    alignSelf: 'center',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  tabLabel: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1.5,
    minWidth: 260,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  globalSearchBanner: {
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(229,177,58,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(229,177,58,0.3)',
  },
  globalSearchText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subcatRow: {
    marginBottom: 12,
  },
  subcatScroll: {
    gap: 6,
  },
  subcatPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  subcatText: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 1320,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  itemCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardImageWrapper: {
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cardBody: {
    padding: 10,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontWeight: '900',
    flex: 1,
  },
  itemPrice: {
    fontWeight: '900',
    marginLeft: 6,
  },
  itemDesc: {
    lineHeight: 14,
    marginTop: 1,
    marginBottom: 2,
  },
  cardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  quickAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  quickAddText: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  customizeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  customizeBtnText: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  mixLabCtaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 14,
  },
  mixLabCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  mixLabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  mixLabPillText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mixLabCtaTitle: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mixLabCtaBtn: {
    paddingVertical: 8,
    borderRadius: 12,
  },
  mixLabCtaBtnText: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  browseStepperRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  browseStepBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  browseCountBadge: {
    flex: 1,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  selectedCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  selectedCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
