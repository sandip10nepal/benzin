import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput,
  useWindowDimensions 
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

  // Dynamic layout metrics based on iPad / Phone & Orientation
  const cardWidth = layout.cardWidthPercent;
  const imageHeight = layout.isTablet ? 175 : 195;

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
      <View style={styles.content}>
        {/* Category Navigation Tabs & Global Search */}
        <View style={styles.topControlRow}>
          {/* Category Tabs */}
          <View style={styles.tabsRow}>
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
                  ]}
                >
                  <Text style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : theme.textColor }]}>
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBox, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
            <Search size={18} color={theme.mutedTextColor} />
            <TextInput
              style={[styles.searchInput, { color: theme.textColor }]}
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
              🔍 GLOBAL SEARCH RESULT: {filteredItems.length} ITEMS FOUND FOR "{searchQuery.toUpperCase()}" ACROSS ALL CATEGORIES
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
                    ]}
                  >
                    <Text style={[
                      styles.subcatText, 
                      { color: isActive ? '#000000' : theme.textColor }
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
            style={[styles.mixLabCtaBanner, { backgroundColor: theme.cardColor, borderColor: '#E5B13A', borderWidth: 2 }]}
          >
            <View style={styles.mixLabCtaLeft}>
              <Text style={{ fontSize: 32 }}>🧪</Text>
              <View>
                <View style={[styles.mixLabPill, { backgroundColor: 'rgba(229,177,58,0.12)' }]}>
                  <Text style={[styles.mixLabPillText, { color: '#E5B13A' }]}>FLAVOR LABORATORY</Text>
                </View>
                <Text style={[styles.mixLabCtaTitle, { color: theme.textColor }]}>
                  CREATE YOUR OWN HOOKAH MIX
                </Text>
              </View>
            </View>
            <View style={[styles.mixLabCtaBtn, { backgroundColor: '#E5B13A' }]}>
              <Text style={[styles.mixLabCtaBtnText, { color: '#000000' }]}>ENTER MIX LAB</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Menu Items Grid */}
        <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
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
                      <Text style={{ fontSize: 44 }}>
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
                <View style={styles.cardBody}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.itemName, { color: theme.textColor }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemPrice, { color: theme.secondaryColor }]}>
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={[styles.itemDesc, { color: theme.mutedTextColor }]} numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* HIGH VISIBILITY ADD BUTTON BAR (+ ADD TO ORDER & STEPPER) */}
                  {(() => {
                    if (item.available === false) {
                      return (
                        <View style={styles.cardBtnRow}>
                          <View style={[styles.quickAddBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.borderColor, borderWidth: 1 }]}>
                            <Text style={[styles.quickAddText, { color: theme.mutedTextColor }]}>UNAVAILABLE</Text>
                          </View>
                        </View>
                      );
                    }

                    const qty = itemQuantities[item.id] || 0;
                    return (
                      <View style={styles.cardBtnRow}>
                        {qty === 0 ? (
                          <TouchableOpacity
                            onPress={(e) => handleQuickAdd(item, e)}
                            activeOpacity={0.8}
                            style={[styles.quickAddBtn, { backgroundColor: 'transparent', borderColor: '#22C55E', borderWidth: 1.5 }]}
                          >
                            <Plus size={16} color="#22C55E" />
                            <Text style={[styles.quickAddText, { color: '#22C55E' }]}>+ ADD</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.browseStepperRow}>
                            <TouchableOpacity
                              onPress={(e) => handleUpdateItemQty(item, -1, e)}
                              activeOpacity={0.8}
                              style={[styles.browseStepBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor }]}
                            >
                              <Minus size={14} color={theme.textColor} />
                            </TouchableOpacity>

                            <View style={[styles.browseCountBadge, { backgroundColor: '#2C2B2A' }]}>
                              <Text style={styles.browseCountText}>{qty}</Text>
                            </View>

                            <TouchableOpacity
                              onPress={(e) => handleUpdateItemQty(item, 1, e)}
                              activeOpacity={0.8}
                              style={[styles.browseStepBtn, { backgroundColor: '#2C2B2A', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}
                            >
                              <Plus size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        )}

                        {item.modifierGroups && item.modifierGroups.length > 0 && (
                          <TouchableOpacity
                            onPress={() => onSelectItem(item)}
                            activeOpacity={0.8}
                            style={[styles.customizeBtn, { borderColor: '#E5B13A', borderWidth: 1.5 }]}
                          >
                            <Text style={[styles.customizeBtnText, { color: '#E5B13A' }]}>OPTIONS</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  tabIcon: {
    fontSize: 15,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    minWidth: 320,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  globalSearchBanner: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(229,177,58,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229,177,58,0.3)',
  },
  globalSearchText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  subcatRow: {
    marginBottom: 16,
  },
  subcatScroll: {
    gap: 8,
  },
  subcatPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  subcatText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    paddingBottom: 24,
  },
  itemCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardImageWrapper: {
    width: '100%',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  cardBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardBody: {
    padding: 18,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
    lineHeight: 23,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 10,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 18,
    height: 36,
  },
  cardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  quickAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  customizeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  customizeBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mixLabCtaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 16,
  },
  mixLabCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  mixLabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  mixLabPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  mixLabCtaTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mixLabCtaBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  mixLabCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  browseStepperRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  browseStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  browseCountBadge: {
    flex: 1,
    height: 32,
    borderRadius: 10,
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
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  selectedCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
