import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DakuUpgradeModal } from '../components/DakuUpgradeModal';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput
} from 'react-native';
import { Search, Plus, Minus, X, Check, ShoppingBag, ArrowRight } from 'lucide-react-native';
import { useRestaurantTheme } from '../theme/ThemeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { BenzinHeader } from '../components/Navigation/BenzinHeader';
import { BottomNavigation } from '../components/Navigation/BottomNavigation';
import { MenuItem, SelectedModifier, CartItem, ConversationStep } from '../types';
import { MENU_IMAGES, getItemImageSource } from '../data/menu_images';
import { itemRequiresModifierSelection, getActionLabelForItem } from '../utils/modifierUtils';
import { VibeQuestConfig, VibeQuestStage } from '../vibe-quest/vibe-quest.types';
import { DEFAULT_VIBE_QUEST_CONFIG } from '../vibe-quest/vibe-quest.default';
import { TenantApiService } from '../services/api';
import { OrderReminderModal } from '../components/OrderReminder/OrderReminderModal';
import { HostReplyTransitionModal, HostTransitionPayload } from '../components/VibeQuest/HostReplyTransitionModal';
import { parseDestination } from '../utils/orderFlowUtils';
import {
  isDessertInCart,
  isDrinkInCart,
  isDessertItem,
  isDrinkItem,
  resolveCategoryTitle,
} from '../utils/orderFlowUtils';

interface MenuBrowsingProps {
  onBack: () => void;
  onSelectItem: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem, qty: number, modifiers: SelectedModifier[], notes?: string) => void;
  onOpenCart: () => void;
  onCallServer: () => void;
  onOpenTrackOrder?: () => void;
  isTrackingActive?: boolean;
  onOpenHost?: (initialStep?: ConversationStep) => void;
  onOpenMixLab?: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartItems?: CartItem[];
  onUpdateQuantity?: (cartItemId: string, newQty: number) => void;
  onRemoveItem?: (cartItemId: string) => void;
  allCategories?: any[];
  allMenuItems: MenuItem[];
  hookahConfig?: any;
  restaurantId?: string;
  tableNumber?: string;
}

interface HouseMixItemCardProps {
  item: MenuItem;
  theme: any;
  isMobile: boolean;
  cardWidth: any;
  onAddToCart?: (item: MenuItem, qty: number, modifiers: SelectedModifier[], notes?: string) => void;
  count: number;
  onUpdateQuantity?: (item: MenuItem, delta: number, e: any) => void;
  onSelectItem: (item: MenuItem) => void;
  hookahConfig?: any;
}

const HouseMixItemCard: React.FC<HouseMixItemCardProps> = ({
  item,
  theme,
  isMobile,
  cardWidth,
  onAddToCart,
  count,
  onUpdateQuantity,
  onSelectItem,
  hookahConfig,
}) => {
  const [showDakuModal, setShowDakuModal] = useState(false);
  const [iceBase, setIceBase] = useState(false);
  const [iceHose, setIceHose] = useState(false);

  const packages = hookahConfig?.packages?.filter((p: any) => p.active !== false) || [{ id: 'daku', name: 'Make It Daku', price: 65, description: 'Unlimited Head Refill' }];
  const dakuPkg = packages.find((p: any) => p.id === 'daku' || (p.name && p.name.toLowerCase().includes('daku'))) || packages[0];
  
  const baseHookahPrice = item.price;
  const dakuOptionPrice = Math.max(0, (dakuPkg?.price || 65) - item.price);
  
  const iceBasePrice = 2;
  const iceHosePrice = 6;
  
  const totalPrice = baseHookahPrice + (iceBase ? iceBasePrice : 0) + (iceHose ? iceHosePrice : 0);

  const itemMods = item.modifierGroups || (item as any).modifier_groups || [];
  const customGroups = itemMods.filter((g: any) => {
    const gn = (g.name || g.id || '').toLowerCase();
    const isEnhanceGroup = gn.includes('enhancement') || g.id === 'MOD_HOOKAH_ENHANCEMENTS';
    const opts = g.options || [];
    const onlyIceOpts = opts.length > 0 && opts.every((o: any) => {
      const on = (o.name || o.id || '').toLowerCase();
      return on.includes('ice base') || on.includes('ice hose');
    });
    return !(isEnhanceGroup && onlyIceOpts);
  });
  const hasCustomModifiers = customGroups.length > 0;
  const requiresChoice = itemRequiresModifierSelection(item);

  const handleAddInitiated = (e: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (requiresChoice) {
      onSelectItem(item);
      return;
    }
    setShowDakuModal(true);
  };

  const handleAcceptDaku = () => {
    setShowDakuModal(false);
    const selectedOpts: SelectedModifier[] = [];
    selectedOpts.push({
      id: 'PKG_DAKU',
      name: dakuPkg?.name || 'Make It Daku',
      optionName: `${dakuPkg?.name || 'Daku Package'} ($${dakuPkg?.price || 65}) - ${dakuPkg?.description || 'Unlimited Head Refill'}`,
      price: dakuOptionPrice,
    });
    // Ice Base and Ice Hose are included for free!
    if (iceBase) selectedOpts.push({ id: 'OPT_ICE_BASE', name: 'Ice Base', optionName: 'Ice Base (Included)', price: 0 });
    if (iceHose) selectedOpts.push({ id: 'OPT_ICE_HOSE', name: 'Ice Hose', optionName: 'Ice Hose (Included)', price: 0 });
    
    const noteParts: string[] = [];
    noteParts.push(`🔥 ${dakuPkg?.name?.toUpperCase() || 'DAKU'}: $${dakuPkg?.price || 65} ${dakuPkg?.description || 'Unlimited Head Refill'}`);
    if (iceBase) noteParts.push(`Ice Base (Included)`);
    if (iceHose) noteParts.push(`Ice Hose (Included)`);

    if (onAddToCart) {
      onAddToCart(item, 1, selectedOpts, noteParts.join(' · '));
    }
  };

  const handleDeclineDaku = () => {
    setShowDakuModal(false);
    const selectedOpts: SelectedModifier[] = [];
    if (iceBase) selectedOpts.push({ id: 'OPT_ICE_BASE', name: 'Ice Base', optionName: 'Ice Base', price: iceBasePrice });
    if (iceHose) selectedOpts.push({ id: 'OPT_ICE_HOSE', name: 'Ice Hose', optionName: 'Ice Hose', price: iceHosePrice });
    
    const noteParts: string[] = [];
    if (iceBase) noteParts.push(`Ice Base (+$${iceBasePrice})`);
    if (iceHose) noteParts.push(`Ice Hose (+$${iceHosePrice})`);

    if (onAddToCart) {
      onAddToCart(item, 1, selectedOpts, noteParts.join(' · '));
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onSelectItem(item)}
      style={[
        styles.itemCard,
        {
          width: cardWidth,
          backgroundColor: theme.cardColor,
          borderColor: count > 0 ? '#10B981' : theme.borderColor,
          borderWidth: count > 0 ? 2 : 1.5,
          padding: isMobile ? 12 : 16,
          marginBottom: 10,
          borderRadius: 18,
          justifyContent: 'space-between',
        }
      ]}
    >
      <DakuUpgradeModal
        visible={showDakuModal}
        onAccept={handleAcceptDaku}
        onDecline={handleDeclineDaku}
        onClose={() => setShowDakuModal(false)}
      />
      <View>
        {/* Title and Price Row */}
        <View style={[styles.titleRow, { alignItems: 'center', marginBottom: 6 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={{ fontSize: isMobile ? 16 : 20 }}>💨</Text>
            <Text
              style={[styles.itemName, { color: theme.textColor, fontSize: isMobile ? 15 : 18, fontWeight: '900' }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
          <Text style={[styles.itemPrice, { color: theme.secondaryColor, fontSize: isMobile ? 15 : 18, fontWeight: '900' }]}>
            ${totalPrice.toFixed(2)}
          </Text>
        </View>

        {/* Description / Base Note */}
        {item.description ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Text style={{ fontSize: 11 }}>🍇</Text>
            <Text
              style={[styles.itemDesc, { color: '#E5B13A', fontSize: isMobile ? 11 : 12, fontWeight: '700' }]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          </View>
        ) : null}

        {/* Custom Modifier Badges from Admin */}
        {hasCustomModifiers && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {customGroups.map((g: any, gIdx: number) => (
              <TouchableOpacity
                key={g.id || gIdx}
                activeOpacity={0.8}
                onPress={() => onSelectItem(item)}
                style={{
                  backgroundColor: 'rgba(229,177,58,0.12)',
                  borderColor: '#E5B13A',
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text style={{ color: '#E5B13A', fontSize: isMobile ? 10 : 11, fontWeight: '800' }}>
                  ✨ {g.name}{g.required ? ' *' : ''} ({g.options?.length || 0} opts)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Inline Add-On Options (Ice Base & Ice Hose) */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          {/* Ice Base Toggle Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={(e) => {
              if (e && e.stopPropagation) e.stopPropagation();
              setIceBase(!iceBase);
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingVertical: isMobile ? 7 : 9,
              paddingHorizontal: 6,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: iceBase ? '#0099FF' : 'rgba(255,255,255,0.18)',
              backgroundColor: iceBase ? 'rgba(0,153,255,0.22)' : 'rgba(255,255,255,0.05)',
            }}
          >
            <Text style={{ fontSize: isMobile ? 13 : 15 }}>🧊</Text>
            <Text
              style={{
                color: iceBase ? '#0099FF' : theme.textColor,
                fontSize: isMobile ? 11 : 12,
                fontWeight: '900',
              }}
            >
              {iceBase ? '✓ ICE BASE +$2' : '+ ICE BASE $2'}
            </Text>
          </TouchableOpacity>

          {/* Ice Hose Toggle Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={(e) => {
              if (e && e.stopPropagation) e.stopPropagation();
              setIceHose(!iceHose);
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingVertical: isMobile ? 7 : 9,
              paddingHorizontal: 6,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: iceHose ? '#14B8A6' : 'rgba(255,255,255,0.18)',
              backgroundColor: iceHose ? 'rgba(20,184,166,0.22)' : 'rgba(255,255,255,0.05)',
            }}
          >
            <Text style={{ fontSize: isMobile ? 13 : 15 }}>❄️</Text>
            <Text
              style={{
                color: iceHose ? '#14B8A6' : theme.textColor,
                fontSize: isMobile ? 11 : 12,
                fontWeight: '900',
              }}
            >
              {iceHose ? '✓ ICE HOSE +$6' : '+ ICE HOSE $6'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Button Row */}
      {count === 0 ? (
        <View style={{ flexDirection: 'row', gap: 6, width: '100%' }}>
          <TouchableOpacity
            onPress={handleAddInitiated}
            activeOpacity={0.85}
            style={[
              styles.quickAddBtn,
              {
                backgroundColor: requiresChoice ? 'rgba(229,177,58,0.15)' : '#22C55E',
                borderColor: requiresChoice ? '#E5B13A' : '#22C55E',
                borderWidth: 1.5,
                paddingVertical: isMobile ? 9 : 11,
                flex: 1,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }
            ]}
          >
            <Plus size={isMobile ? 15 : 17} color={requiresChoice ? '#E5B13A' : '#FFFFFF'} />
            <Text style={[styles.quickAddText, { color: requiresChoice ? '#E5B13A' : '#FFFFFF', fontSize: isMobile ? 12 : 13, fontWeight: '900' }]}>
              {requiresChoice ? `CUSTOMIZE & ADD ($${totalPrice.toFixed(2)})` : `ADD TO ORDER ($${totalPrice.toFixed(2)})`}
            </Text>
          </TouchableOpacity>

          {hasCustomModifiers && !requiresChoice && (
            <TouchableOpacity
              onPress={() => onSelectItem(item)}
              activeOpacity={0.8}
              style={{
                backgroundColor: 'rgba(229,177,58,0.15)',
                borderColor: '#E5B13A',
                borderWidth: 1.5,
                borderRadius: 12,
                paddingHorizontal: 12,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#E5B13A', fontSize: isMobile ? 11 : 12, fontWeight: '900' }}>
                OPTIONS
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={[styles.browseStepperRow, { width: '100%', justifyContent: 'space-between' }]}>
          <TouchableOpacity
            onPress={(e) => {
              if (onUpdateQuantity) onUpdateQuantity(item, -1, e);
            }}
            activeOpacity={0.8}
            style={[styles.browseStepBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor, width: 34, height: 34, borderRadius: 10 }]}
          >
            <Minus size={14} color={theme.textColor} />
          </TouchableOpacity>

          <View style={[styles.browseCountBadge, { backgroundColor: '#10B981', height: 34, paddingHorizontal: 14, borderRadius: 10 }]}>
            <Check size={13} color="#FFFFFF" />
            <Text style={[styles.browseCountText, { fontSize: 13, color: '#FFFFFF', fontWeight: '900', marginLeft: 4 }]}>
              {count} IN ORDER
            </Text>
          </View>


          <TouchableOpacity
            onPress={handleAddInitiated}
            activeOpacity={0.8}
            style={[styles.browseStepBtn, { backgroundColor: '#22C55E', borderColor: '#22C55E', width: 34, height: 34, borderRadius: 10 }]}
          >
            <Plus size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const MenuBrowsing: React.FC<MenuBrowsingProps> = ({
  onBack,
  onSelectItem,
  onAddToCart,
  onOpenCart,
  onCallServer,
  onOpenTrackOrder,
  isTrackingActive = false,
  onOpenHost,
  onOpenMixLab,
  cartCount,
  cartSubtotal,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  allCategories,
  allMenuItems,
  hookahConfig,
  restaurantId,
  tableNumber,
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();
  const isMobile = layout.isMobilePhone;

  // Dynamic layout metrics based on iPad / Phone & Orientation
  const cardWidth = isMobile ? '100%' : layout.cardWidthPercent;
  const imageHeight = isMobile ? 180 : 250;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vibe Quest Discovery State & Config
  const [vibeQuestConfig, setVibeQuestConfig] = useState<VibeQuestConfig>(DEFAULT_VIBE_QUEST_CONFIG);
  const [selectedVibeAnswers, setSelectedVibeAnswers] = useState<Record<string, string[]>>({});
  const [activeQuestionByStage, setActiveQuestionByStage] = useState<Record<string, string>>({});
  const [vibeReactionMessage, setVibeReactionMessage] = useState<string | null>(null);
  const [isVibeSectionDismissed, setIsVibeSectionDismissed] = useState<boolean>(false);

  // Order Reminders State
  const [activeReminder, setActiveReminder] = useState<'dessert' | 'drinks' | null>(null);
  const [handledReminders, setHandledReminders] = useState<Set<'dessert' | 'drinks'>>(new Set());
  const [pendingTargetCatId, setPendingTargetCatId] = useState<string | null>(null);

  const dessertReminderQuestion = useMemo(() => {
    return (vibeQuestConfig?.questions || []).find(q =>
      q.navigation_trigger === 'cart_dessert' || q.id === 'q_dessert_reminder' || (q.stage === 'dessert' && q.repeat_policy === 'cart_conditional')
    );
  }, [vibeQuestConfig?.questions]);

  const dessertBrowseAnswer = useMemo(() => {
    return dessertReminderQuestion?.answers?.find(a => a.destination && a.destination !== 'skip') || dessertReminderQuestion?.answers?.[0];
  }, [dessertReminderQuestion]);

  const dessertSkipAnswer = useMemo(() => {
    return dessertReminderQuestion?.answers?.find(a => a.destination === 'skip') || dessertReminderQuestion?.answers?.[1];
  }, [dessertReminderQuestion]);

  const drinkReminderQuestion = useMemo(() => {
    return (vibeQuestConfig?.questions || []).find(q =>
      q.navigation_trigger === 'cart_drinks' || (q.repeat_policy === 'cart_conditional' && q.stage === 'drinks') || q.id === 'q_drink_cart_reminder'
    );
  }, [vibeQuestConfig?.questions]);

  const drinkBrowseAnswer = useMemo(() => {
    return drinkReminderQuestion?.answers?.find(a => a.destination && a.destination !== 'skip') || drinkReminderQuestion?.answers?.[0];
  }, [drinkReminderQuestion]);

  const drinkSkipAnswer = useMemo(() => {
    return drinkReminderQuestion?.answers?.find(a => a.destination === 'skip') || drinkReminderQuestion?.answers?.[1];
  }, [drinkReminderQuestion]);

  const dessertQuickAddItems = useMemo(() => {
    const rawIds = dessertReminderQuestion?.curated_product_ids 
      || dessertReminderQuestion?.pinned_product_ids 
      || dessertBrowseAnswer?.curated_product_ids
      || dessertBrowseAnswer?.pinned_product_ids
      || vibeQuestConfig?.settings?.dessert_featured_product_ids
      || [];
    if (!rawIds || rawIds.length === 0) return [];
    return (allMenuItems || []).filter(item => {
      const iId = String(item.id || item._id || '').toLowerCase();
      return rawIds.some(rid => String(rid).toLowerCase() === iId);
    });
  }, [allMenuItems, dessertReminderQuestion, dessertBrowseAnswer, vibeQuestConfig?.settings]);

  const drinkQuickAddItems = useMemo(() => {
    const rawIds = drinkReminderQuestion?.curated_product_ids 
      || drinkReminderQuestion?.pinned_product_ids 
      || drinkBrowseAnswer?.curated_product_ids
      || drinkBrowseAnswer?.pinned_product_ids
      || vibeQuestConfig?.settings?.drink_featured_product_ids
      || [];
    if (!rawIds || rawIds.length === 0) return [];
    return (allMenuItems || []).filter(item => {
      const iId = String(item.id || item._id || '').toLowerCase();
      return rawIds.some(rid => String(rid).toLowerCase() === iId);
    });
  }, [allMenuItems, drinkReminderQuestion, drinkBrowseAnswer, vibeQuestConfig?.settings]);

  const effectiveRestaurantId = restaurantId || 'RES_EED4E9D266DF';
  const effectiveTableNumber = tableNumber || theme.tableNumber || '1';

  useEffect(() => {
    let isMounted = true;
    async function loadVibeQuest() {
      try {
        const res = await TenantApiService.resilientFetchPublic(
          `/api/vibe-quest?restaurantId=${encodeURIComponent(effectiveRestaurantId)}`,
          { headers: { 'X-Restaurant-ID': effectiveRestaurantId } }
        );
        const data = await res.json();
        if (isMounted && data.success && data.config) {
          setVibeQuestConfig(data.config);
        }
      } catch (err) {
        console.warn('[MenuBrowsing] Could not load Vibe Quest config:', err);
      }
    }
    loadVibeQuest();
    return () => {
      isMounted = false;
    };
  }, [effectiveRestaurantId]);

  const isVibeQuestEnabled = useMemo(() => {
    return !!(vibeQuestConfig && vibeQuestConfig.enabled !== false);
  }, [vibeQuestConfig]);

  const getStageForCategory = useCallback((catId: string): VibeQuestStage => {
    const idLower = (catId || '').toLowerCase();
    if (idLower === 'all' || idLower.includes('hookah') || idLower.includes('shisha')) return 'hookah';
    if (idLower.includes('drink') || idLower.includes('beverage') || idLower.includes('refresher') || idLower.includes('tea') || idLower.includes('coffee') || idLower.includes('soft')) return 'drinks';
    if (idLower.includes('dessert')) return 'dessert';
    return 'food';
  }, []);

  const isGlobalSearch = searchQuery.trim().length > 0;

  // Helper: robust category matching for multi-category items
  const isItemInCat = (item: MenuItem, targetCatId: string) => {
    if (!targetCatId || targetCatId === 'ALL') return true;
    const targetLower = targetCatId.toLowerCase();
    const targetClean = targetLower.replace(/^cat_/, '');

    const itemCatIds = (Array.isArray(item.category_ids) && item.category_ids.length > 0)
      ? item.category_ids
      : [item.category_id, item.category, item.subcategory].filter(Boolean) as string[];

    // 1. Direct or normalized ID match
    for (const cid of itemCatIds) {
      const cLower = String(cid).toLowerCase();
      const cClean = cLower.replace(/^cat_/, '');
      if (cLower === targetLower || cClean === targetClean) return true;
      if (cClean.includes(targetClean) || targetClean.includes(cClean)) return true;
    }

    // 2. Direct string match on item properties
    if (item.category_id && (item.category_id.toLowerCase() === targetLower || item.category_id.toLowerCase().replace(/^cat_/, '') === targetClean)) return true;
    if (item.subcategory && (item.subcategory.toLowerCase() === targetLower || item.subcategory.toLowerCase().replace(/^cat_/, '') === targetClean)) return true;

    // 3. Domain semantic mapping
    if (targetClean.includes('drink') || targetClean.includes('beverage')) {
      if (item.category === 'drinks') return true;
      if (itemCatIds.some(c => String(c).toLowerCase().includes('drink') || String(c).toLowerCase().includes('refresher') || String(c).toLowerCase().includes('tea') || String(c).toLowerCase().includes('soft'))) return true;
    }
    if (targetClean.includes('hookah') || targetClean.includes('shisha')) {
      if (item.category === 'hookah') return true;
      if (itemCatIds.some(c => String(c).toLowerCase().includes('hookah'))) return true;
    }
    if (targetClean.includes('veg')) {
      if (itemCatIds.some(c => String(c).toLowerCase().includes('veg'))) return true;
      if ((item.subcategory || '').toLowerCase().includes('veg')) return true;
    }
    if (targetClean.includes('appetizer')) {
      if (itemCatIds.some(c => String(c).toLowerCase().includes('appetizer'))) return true;
      if ((item.subcategory || '').toLowerCase().includes('appetizer')) return true;
    }
    if (targetClean.includes('continental')) {
      if (itemCatIds.some(c => String(c).toLowerCase().includes('continental'))) return true;
      if ((item.subcategory || '').toLowerCase().includes('continental')) return true;
    }
    if (targetClean.includes('main')) {
      if (itemCatIds.some(c => String(c).toLowerCase().includes('main'))) return true;
      if ((item.subcategory || '').toLowerCase().includes('main')) return true;
    }
    if (targetClean.includes('wing')) {
      if (itemCatIds.some(c => String(c).toLowerCase().includes('wing'))) return true;
      if ((item.subcategory || '').toLowerCase().includes('wing')) return true;
    }
    if (targetClean.includes('burger')) {
      if (itemCatIds.some(c => String(c).toLowerCase().includes('burger'))) return true;
      if ((item.subcategory || '').toLowerCase().includes('burger')) return true;
    }
    if (targetClean.includes('wrap')) {
      if (itemCatIds.some(c => String(c).toLowerCase().includes('wrap'))) return true;
      if ((item.subcategory || '').toLowerCase().includes('wrap')) return true;
    }
    if (targetClean.includes('dessert')) {
      if (itemCatIds.some(c => String(c).toLowerCase().includes('dessert'))) return true;
      if ((item.subcategory || '').toLowerCase().includes('dessert')) return true;
    }

    return false;
  };

  // 1. Primary Categories matching cavallidallas.com
  // [APPETIZERS][MAINS][WINGS][VEGETARIAN][BURGERS][WRAPS][CONTINENTAL STREET FOOD][DESSERTS][DRINKS][HOOKAH]
  const superCategories = useMemo(() => {
    const list: Array<{ _id: string; name: string; icon?: string }> = [
      { _id: 'ALL', name: 'ALL', icon: '📋' }
    ];

    if (allCategories && allCategories.length > 0) {
      // Find official subcategories or super categories and map them cleanly
      const getCatId = (pattern: RegExp) => {
        const found = allCategories.find(c => pattern.test(c.name || c.title || c._id || ''));
        return found ? (found._id || found.id) : null;
      };

      const officialSpecs = [
        { pattern: /appetizer/i, defaultId: 'CAT_APPETIZERS', name: 'APPETIZERS', icon: '🥗' },
        { pattern: /main/i, defaultId: 'CAT_MAINS', name: 'MAINS', icon: '🥩' },
        { pattern: /wing/i, defaultId: 'CAT_WINGS', name: 'WINGS', icon: '🍗' },
        { pattern: /vegetar/i, defaultId: 'CAT_VEGETARIAN', name: 'VEGETARIAN', icon: '🌱' },
        { pattern: /burger/i, defaultId: 'CAT_BURGERS', name: 'BURGERS', icon: '🍔' },
        { pattern: /wrap/i, defaultId: 'CAT_WRAPS', name: 'WRAPS', icon: '🌯' },
        { pattern: /continental/i, defaultId: 'CAT_CONTINENTAL', name: 'CONTINENTAL STREET FOOD', icon: '🍜' },
        { pattern: /dessert/i, defaultId: 'CAT_DESSERTS', name: 'DESSERTS', icon: '🍰' },
        { pattern: /beverage|drink/i, defaultId: 'cat_super_drinks', name: 'DRINKS', icon: '🍹' },
        { pattern: /hookah|shisha/i, defaultId: 'cat_super_hookah', name: 'HOOKAH', icon: '💨' },
      ];

      officialSpecs.forEach(spec => {
        const matchedId = getCatId(spec.pattern) || spec.defaultId;
        list.push({
          _id: matchedId,
          name: spec.name,
          icon: spec.icon,
        });
      });

      return list;
    }

    list.push(
      { _id: 'CAT_APPETIZERS', name: 'APPETIZERS', icon: '🥗' },
      { _id: 'CAT_MAINS', name: 'MAINS', icon: '🥩' },
      { _id: 'CAT_WINGS', name: 'WINGS', icon: '🍗' },
      { _id: 'CAT_VEGETARIAN', name: 'VEGETARIAN', icon: '🌱' },
      { _id: 'CAT_BURGERS', name: 'BURGERS', icon: '🍔' },
      { _id: 'CAT_WRAPS', name: 'WRAPS', icon: '🌯' },
      { _id: 'CAT_CONTINENTAL', name: 'CONTINENTAL STREET FOOD', icon: '🍜' },
      { _id: 'CAT_DESSERTS', name: 'DESSERTS', icon: '🍰' },
      { _id: 'cat_super_drinks', name: 'DRINKS', icon: '🍹' },
      { _id: 'cat_super_hookah', name: 'HOOKAH', icon: '💨' }
    );
    return list;
  }, [allCategories]);

  const [activeSuperCatId, setActiveSuperCatId] = useState<string>('ALL');
  const [inlineHostTransition, setInlineHostTransition] = useState<HostTransitionPayload | null>(null);

  const handleSuperCategoryChange = useCallback((targetCatId: string) => {
    if (targetCatId === activeSuperCatId) return;

    setActiveSuperCatId(targetCatId);
    setActiveSubCatId('ALL');
  }, [activeSuperCatId]);

  const currentStage = useMemo<VibeQuestStage>(() => {
    return getStageForCategory(activeSuperCatId);
  }, [getStageForCategory, activeSuperCatId]);

  const currentStageQuestions = useMemo(() => {
    return (vibeQuestConfig?.questions || [])
      .filter((q) => (currentStage === 'hookah' ? q.stage === 'hookah' : currentStage === 'drinks' ? q.stage === 'drinks' : currentStage === 'dessert' ? q.stage === 'dessert' : q.stage === 'food') && q.active !== false)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [vibeQuestConfig, currentStage]);

  const currentVibeQuestion = useMemo(() => {
    if (currentStageQuestions.length === 0) return null;
    const explicitQId = activeQuestionByStage[currentStage];
    if (explicitQId) {
      const match = currentStageQuestions.find((q) => q.id === explicitQId);
      if (match) return match;
    }
    return currentStageQuestions[0];
  }, [currentStageQuestions, activeQuestionByStage, currentStage]);

  const hasNextStageQuestion = useMemo(() => {
    return currentStageQuestions.length > 1;
  }, [currentStageQuestions]);

  const handleSelectInlineAnswer = useCallback((questionId: string, answerId: string) => {
    setSelectedVibeAnswers((prev) => ({
      ...prev,
      [questionId]: [answerId],
    }));

    if (!vibeQuestConfig) return;
    const q = vibeQuestConfig.questions.find((item) => item.id === questionId);
    if (!q) return;
    const ans = q.answers.find((a) => a.id === answerId);
    if (!ans) return;

    let reply = (ans.host_reply || ans.reaction_message || '').trim();
    if (!reply && vibeQuestConfig.settings?.reactions && ans.signals) {
      for (const sig of ans.signals) {
        if (vibeQuestConfig.settings.reactions[sig]) {
          reply = vibeQuestConfig.settings.reactions[sig];
          break;
        }
      }
    }
    if (!reply && ans.description) {
      reply = ans.description;
    }

    setVibeReactionMessage(reply || null);

    const executeNav = () => {
      if (!ans.destination || ans.destination === 'skip' || ans.destination === 'stay') return;
      const parsed = parseDestination(ans.destination);
      if (parsed.type === 'category' && parsed.target) {
        const catTarget = parsed.target.toLowerCase();
        const foundSuper = superCategories.find(sc => (sc._id || '').toLowerCase() === catTarget || (sc.name || '').toLowerCase() === catTarget);
        if (foundSuper) {
          handleSuperCategoryChange(foundSuper._id);
        } else {
          const foundSub = (allCategories || []).find(c => 
            (c._id || c.id || '').toLowerCase() === catTarget || (c.name || '').toLowerCase() === catTarget
          );
          if (foundSub) {
            if (activeSuperCatId !== 'cat_super_food' && activeSuperCatId !== 'cat_super_drinks' && activeSuperCatId !== 'cat_super_hookah') {
              handleSuperCategoryChange('cat_super_food');
            }
            setActiveSubCatId(foundSub._id || foundSub.id || foundSub.name);
          }
        }
      } else if (parsed.type === 'stage' && parsed.target) {
        if (parsed.target === 'food') handleSuperCategoryChange('cat_super_food');
        else if (parsed.target === 'drinks') handleSuperCategoryChange('cat_super_drinks');
        else if (parsed.target === 'hookah') handleSuperCategoryChange('cat_super_hookah');
      } else if (parsed.type === 'flow' && parsed.target === 'mix_lab' && onOpenMixLab) {
        onOpenMixLab();
      }
    };

    if (reply && ans.destination && ans.destination !== 'skip' && ans.destination !== 'stay') {
      const parsed = parseDestination(ans.destination);
      let targetLabel: string | undefined = parsed.target ? parsed.target.replace(/^CAT_/i, '').replace(/_/g, ' ') : undefined;
      setInlineHostTransition({
        questionTitle: q.title || q.question_text,
        selectedOptionLabel: ans.label,
        selectedOptionEmoji: ans.emoji,
        replyMessage: reply,
        targetDestinationLabel: targetLabel,
        onComplete: () => {
          setInlineHostTransition(null);
          executeNav();
        },
      });
    } else {
      executeNav();
    }
  }, [vibeQuestConfig, superCategories, allCategories, activeSuperCatId, handleSuperCategoryChange, onOpenMixLab]);

  const handleNextInlineQuestion = useCallback(() => {
    if (!currentVibeQuestion || currentStageQuestions.length <= 1) return;
    const curIdx = currentStageQuestions.findIndex((q) => q.id === currentVibeQuestion.id);
    const nextIdx = (curIdx + 1) % currentStageQuestions.length;
    const nextQ = currentStageQuestions[nextIdx];
    setActiveQuestionByStage((prev) => ({
      ...prev,
      [currentStage]: nextQ.id,
    }));
    setVibeReactionMessage(null);
  }, [currentVibeQuestion, currentStageQuestions, currentStage]);

  const handleResetVibe = useCallback((questionId: string) => {
    setSelectedVibeAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setVibeReactionMessage(null);
  }, []);

  // 2. Sub Categories for active Category (especially for Drinks and Hookah sub-groups)
  const activeSubCategories = useMemo(() => {
    if (activeSuperCatId === 'ALL') {
      return [{ _id: 'ALL', name: 'ALL' }];
    }

    const activeKey = activeSuperCatId.toLowerCase();

    // If DRINKS category selected -> expose Refreshers, Tea & Coffee, Soft Drinks
    if (activeKey.includes('drink') || activeKey.includes('beverage')) {
      const subs = (allCategories || []).filter(c => 
        (c.parent_id && (c.parent_id.toLowerCase().includes('drink') || c.parent_id.toLowerCase().includes('beverage'))) ||
        (c._id && c._id.toLowerCase().includes('drinks_'))
      ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      if (subs.length > 0) {
        return [{ _id: 'ALL', name: 'ALL DRINKS' }, ...subs.map(s => ({ _id: s._id || s.id, name: (s.name || s.title || s._id).toUpperCase() }))];
      }
      return [
        { _id: 'ALL', name: 'ALL DRINKS' },
        { _id: 'CAT_DRINKS_REFRESHERS', name: 'REFRESHERS' },
        { _id: 'CAT_DRINKS_TEA_COFFEE', name: 'TEA & COFFEE' },
        { _id: 'CAT_DRINKS_SOFT', name: 'SOFT DRINKS & WATER' }
      ];
    }

    // If HOOKAH category selected -> expose House Mixes, Custom Mix Lab, Refills & Add-ons
    if (activeKey.includes('hookah') || activeKey.includes('shisha')) {
      const subs = (allCategories || []).filter(c => 
        (c.parent_id && c.parent_id.toLowerCase().includes('hookah')) ||
        (c._id && c._id.toLowerCase().includes('hookah_'))
      ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      if (subs.length > 0) {
        return [{ _id: 'ALL', name: 'ALL HOOKAH' }, ...subs.map(s => ({ _id: s._id || s.id, name: (s.name || s.title || s._id).toUpperCase() }))];
      }
      return [
        { _id: 'ALL', name: 'ALL HOOKAH' },
        { _id: 'CAT_HOOKAH_HOUSE_MIXES', name: 'HOUSE MIXES' },
        { _id: 'CAT_HOOKAH_CUSTOM', name: 'CUSTOM MIX LAB' },
        { _id: 'CAT_HOOKAH_EXTRAS', name: 'REFILLS & ADD-ONS' }
      ];
    }

    // Otherwise (Appetizers, Vegetarian, Mains, Wings, Burgers, Wraps, Continental, Desserts)
    return [{ _id: 'ALL', name: 'ALL' }];
  }, [allCategories, activeSuperCatId]);

  const [activeSubCatId, setActiveSubCatId] = useState<string>('ALL');

  React.useEffect(() => {
    setActiveSubCatId('ALL');
  }, [activeSuperCatId]);

  const matchProductById = useCallback((pId: string, items: MenuItem[]): MenuItem | undefined => {
    if (!pId || !items || items.length === 0) return undefined;
    const cleanPId = pId.trim().toLowerCase();
    const strippedPId = cleanPId
      .replace(/_hookah$/, '')
      .replace(/_dessert$/, '')
      .replace(/_app$/, '')
      .replace(/_main$/, '')
      .replace(/_drink$/, '');

    let found = items.find((m) => {
      const mId = (m.id || (m as any)._id || '').toLowerCase();
      return mId === cleanPId;
    });
    if (found) return found;

    found = items.find((m) => {
      const mId = (m.id || (m as any)._id || '').toLowerCase();
      const strippedMId = mId
        .replace(/_hookah$/, '')
        .replace(/_dessert$/, '')
        .replace(/_app$/, '')
        .replace(/_main$/, '')
        .replace(/_drink$/, '');
      return strippedMId === strippedPId || mId.includes(strippedPId) || cleanPId.includes(strippedMId);
    });
    if (found) return found;

    found = items.find((m) => {
      const slug = (m.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
      return cleanPId.includes(slug) || slug.includes(strippedPId);
    });
    return found;
  }, []);

  const stageRecommendations = useMemo<MenuItem[]>(() => {
    if (!allMenuItems || allMenuItems.length === 0) return [];

    const activeQ = currentVibeQuestion;
    const selectedAnsIds = (activeQ && selectedVibeAnswers[activeQ.id]) || [];

    // Never auto-populate or hang recommendations shelf unless the user actively made a choice
    if (!activeQ || selectedAnsIds.length === 0) {
      return [];
    }

    const pinnedIds: string[] = [];

    // Pinned products of user's active answer selection
    activeQ.answers
      .filter((a) => selectedAnsIds.includes(a.id))
      .forEach((a) => {
        const p = (a as any).pinned_product_ids || (a as any).curated_product_ids || [];
        p.forEach((pid: string) => {
          if (pid && !pinnedIds.includes(pid)) pinnedIds.push(pid);
        });
      });

    const recs: MenuItem[] = [];
    pinnedIds.forEach((pId) => {
      const match = matchProductById(pId, allMenuItems);
      if (match && !recs.some((r) => (r.id || (r as any)._id) === (match.id || (match as any)._id))) {
        recs.push(match);
      }
    });

    return recs.slice(0, 6);
  }, [allMenuItems, currentVibeQuestion, selectedVibeAnswers, matchProductById]);

  const handleDessertBrowse = useCallback(() => {
    setHandledReminders((prev) => new Set(prev).add('dessert'));
    setActiveReminder(null);
    setActiveSuperCatId('cat_super_food');
    const destCat = vibeQuestConfig?.settings?.dessert_destination_category || 'CAT_DESSERTS';
    const catTitle = resolveCategoryTitle(destCat, allCategories) || 'DESSERTS';
    setActiveSubCatId(catTitle);
  }, [vibeQuestConfig?.settings?.dessert_destination_category, allCategories]);

  const handleDessertQuickAdd = useCallback((item: MenuItem) => {
    setHandledReminders((prev) => new Set(prev).add('dessert'));
    setActiveReminder(null);
    if (onAddToCart) onAddToCart(item, 1, []);
    if (pendingTargetCatId) {
      setActiveSuperCatId(pendingTargetCatId);
      setActiveSubCatId('ALL');
      setPendingTargetCatId(null);
    } else {
      onOpenCart();
    }
  }, [onAddToCart, pendingTargetCatId, onOpenCart]);

  const handleDessertSkip = useCallback(() => {
    setHandledReminders((prev) => new Set(prev).add('dessert'));
    setActiveReminder(null);
    if (pendingTargetCatId) {
      setActiveSuperCatId(pendingTargetCatId);
      setActiveSubCatId('ALL');
      setPendingTargetCatId(null);
    } else {
      onOpenCart();
    }
  }, [pendingTargetCatId, onOpenCart]);

  const handleDrinkBrowse = useCallback(() => {
    setHandledReminders((prev) => new Set(prev).add('drinks'));
    setActiveReminder(null);
    setActiveSuperCatId('cat_super_drinks');
    setActiveSubCatId('ALL');
  }, []);

  const handleDrinkQuickAdd = useCallback((item: MenuItem) => {
    setHandledReminders((prev) => new Set(prev).add('drinks'));
    setActiveReminder(null);
    if (onAddToCart) onAddToCart(item, 1, []);
    onOpenCart();
  }, [onAddToCart, onOpenCart]);

  const handleDrinkSkip = useCallback(() => {
    setHandledReminders((prev) => new Set(prev).add('drinks'));
    setActiveReminder(null);
    onOpenCart();
  }, [onOpenCart]);

  const handleHeaderOpenCart = useCallback(() => {
    const drinkReminderEnabled = vibeQuestConfig?.settings?.drink_reminder_enabled !== false;
    const hasDrink = isDrinkInCart(cartItems);
    if (!hasDrink && drinkReminderEnabled && !handledReminders.has('drinks')) {
      setActiveReminder('drinks');
      return;
    }

    const dessertReminderEnabled = vibeQuestConfig?.settings?.dessert_reminder_enabled !== false;
    const hasDessert = isDessertInCart(cartItems);
    if (!hasDessert && dessertReminderEnabled && !handledReminders.has('dessert')) {
      setActiveReminder('dessert');
      return;
    }

    onOpenCart();
  }, [vibeQuestConfig?.settings, cartItems, handledReminders, onOpenCart]);

  const handleBottomNavAdvance = useCallback(() => {
    const currentStage = getStageForCategory(activeSuperCatId);

    if (currentStage === 'hookah') {
      const targetCatId = 'CAT_APPETIZERS';
      setActiveSuperCatId(targetCatId);
      setActiveSubCatId('ALL');
      return;
    }

    if (currentStage === 'food') {
      const dessertReminderEnabled = vibeQuestConfig?.settings?.dessert_reminder_enabled !== false;
      const hasDessert = isDessertInCart(cartItems);
      if (!hasDessert && dessertReminderEnabled && !handledReminders.has('dessert')) {
        setActiveReminder('dessert');
        setPendingTargetCatId('cat_super_drinks');
        return;
      }

      const targetCatId = 'cat_super_drinks';
      setActiveSuperCatId(targetCatId);
      setActiveSubCatId('ALL');
      return;
    }

    if (currentStage === 'drinks') {
      const drinkReminderEnabled = vibeQuestConfig?.settings?.drink_reminder_enabled !== false;
      const hasDrink = isDrinkInCart(cartItems);
      if (!hasDrink && drinkReminderEnabled && !handledReminders.has('drinks')) {
        setActiveReminder('drinks');
        return;
      }

      onOpenCart();
      return;
    }

    // If ALL
    setActiveSuperCatId('cat_super_hookah');
    setActiveSubCatId('ALL');
  }, [
    activeSuperCatId,
    getStageForCategory,
    onOpenCart,
    vibeQuestConfig?.settings,
    cartItems,
    handledReminders,
  ]);

  const bottomNavProps = useMemo(() => {
    const stage = getStageForCategory(activeSuperCatId);
    if (stage === 'hookah') {
      return {
        primaryText: 'EXPLORE FOOD',
        primaryIcon: 'next' as const,
      };
    }
    if (stage === 'food') {
      return {
        primaryText: 'EXPLORE DRINKS',
        primaryIcon: 'next' as const,
      };
    }
    if (stage === 'drinks') {
      return {
        primaryText: 'VIEW CART',
        primaryIcon: 'cart' as const,
      };
    }
    return {
      primaryText: 'VIBE QUEST',
      primaryIcon: 'next' as const,
    };
  }, [activeSuperCatId, getStageForCategory]);

  // 3. Filtered Items with deterministic category-sequence grouping and multi-category support
  const filteredItems = useMemo(() => {
    const activeItems = (allMenuItems || []).filter(i => i.active !== false && i.available !== false && (i as any).is_available !== false);

    const catMap = new Map<string, { sort_order: number; title: string }>();
    (allCategories || []).forEach((c: any) => {
      const id = c.id || c._id;
      if (id) {
        catMap.set(String(id), { 
          sort_order: typeof c.sort_order === 'number' ? c.sort_order : 9999, 
          title: c.title || c.name || '' 
        });
      }
    });

    const sortWithCategorySequence = (items: MenuItem[]) => {
      return [...items].sort((a, b) => {
        const catA = a.category_id ? catMap.get(String(a.category_id)) : undefined;
        const catB = b.category_id ? catMap.get(String(b.category_id)) : undefined;

        const catOrderA = (a as any).category_sort_order ?? catA?.sort_order ?? 9999;
        const catOrderB = (b as any).category_sort_order ?? catB?.sort_order ?? 9999;

        if (catOrderA !== catOrderB) return catOrderA - catOrderB;

        const itemOrderA = typeof a.sort_order === 'number' ? a.sort_order : 9999;
        const itemOrderB = typeof b.sort_order === 'number' ? b.sort_order : 9999;
        if (itemOrderA !== itemOrderB) return itemOrderA - itemOrderB;

        return (a.name || '').localeCompare(b.name || '');
      });
    };

    if (isGlobalSearch) {
      const q = searchQuery.toLowerCase().trim();
      const matched = activeItems.filter((item) => 
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q))
      );
      return sortWithCategorySequence(matched);
    }

    if (activeSuperCatId === 'ALL') {
      return sortWithCategorySequence(activeItems);
    }

    // If sub-filter is active (e.g. Refreshers or House Mixes)
    if (activeSubCatId !== 'ALL') {
      const subFiltered = activeItems.filter(item => isItemInCat(item, activeSubCatId));
      return sortWithCategorySequence(subFiltered.length > 0 ? subFiltered : activeItems);
    }

    // Filter by primary category (e.g. APPETIZERS, VEGETARIAN, CONTINENTAL)
    const list = activeItems.filter((item) => isItemInCat(item, activeSuperCatId));
    return sortWithCategorySequence(list);
  }, [allMenuItems, allCategories, activeSuperCatId, superCategories, activeSubCategories, activeSubCatId, searchQuery, isGlobalSearch]);

  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Synchronize item quantities with cart
  React.useEffect(() => {
    if (!cartItems) return;
    const counts: Record<string, number> = {};
    cartItems.forEach(ci => {
      counts[ci.item.id] = (counts[ci.item.id] || 0) + ci.quantity;
    });
    setItemQuantities(counts);
  }, [cartItems]);

  const handleUpdateItemQty = (item: MenuItem, delta: number, e: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (item.available === false && delta > 0) return;

    // If customer tries to add/increment item without choosing required modifiers (e.g. sauce for wings)
    if (delta > 0 && itemRequiresModifierSelection(item)) {
      onSelectItem(item);
      return;
    }

    const currentQty = itemQuantities[item.id] || 0;
    const newQty = Math.max(0, currentQty + delta);

    setItemQuantities(prev => ({
      ...prev,
      [item.id]: newQty,
    }));

    if (delta > 0 && onAddToCart) {
      onAddToCart(item, 1, []);

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
    if (e && e.stopPropagation) e.stopPropagation();
    if (item.available === false) return;
    if (itemRequiresModifierSelection(item)) {
      onSelectItem(item);
      return;
    }
    handleUpdateItemQty(item, 1, e);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>


      {/* Header */}
      <BenzinHeader
        showBackButton
        onBack={onBack}
        onOpenCart={handleHeaderOpenCart}
        onOpenCallServer={onCallServer}
        onOpenTrackOrder={onOpenTrackOrder}
        isTrackingActive={isTrackingActive}
        onOpenHost={onOpenHost || onBack}
        cartCount={cartCount}
        title="RESTAURANT MENU"
        subtitle={`TABLE ${theme.tableNumber} • ${theme.name || 'LOUNGE'}`}
      />

      {/* Main Content Area */}
      <View style={[styles.content, { paddingHorizontal: layout.contentPadding }]}>
        {/* Global Search Box */}
        <View style={[styles.searchBoxRow, isMobile && { paddingVertical: 4 }]}>
          <View style={[styles.searchBox, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }, isMobile && { minWidth: '100%', paddingVertical: 8 }]}>
            <Search size={isMobile ? 16 : 18} color={theme.mutedTextColor} />
            <TextInput
              style={[styles.searchInput, { color: theme.textColor, fontSize: 16 }]}
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

        {/* INLINE INTERACTIVE VIBE QUEST & LIVE RECOMMENDATIONS */}
        {!isGlobalSearch && isVibeQuestEnabled && currentVibeQuestion && !isVibeSectionDismissed && (
          <View style={[styles.inlineVibeContainer, { backgroundColor: theme.cardColor, borderColor: '#E5B13A' }]}>
            {/* Header */}
            <View style={styles.inlineVibeHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Text style={{ fontSize: 22 }}>
                  {currentStage === 'hookah' ? '💨' : currentStage === 'drinks' ? '🍹' : currentStage === 'dessert' ? '🍰' : '🍽️'}
                </Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.inlineVibeTitle, { color: '#E5B13A' }]}>
                      {currentStage.toUpperCase()} VIBE QUEST
                    </Text>
                    <View style={styles.inlineVibeBadge}>
                      <Text style={styles.inlineVibeBadgeText}>RECOMMENDED</Text>
                    </View>
                  </View>
                  <Text style={[styles.inlineVibeSub, { color: theme.mutedTextColor }]} numberOfLines={1}>
                    {currentVibeQuestion.helper_text || 'Pick your mood for tailored recommendations'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsVibeSectionDismissed(true)}
                style={styles.inlineVibeDismissBtn}
                accessibilityLabel="Dismiss Vibe Quest"
              >
                <Text style={[styles.inlineVibeDismissText, { color: theme.mutedTextColor }]}>Hide ✕</Text>
              </TouchableOpacity>
            </View>

            {/* Question Text */}
            <Text style={[styles.inlineVibeQuestionText, { color: theme.textColor }]}>
              {currentVibeQuestion.question_text}
            </Text>

            {/* Reaction Banner if set */}
            {vibeReactionMessage ? (
              <View style={styles.inlineVibeReactionBanner}>
                <Text style={styles.inlineVibeReactionText}>{vibeReactionMessage}</Text>
              </View>
            ) : null}

            {/* Answers Grid */}
            <View style={styles.inlineVibeAnswersGrid}>
              {currentVibeQuestion.answers.map((ans) => {
                const isSelected = (selectedVibeAnswers[currentVibeQuestion.id] || []).includes(ans.id);
                return (
                  <TouchableOpacity
                    key={ans.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectInlineAnswer(currentVibeQuestion.id, ans.id)}
                    style={[
                      styles.inlineVibeAnswerCard,
                      {
                        backgroundColor: isSelected ? 'rgba(229, 177, 58, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        borderColor: isSelected ? '#E5B13A' : theme.borderColor,
                        borderWidth: isSelected ? 2 : 1,
                      },
                      isMobile ? { width: '100%' } : { width: '48%' },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {ans.emoji ? <Text style={{ fontSize: 18 }}>{ans.emoji}</Text> : null}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inlineVibeAnswerLabel, { color: isSelected ? '#E5B13A' : theme.textColor, fontWeight: isSelected ? '800' : '600' }]}>
                          {ans.label}
                        </Text>
                        {ans.description ? (
                          <Text style={[styles.inlineVibeAnswerDesc, { color: theme.mutedTextColor }]} numberOfLines={1}>
                            {ans.description}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected && (
                        <View style={styles.inlineVibeCheckmark}>
                          <Check size={12} color="#000000" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Question Controls Row */}
            <View style={styles.inlineVibeControlsRow}>
              {hasNextStageQuestion && (
                <TouchableOpacity
                  onPress={handleNextInlineQuestion}
                  style={styles.inlineVibeNextBtn}
                >
                  <Text style={styles.inlineVibeNextBtnText}>Next Question →</Text>
                </TouchableOpacity>
              )}
              {selectedVibeAnswers[currentVibeQuestion.id]?.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleResetVibe(currentVibeQuestion.id)}
                  style={styles.inlineVibeResetBtn}
                >
                  <Text style={styles.inlineVibeResetBtnText}>Reset Vibe ↺</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* LIVE RECOMMENDATIONS SHELF INSIDE VIBE QUEST */}
            {selectedVibeAnswers[currentVibeQuestion.id]?.length > 0 && stageRecommendations.length > 0 && (
              <View style={styles.inlineRecsShelf}>
                <View style={styles.inlineRecsHeader}>
                  <Text style={styles.inlineRecsTitle}>
                    🎯 RECOMMENDED FOR YOUR VIBE
                  </Text>
                  <Text style={[styles.inlineRecsCount, { color: theme.mutedTextColor }]}>
                    {stageRecommendations.length} {stageRecommendations.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inlineRecsScroll}>
                  {stageRecommendations.map((item) => {
                    const count = itemQuantities[item.id] || 0;
                    const imageSource = getItemImageSource(item);
                    return (
                      <View
                        key={`inline_rec_${item.id}`}
                        style={[
                          styles.inlineRecCard,
                          {
                            backgroundColor: theme.mode === 'light' ? '#FFFFFF' : '#1F1F23',
                            borderColor: count > 0 ? '#10B981' : theme.borderColor,
                          }
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => onSelectItem(item)}
                          activeOpacity={0.85}
                          style={styles.inlineRecCardTop}
                        >
                          <View style={styles.inlineRecImgWrap}>
                            {imageSource ? (
                              <Image source={imageSource} style={styles.inlineRecImg} resizeMode="cover" />
                            ) : (
                              <Text style={{ fontSize: 24 }}>
                                {item.category === 'hookah' ? '💨' : item.category === 'drinks' ? '🍹' : '🍔'}
                              </Text>
                            )}
                          </View>
                          <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'center' }}>
                            <Text style={[styles.inlineRecName, { color: theme.textColor }]} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={[styles.inlineRecPrice, { color: '#E5B13A' }]}>
                              ${Number(item.price).toFixed(2)}
                            </Text>
                            {item.description ? (
                              <Text style={[styles.inlineRecDesc, { color: theme.mutedTextColor }]} numberOfLines={1}>
                                {item.description}
                              </Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>

                        <View style={{ paddingHorizontal: 10, paddingBottom: 8 }}>
                          <TouchableOpacity
                            onPress={() => {
                              if (onAddToCart) onAddToCart(item, 1, []);
                            }}
                            activeOpacity={0.85}
                            style={[
                              styles.inlineRecAddBtn,
                              { backgroundColor: count > 0 ? '#10B981' : '#E5B13A' }
                            ]}
                          >
                            <Text style={[styles.inlineRecAddBtnText, { color: count > 0 ? '#FFFFFF' : '#000000' }]}>
                              {count > 0 ? `✓ IN ORDER (${count}) +` : `+ ADD TO ORDER`}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Restore banner if minimized */}
        {!isGlobalSearch && isVibeQuestEnabled && isVibeSectionDismissed && (
          <TouchableOpacity
            onPress={() => setIsVibeSectionDismissed(false)}
            activeOpacity={0.85}
            style={[styles.minimizedVibeBanner, { backgroundColor: theme.cardColor, borderColor: '#E5B13A' }]}
          >
            <Text style={{ fontSize: 16 }}>🎯</Text>
            <Text style={[styles.minimizedVibeText, { color: '#E5B13A' }]}>
              Show {currentStage.toUpperCase()} Questions →
            </Text>
          </TouchableOpacity>
        )}

        {/* Super Categories Selector Tabs */}
        {!isGlobalSearch && superCategories.length > 1 && (
          <View style={styles.supercatRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.supercatScroll}>
              {superCategories.map((sup, idx) => {
                const isActive = activeSuperCatId === sup._id;
                return (
                  <TouchableOpacity
                    key={sup._id || `sup_${idx}`}
                    activeOpacity={0.8}
                    onPress={() => handleSuperCategoryChange(sup._id)}
                    style={[
                      styles.supercatTab,
                      { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                      isActive && { backgroundColor: 'rgba(229,177,58,0.18)', borderColor: theme.secondaryColor },
                      isMobile && { paddingHorizontal: 12, paddingVertical: 7 }
                    ]}
                  >
                    <Text style={{ fontSize: isMobile ? 13 : 15, marginRight: 6 }}>{sup.icon || '🍽️'}</Text>
                    <Text style={[
                      styles.supercatText,
                      { color: isActive ? theme.secondaryColor : theme.textColor, fontWeight: isActive ? '900' : '700', fontSize: isMobile ? 11 : 12 }
                    ]}>
                      {sup.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
            const isHookahItem = item.category === 'hookah' || 
              (item.category_id && String(item.category_id).toLowerCase().includes('hookah')) ||
              item.subcategory === 'House Mixes' ||
              /cavalli crush|cavali crush|shah jahan|habibi nights|kashmiri chai|anarkali|white king|zaalim|shokha|dubai nights|dragon/i.test(item.name || '');

            if (isHookahItem) {
              return (
                <HouseMixItemCard
                  key={item.id || `item_${idx}`}
                  item={item}
                  theme={theme}
                  isMobile={isMobile}
                  cardWidth={cardWidth}
                  onAddToCart={onAddToCart}
                  count={itemQuantities[item.id] || 0}
                  onUpdateQuantity={handleUpdateItemQty}
                  onSelectItem={onSelectItem}
                />
              );
            }

            const imageSource = getItemImageSource(item);
            const isPortraitCategory = item.category === 'drinks';

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
                    <Text style={[styles.itemName, { color: theme.textColor, fontSize: isMobile ? 13 : 17 }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemPrice, { color: theme.secondaryColor, fontSize: isMobile ? 14 : 18 }]}>
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={[styles.itemDesc, { color: theme.mutedTextColor, fontSize: isMobile ? 11 : 12, minHeight: isMobile ? 26 : 32 }]} numberOfLines={2}>
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
                    const requiresChoice = itemRequiresModifierSelection(item);
                    const actionLabel = getActionLabelForItem(item);

                    return (
                      <View style={[styles.cardBtnRow, isMobile && { gap: 6, marginTop: 4 }]}>
                        {qty === 0 || requiresChoice ? (
                          <TouchableOpacity
                            onPress={(e) => handleQuickAdd(item, e)}
                            activeOpacity={0.8}
                            style={[
                              styles.quickAddBtn, 
                              { 
                                backgroundColor: requiresChoice ? 'rgba(229, 177, 58, 0.12)' : 'transparent', 
                                borderColor: requiresChoice ? '#E5B13A' : '#22C55E', 
                                borderWidth: 1.5 
                              }, 
                              isMobile && { paddingVertical: 8 }
                            ]}
                          >
                            <Plus size={isMobile ? 14 : 16} color={requiresChoice ? '#E5B13A' : '#22C55E'} />
                            <Text style={[styles.quickAddText, { color: requiresChoice ? '#E5B13A' : '#22C55E', fontSize: isMobile ? 10 : 13, fontWeight: '800' }]}>
                              {actionLabel}
                            </Text>
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

                        {item.modifierGroups && item.modifierGroups.length > 0 && !requiresChoice && (
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
        primaryText={bottomNavProps.primaryText}
        primaryIcon={bottomNavProps.primaryIcon}
        onPrimaryAction={handleBottomNavAdvance}
      />

      {/* Smart Order Reminder Modals (Dessert & Drinks) */}
      <OrderReminderModal
        visible={activeReminder === 'dessert'}
        type="dessert"
        title={dessertReminderQuestion?.question_text || dessertReminderQuestion?.title || vibeQuestConfig?.settings?.dessert_reminder_text || "Should we save room for something sweet? 🍰"}
        helperText={dessertReminderQuestion?.subtitle ?? dessertReminderQuestion?.helper_text ?? dessertReminderQuestion?.description ?? vibeQuestConfig?.settings?.dessert_reminder_subtitle}
        browseBtnText={dessertBrowseAnswer?.label || "Browse Desserts 🍰"}
        skipBtnText={dessertSkipAnswer?.label || "Skip Dessert & Continue →"}
        theme={theme}
        isMobile={isMobile}
        quickAddItems={dessertQuickAddItems}
        onBrowse={handleDessertBrowse}
        onQuickAdd={handleDessertQuickAdd}
        onSkip={handleDessertSkip}
        onClose={() => {
          setHandledReminders((prev) => new Set(prev).add('dessert'));
          setActiveReminder(null);
        }}
      />

      <OrderReminderModal
        visible={activeReminder === 'drinks'}
        type="drinks"
        title={drinkReminderQuestion?.question_text || drinkReminderQuestion?.title || vibeQuestConfig?.settings?.drink_reminder_text || "Would you like something to drink? 🥤"}
        helperText={drinkReminderQuestion?.subtitle ?? drinkReminderQuestion?.helper_text ?? drinkReminderQuestion?.description ?? vibeQuestConfig?.settings?.drink_reminder_subtitle}
        browseBtnText={drinkBrowseAnswer?.label || "Browse Drinks 🥤"}
        skipBtnText={drinkSkipAnswer?.label || "Skip Drinks & Review Order →"}
        theme={theme}
        isMobile={isMobile}
        quickAddItems={drinkQuickAddItems}
        onBrowse={handleDrinkBrowse}
        onQuickAdd={handleDrinkQuickAdd}
        onSkip={handleDrinkSkip}
        onClose={() => {
          setHandledReminders((prev) => new Set(prev).add('drinks'));
          setActiveReminder(null);
        }}
      />

      {/* Conversational Host Reply Transition Modal */}
      <HostReplyTransitionModal
        visible={!!inlineHostTransition}
        transition={inlineHostTransition}
        theme={theme}
        isMobile={isMobile}
        onDismiss={() => {
          if (inlineHostTransition?.onComplete) {
            inlineHostTransition.onComplete();
          }
          setInlineHostTransition(null);
        }}
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
  menuSuperCategorySection: {
    maxWidth: 1040,
    alignSelf: 'center',
    width: '100%',
    marginBottom: 16,
  },
  topCardsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  superTouchCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  bottomSuperCard: {
    width: '48.8%',
    alignSelf: 'center',
    marginTop: 14,
  },
  superCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  superBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  superBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  superCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  superCardSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  searchBoxRow: {
    marginBottom: 14,
    maxWidth: 1040,
    alignSelf: 'center',
    width: '100%',
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
    // @ts-ignore
    outlineStyle: 'none' as any,
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
  vibeQuestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    maxWidth: 1040,
    alignSelf: 'center',
    width: '100%',
  },
  supercatRow: {
    marginBottom: 8,
  },
  supercatScroll: {
    gap: 8,
  },
  supercatTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  supercatText: {
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
    paddingBottom: 130,
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
  curatedShelfContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  curatedShelfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  curatedShelfTitle: {
    color: '#E5B13A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  curatedShelfActionText: {
    color: '#E5B13A',
    fontSize: 11,
    fontWeight: '800',
  },
  curatedShelfScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  curatedShelfCard: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  curatedShelfCardInner: {
    flexDirection: 'column',
  },
  curatedShelfImgWrap: {
    width: '100%',
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  curatedShelfImg: {
    width: '100%',
    height: '100%',
  },
  curatedShelfName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  curatedShelfPrice: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  curatedShelfDesc: {
    fontSize: 10,
  },
  curatedShelfAddBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  curatedShelfAddBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  inlineVibeContainer: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
  },
  inlineVibeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineVibeTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  inlineVibeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  inlineVibeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  inlineVibeSub: {
    fontSize: 11,
    marginTop: 1,
  },
  inlineVibeDismissBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  inlineVibeDismissText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inlineVibeQuestionText: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
    lineHeight: 24,
  },
  inlineVibeReactionBanner: {
    backgroundColor: 'rgba(229, 177, 58, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#E5B13A',
  },
  inlineVibeReactionText: {
    color: '#E5B13A',
    fontSize: 12,
    fontWeight: '700',
  },
  inlineVibeAnswersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  inlineVibeAnswerCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  inlineVibeAnswerLabel: {
    fontSize: 13,
  },
  inlineVibeAnswerDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  inlineVibeCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5B13A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineVibeControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 12,
  },
  inlineVibeNextBtn: {
    backgroundColor: '#E5B13A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inlineVibeNextBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  inlineVibeResetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inlineVibeResetBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  inlineRecsShelf: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
    marginTop: 2,
  },
  inlineRecsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineRecsTitle: {
    color: '#E5B13A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  inlineRecsCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  inlineRecsScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  inlineRecCard: {
    width: 210,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  inlineRecCardTop: {
    flexDirection: 'column',
  },
  inlineRecImgWrap: {
    width: '100%',
    height: 96,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inlineRecImg: {
    width: '100%',
    height: '100%',
  },
  inlineRecName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  inlineRecPrice: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  inlineRecDesc: {
    fontSize: 10,
  },
  inlineRecAddBtn: {
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineRecAddBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  minimizedVibeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  minimizedVibeText: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
});
