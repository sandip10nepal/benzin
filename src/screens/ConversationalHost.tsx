import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Animated,
  Platform 
} from 'react-native';
import { 
  Bot, 
  ArrowRight, 
  Check, 
  Flame, 
  Utensils, 
  Wine, 
  RotateCcw,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  X
} from 'lucide-react-native';
import { useRestaurantTheme } from '../theme/ThemeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { BenzinHeader } from '../components/Navigation/BenzinHeader';
import { BottomNavigation } from '../components/Navigation/BottomNavigation';
import { MenuItem, SelectedModifier, CartItem, ConversationStep } from '../types';
import { 
  CAVALLI_HOOKAH_ITEMS, 
  CAVALLI_FOOD_ITEMS, 
  CAVALLI_DRINK_ITEMS 
} from '../data/mockRestaurant';
import { MENU_IMAGES, getItemImageSource } from '../data/menu_images';

interface ConversationalHostProps {
  onBackToHome: () => void;
  onOpenCart: () => void;
  onCallServer: () => void;
  onOpenMixLab?: () => void;
  onSelectItem?: (item: MenuItem) => void;
  cartCount: number;
  cartSubtotal: number;
  cartItems?: CartItem[];
  onUpdateQuantity?: (cartItemId: string, newQty: number) => void;
  onRemoveItem?: (cartItemId: string) => void;
  onAddToCart: (item: MenuItem, qty: number, modifiers: SelectedModifier[], notes?: string) => void;
  onPlaceOrder: () => void;
  allCategories?: MenuCategory[];
  allMenuItems?: MenuItem[];
  initialStep?: ConversationStep;
}

type ConversationalStep =
  | 'welcome_category'
  | 'select_hookah'
  | 'prompt_food'
  | 'select_food'
  | 'prompt_drink'
  | 'select_drink'
  | 'review_summary';

export const ConversationalHost: React.FC<ConversationalHostProps> = ({
  onBackToHome,
  onOpenCart,
  onCallServer,
  onOpenMixLab,
  onSelectItem,
  cartCount,
  cartSubtotal,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onAddToCart,
  onPlaceOrder,
  allCategories = [],
  allMenuItems = [],
  initialStep = 'welcome_category',
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();
  const [step, setStep] = React.useState<ConversationalStep>(
    (initialStep as ConversationalStep) || 'welcome_category'
  );

  React.useEffect(() => {
    if (initialStep) {
      setStep(initialStep as ConversationalStep);
    }
  }, [initialStep]);

  // Track if full host speech prompt overlay is visible (only pops up when AI Host icon is clicked)
  const [isSpeechOverlayVisible, setIsSpeechOverlayVisible] = useState<boolean>(false);

  // Dynamic speech text computed for current conversational step
  const currentSpeechText = useMemo(() => {
    switch (step) {
      case 'welcome_category':
        return `Welcome to ${theme.name || 'CAVALLI'}! What would you like to start with tonight?`;
      case 'select_hookah':
        return 'Select Hookahs 💨';
      case 'prompt_food':
      case 'select_food':
        return 'Select Gourmet Food 🍔';
      case 'prompt_drink':
      case 'select_drink':
        return 'Select Craft Drinks 🍹';
      case 'review_summary':
        return `You're all set! Here is your curated order ready for Table ${theme.tableNumber}:`;
      default:
        return `Welcome to ${theme.name || 'CAVALLI'}!`;
    }
  }, [step, theme.name, theme.tableNumber]);

  // Subcategory filter states
  const [foodSubcategory, setFoodSubcategory] = useState<string>('ALL');
  const [drinkSubcategory, setDrinkSubcategory] = useState<string>('ALL');

  // Track draft quantities for multi-selection per step
  const [draftCounts, setDraftCounts] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (itemName: string) => {
    setToastMessage(` Added "${itemName}" to cart`);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const hasHookahs = useMemo(() => (allMenuItems || []).some(item => item.category === 'hookah'), [allMenuItems]);
  const hasFood = useMemo(() => (allMenuItems || []).some(item => item.category === 'food'), [allMenuItems]);
  const hasDrinks = useMemo(() => (allMenuItems || []).some(item => item.category === 'drinks'), [allMenuItems]);

  const stepOrder: ConversationalStep[] = useMemo(() => {
    if (hasHookahs) {
      return [
        'welcome_category',
        'select_hookah',
        'prompt_food',
        'select_food',
        'prompt_drink',
        'select_drink',
        'review_summary',
      ];
    }
    return [
      'welcome_category',
      'select_food',
      'prompt_drink',
      'select_drink',
      'review_summary',
    ];
  }, [hasHookahs]);

  const currentStepIndex = stepOrder.indexOf(step);

  // Track visited Super Categories to mandate visiting all sections before review/place order
  const [visitedSuperCategorySteps, setVisitedSuperCategorySteps] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (step === 'select_hookah') {
      setVisitedSuperCategorySteps(prev => new Set(prev).add('hookah'));
    } else if (step === 'select_food' || step === 'prompt_food') {
      setVisitedSuperCategorySteps(prev => new Set(prev).add('food'));
    } else if (step === 'select_drink' || step === 'prompt_drink') {
      setVisitedSuperCategorySteps(prev => new Set(prev).add('drinks'));
    }
  }, [step]);

  const getUnvisitedNextStep = (currentStep: ConversationalStep): ConversationalStep | null => {
    if (currentStep === 'select_hookah') {
      if (hasFood && !visitedSuperCategorySteps.has('food')) return 'prompt_food';
      if (hasDrinks && !visitedSuperCategorySteps.has('drinks')) return 'prompt_drink';
    } else if (currentStep === 'select_food' || currentStep === 'prompt_food') {
      if (hasDrinks && !visitedSuperCategorySteps.has('drinks')) return 'prompt_drink';
      if (hasHookahs && !visitedSuperCategorySteps.has('hookah')) return 'select_hookah';
    } else if (currentStep === 'select_drink' || currentStep === 'prompt_drink') {
      if (hasFood && !visitedSuperCategorySteps.has('food')) return 'prompt_food';
      if (hasHookahs && !visitedSuperCategorySteps.has('hookah')) return 'select_hookah';
    }
    return null;
  };

  const handleProceedToNextStep = (preferredTarget?: ConversationalStep) => {
    if (preferredTarget === 'review_summary' || !preferredTarget) {
      const nextUnvisited = getUnvisitedNextStep(step);
      if (nextUnvisited) {
        setStep(nextUnvisited);
        return;
      }
      setStep('review_summary');
      return;
    }
    setStep(preferredTarget);
  };

  const handleStepBack = () => {
    if (currentStepIndex > 0) {
      setStep(stepOrder[currentStepIndex - 1]);
    } else {
      onBackToHome();
    }
  };

  // Multi-selection & Cart sync helper
  const handleItemQuantityChange = (item: MenuItem, delta: number) => {
    const currentQty = draftCounts[item.id] || 0;
    const newQty = Math.max(0, currentQty + delta);

    setDraftCounts((prev) => ({
      ...prev,
      [item.id]: newQty,
    }));

    if (delta > 0) {
      onAddToCart(item, 1, []);
      showToast(item.name);
    } else if (delta < 0) {
      // Sync decrease/removal directly with cart order state
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

  // Dynamic Super Categories from database
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
          color: s.color || '#E5B13A',
          raw: s,
        }));
      }
    }

    // Default fallback
    return [
      { _id: 'cat_super_hookah', name: 'HOOKAH', icon: '💨', color: '#0099FF' },
      { _id: 'cat_super_food', name: 'FOOD & DINING', icon: '🍔', color: '#E5B13A' },
      { _id: 'cat_super_drinks', name: 'BEVERAGES', icon: '🍸', color: '#14B8A6' },
    ];
  }, [allCategories]);

  // Subcategories for Food
  const foodSubcategories = useMemo(() => {
    if (allCategories && allCategories.length > 0) {
      const foodSuper = allCategories.find(c => c.parent_id === null && (c.name.toLowerCase().includes('food') || c.title.toLowerCase().includes('food')));
      if (foodSuper) {
        const subs = allCategories
          .filter(c => c.parent_id === (foodSuper._id || foodSuper.id) && c.active !== false)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        if (subs.length > 0) {
          return ['ALL', ...subs.map(s => s.name || s.title)];
        }
      }
    }
    const source = (allMenuItems || []).filter(item => item.category === 'food');
    const subs = new Set<string>();
    source.forEach(f => {
      if (f.subcategory) subs.add(f.subcategory);
    });
    return ['ALL', ...Array.from(subs)];
  }, [allCategories, allMenuItems]);

  // Subcategories for Drinks
  const drinkSubcategories = useMemo(() => {
    if (allCategories && allCategories.length > 0) {
      const drinkSuper = allCategories.find(c => c.parent_id === null && (c.name.toLowerCase().includes('beverage') || c.name.toLowerCase().includes('drink') || c.title.toLowerCase().includes('beverage') || c.title.toLowerCase().includes('drink')));
      if (drinkSuper) {
        const subs = allCategories
          .filter(c => c.parent_id === (drinkSuper._id || drinkSuper.id) && c.active !== false)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        if (subs.length > 0) {
          return ['ALL', ...subs.map(s => s.name || s.title)];
        }
      }
    }
    const source = (allMenuItems || []).filter(item => item.category === 'drinks');
    const subs = new Set<string>();
    source.forEach(d => {
      if (d.subcategory) subs.add(d.subcategory);
    });
    return ['ALL', ...Array.from(subs)];
  }, [allCategories, allMenuItems]);

  const filteredFoodItems = useMemo(() => {
    const source = (allMenuItems || []).filter(item => item.category === 'food');
    if (foodSubcategory === 'ALL') return source;
    return source.filter(item => item.subcategory === foodSubcategory || item.category_id === foodSubcategory);
  }, [allMenuItems, foodSubcategory]);

  const filteredDrinkItems = useMemo(() => {
    const source = (allMenuItems || []).filter(item => item.category === 'drinks');
    if (drinkSubcategory === 'ALL') return source;
    return source.filter(item => item.subcategory === drinkSubcategory || item.category_id === drinkSubcategory);
  }, [allMenuItems, drinkSubcategory]);

  const hookahList = useMemo(() => {
    return (allMenuItems || []).filter(item => item.category === 'hookah');
  }, [allMenuItems]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Toast Notification Banner (Floating at Bottom) */}
      {toastMessage && (
        <View style={[styles.floatingToast, { backgroundColor: theme.primaryColor }]}>
          <ShoppingBag size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
          <Check size={18} color="#FFFFFF" />
        </View>
      )}

      {/* Top Header with AI Digital Host Icon */}
      <BenzinHeader
        showBackButton
        onBack={handleStepBack}
        onOpenCart={onOpenCart}
        onOpenCallServer={onCallServer}
        onOpenHost={() => setIsSpeechOverlayVisible(true)}
        hostSpeechText={currentSpeechText}
        cartCount={cartCount}
      />

      {/* Floating AI Digital Host Speech Prompt Overlay (Appears ONLY when the AI Host icon is clicked) */}
      {isSpeechOverlayVisible && (
        <View style={styles.modalOverlayContainer}>
          <TouchableOpacity 
            style={styles.modalBackdropTouch} 
            activeOpacity={1} 
            onPress={() => setIsSpeechOverlayVisible(false)} 
          />
          <View style={[styles.speechOverlayPopCard, { backgroundColor: theme.cardColor, borderColor: '#E5B13A' }]}>
            <View style={styles.speechOverlayTopHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.hostAvatar, { width: 40, height: 40, borderRadius: 20, borderColor: '#E5B13A', backgroundColor: 'rgba(74,46,27,0.5)' }]}>
                  <Bot size={22} color="#F3E5AB" />
                  <Sparkles size={9} color="#E5B13A" style={{ position: 'absolute', top: -3, right: -3 }} />
                </View>
                <View>
                  <Text style={{ color: '#E5B13A', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>
                    AI DIGITAL HOST
                  </Text>
                  <Text style={{ color: theme.mutedTextColor, fontSize: 11 }}>
                    Guided Order Speech Prompt
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setIsSpeechOverlayVisible(false)} 
                activeOpacity={0.8}
                style={[styles.closeSpeechIconBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
              >
                <X size={18} color={theme.textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.speechOverlayBodyText}>
              <Text style={[styles.questionText, { color: theme.textColor }]}>
                {currentSpeechText}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Main Conversational Host Area (Cards Pushed All The Way Up for Maximum Space) */}
      <View style={styles.body}>
        {/* Dynamic Content Interactive Choices */}
        <View style={styles.interactiveArea}>
          {/* STEP 1: INITIAL CATEGORY CHOICE */}
          {step === 'welcome_category' && (
            <View style={styles.categoryChoicesRow}>
              {superCategories.map((superObj) => {
                const superName = superObj.name.toLowerCase();
                let targetStep: ConversationalStep = 'select_food';
                let cardColor = superObj.color || '#E5B13A';
                let badgeText = 'GOURMET';

                if (superName.includes('hookah')) {
                  targetStep = 'select_hookah';
                  cardColor = '#0099FF';
                  badgeText = 'POPULAR';
                } else if (superName.includes('beverage') || superName.includes('drink')) {
                  targetStep = 'select_drink';
                  cardColor = '#14B8A6';
                  badgeText = 'REFRESHING';
                }

                return (
                  <TouchableOpacity
                    key={superObj._id}
                    activeOpacity={0.88}
                    onPress={() => setStep(targetStep)}
                    style={[styles.categoryChoiceCard, { backgroundColor: theme.cardColor, borderColor: cardColor }]}
                  >
                    <Text style={styles.choiceIcon}>{superObj.icon || '📋'}</Text>
                    <Text style={[styles.choiceTitle, { color: theme.textColor }]}>{superObj.name}</Text>
                    <View style={[styles.choiceBadge, { backgroundColor: cardColor }]}>
                      <Text style={styles.choiceBadgeText}>{badgeText}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* STEP 2: SELECT HOOKAH (MULTI-SELECTION ALLOWED & MIX LAB CTA) */}
          {step === 'select_hookah' && (
            <View style={{ flex: 1 }}>
              {/* Header Control Row: Mix Lab & View Order Pill */}
              <View style={styles.topControlHeaderRow}>
                {onOpenMixLab && (
                  <TouchableOpacity
                    onPress={onOpenMixLab}
                    activeOpacity={0.88}
                    style={[styles.mixLabCtaBanner, { backgroundColor: theme.cardColor, borderColor: '#3B82F6', borderWidth: 2, flex: 1, marginBottom: 0 }]}
                  >
                    <View style={styles.mixLabCtaLeft}>
                      <Text style={{ fontSize: 24 }}>🧪</Text>
                      <View>
                        <Text style={[styles.mixLabCtaTitle, { color: theme.textColor, fontSize: 13 }]}>
                          CREATE CUSTOM HOOKAH MIX
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.mixLabCtaBtn, { backgroundColor: '#3B82F6', paddingVertical: 6, paddingHorizontal: 12 }]}>
                      <Text style={[styles.mixLabCtaBtnText, { fontSize: 10 }]}>MIX LAB</Text>
                      <ArrowRight size={14} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                )}

              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScrollRow}>
                {hookahList.map((hookah, idx) => {
                  const imageSource = getItemImageSource(hookah);
                  const count = draftCounts[hookah.id] || 0;

                  return (
                    <TouchableOpacity
                      key={hookah.id || `hookah_${idx}`}
                      activeOpacity={0.88}
                      onPress={() => onSelectItem ? onSelectItem(hookah) : handleItemQuantityChange(hookah, 1)}
                      style={[
                        styles.portraitProductCard,
                        { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                        count > 0 && { borderColor: '#10B981', borderWidth: 2.5 }
                      ]}
                    >
                      {/* Portrait Image View for Full Aspect Ratio */}
                      <View style={styles.portraitImageWrapper}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.portraitImage} resizeMode="contain" />
                        ) : (
                          <View style={styles.productPlaceholder}>
                            <Text style={{ fontSize: 48 }}>💨</Text>
                          </View>
                        )}
                        {count > 0 && (
                          <View style={[styles.selectedCountBadge, { backgroundColor: '#10B981' }]}>
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.selectedCountText}>{count} in order</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.productBody}>
                        <View style={styles.productTitleRow}>
                          <Text style={[styles.productName, { color: theme.textColor }]} numberOfLines={2}>
                            {hookah.name}
                          </Text>
                          <Text style={[styles.productPrice, { color: theme.secondaryColor }]}>
                            ${hookah.price.toFixed(2)}
                          </Text>
                        </View>

                        <Text style={[styles.productDesc, { color: theme.mutedTextColor }]} numberOfLines={2}>
                          {hookah.description}
                        </Text>

                        {/* Action Buttons: Add & Stepper */}
                        <View style={styles.cardActionsRow}>
                          {count === 0 ? (
                            <TouchableOpacity
                              onPress={() => handleItemQuantityChange(hookah, 1)}
                              activeOpacity={0.8}
                              style={[styles.multiAddBtn, { backgroundColor: 'transparent', borderColor: '#22C55E', borderWidth: 1.5, flex: 1 }]}
                            >
                              <Plus size={16} color="#22C55E" />
                              <Text style={[styles.multiAddBtnText, { color: '#22C55E' }]}>+ ADD</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.quantityStepperRow}>
                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(hookah, -1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor }]}
                              >
                                <Minus size={15} color={theme.textColor} />
                              </TouchableOpacity>

                              <View style={[styles.stepperCountBadge, { backgroundColor: '#2C2B2A' }]}>
                                <Text style={styles.stepperCountText}>{count}</Text>
                              </View>

                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(hookah, 1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: '#2C2B2A', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}
                              >
                                <Plus size={15} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          )}

                          {onSelectItem && (
                            <TouchableOpacity
                              onPress={() => onSelectItem(hookah)}
                              activeOpacity={0.8}
                              style={[styles.customizeBtn, { borderColor: '#E5B13A', borderWidth: 1.5 }]}
                            >
                              <Text style={[styles.customizeBtnText, { color: '#E5B13A' }]}>DETAILS</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* STEP 3: PROMPT FOOD */}
          {step === 'prompt_food' && (
            <View style={styles.promptActionsRow}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setStep('select_food')}
                style={[styles.promptChoiceCard, { backgroundColor: theme.cardColor, borderColor: theme.primaryColor }]}
              >
                <Text style={styles.promptIcon}>🍔</Text>
                <Text style={[styles.promptTitle, { color: theme.textColor }]}>YES, SHOW ME FOOD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setStep('prompt_drink')}
                style={[styles.promptChoiceCard, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}
              >
                <Text style={styles.promptIcon}>⏩</Text>
                <Text style={[styles.promptTitle, { color: theme.textColor }]}>SKIP TO DRINKS</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: SELECT FOOD (WITH SUBCATEGORY NAVIGATION) */}
          {step === 'select_food' && (
            <View style={{ flex: 1 }}>
              {/* Subcategories Bar + View Order Pill */}
              <View style={styles.topControlHeaderRow}>
                <View style={[styles.subcatBar, { flex: 1, marginBottom: 0 }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcatScroll}>
                    {foodSubcategories.map((sub, idx) => {
                      const isActive = foodSubcategory === sub;
                      return (
                        <TouchableOpacity
                          key={sub || `food_sub_${idx}`}
                          activeOpacity={0.8}
                          onPress={() => setFoodSubcategory(sub)}
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
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

              </View>

              {/* Cards Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScrollRow}>
                {filteredFoodItems.map((food, idx) => {
                  const imageSource = getItemImageSource(food);
                  const count = draftCounts[food.id] || 0;

                  return (
                    <TouchableOpacity
                      key={food.id || `food_${idx}`}
                      activeOpacity={0.88}
                      onPress={() => onSelectItem ? onSelectItem(food) : handleItemQuantityChange(food, 1)}
                      style={[
                        styles.portraitProductCard,
                        { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                        count > 0 && { borderColor: '#10B981', borderWidth: 2.5 }
                      ]}
                    >
                      {/* Portrait Image */}
                      <View style={styles.portraitImageWrapper}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.portraitImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.productPlaceholder}>
                            <Text style={{ fontSize: 48 }}>🍔</Text>
                          </View>
                        )}
                        {count > 0 && (
                          <View style={[styles.selectedCountBadge, { backgroundColor: '#10B981' }]}>
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.selectedCountText}>{count} in order</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.productBody}>
                        <View style={styles.productTitleRow}>
                          <Text style={[styles.productName, { color: theme.textColor }]} numberOfLines={2}>
                            {food.name}
                          </Text>
                          <Text style={[styles.productPrice, { color: theme.secondaryColor }]}>
                            ${food.price.toFixed(2)}
                          </Text>
                        </View>

                        <Text style={[styles.productDesc, { color: theme.mutedTextColor }]} numberOfLines={2}>
                          {food.description}
                        </Text>

                        {/* Action Buttons: Add & Stepper */}
                        <View style={styles.cardActionsRow}>
                          {count === 0 ? (
                            <TouchableOpacity
                              onPress={() => handleItemQuantityChange(food, 1)}
                              activeOpacity={0.8}
                              style={[styles.multiAddBtn, { backgroundColor: 'transparent', borderColor: '#22C55E', borderWidth: 1.5, flex: 1 }]}
                            >
                              <Plus size={16} color="#22C55E" />
                              <Text style={[styles.multiAddBtnText, { color: '#22C55E' }]}>+ ADD</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.quantityStepperRow}>
                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(food, -1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor }]}
                              >
                                <Minus size={15} color={theme.textColor} />
                              </TouchableOpacity>

                              <View style={[styles.stepperCountBadge, { backgroundColor: '#2C2B2A' }]}>
                                <Text style={styles.stepperCountText}>{count}</Text>
                              </View>

                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(food, 1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: '#2C2B2A', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}
                              >
                                <Plus size={15} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          )}

                          {onSelectItem && (
                            <TouchableOpacity
                              onPress={() => onSelectItem(food)}
                              activeOpacity={0.8}
                              style={[styles.customizeBtn, { borderColor: '#E5B13A', borderWidth: 1.5 }]}
                            >
                              <Text style={[styles.customizeBtnText, { color: '#E5B13A' }]}>DETAILS</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* STEP 5: PROMPT DRINKS */}
          {step === 'prompt_drink' && (
            <View style={styles.promptActionsRow}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setStep('select_drink')}
                style={[styles.promptChoiceCard, { backgroundColor: theme.cardColor, borderColor: theme.primaryColor }]}
              >
                <Text style={styles.promptIcon}>🍹</Text>
                <Text style={[styles.promptTitle, { color: theme.textColor }]}>YES, SHOW ME DRINKS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => handleProceedToNextStep('review_summary')}
                style={[styles.promptChoiceCard, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}
              >
                <Text style={styles.promptIcon}>📋</Text>
                <Text style={[styles.promptTitle, { color: theme.textColor }]}>FINISH ORDER</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 6: SELECT DRINK */}
          {step === 'select_drink' && (
            <View style={{ flex: 1 }}>
              {/* Subcategories Bar + View Order Pill */}
              <View style={styles.topControlHeaderRow}>
                <View style={[styles.subcatBar, { flex: 1, marginBottom: 0 }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcatScroll}>
                    {drinkSubcategories.map((sub, idx) => {
                      const isActive = drinkSubcategory === sub;
                      return (
                        <TouchableOpacity
                          key={sub || `drink_sub_${idx}`}
                          activeOpacity={0.8}
                          onPress={() => setDrinkSubcategory(sub)}
                          style={[
                            styles.subcatPill,
                            { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                            isActive && { backgroundColor: theme.accentColor, borderColor: theme.accentColor },
                          ]}
                        >
                          <Text style={[
                            styles.subcatText, 
                            { color: isActive ? '#FFFFFF' : theme.textColor }
                          ]}>
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

              </View>

              {/* Cards Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScrollRow}>
                {filteredDrinkItems.map((drink, idx) => {
                  const imageSource = getItemImageSource(drink);
                  const count = draftCounts[drink.id] || 0;

                  return (
                    <TouchableOpacity
                      key={drink.id || `drink_${idx}`}
                      activeOpacity={0.88}
                      onPress={() => onSelectItem ? onSelectItem(drink) : handleItemQuantityChange(drink, 1)}
                      style={[
                        styles.portraitProductCard,
                        { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                        count > 0 && { borderColor: '#10B981', borderWidth: 2.5 }
                      ]}
                    >
                      {/* Portrait Image Container */}
                      <View style={styles.portraitImageWrapper}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.portraitImage} resizeMode="contain" />
                        ) : (
                          <View style={styles.productPlaceholder}>
                            <Text style={{ fontSize: 48 }}>🍹</Text>
                          </View>
                        )}
                        {count > 0 && (
                          <View style={[styles.selectedCountBadge, { backgroundColor: '#10B981' }]}>
                            <Check size={14} color="#FFFFFF" />
                            <Text style={styles.selectedCountText}>{count} in order</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.productBody}>
                        <View style={styles.productTitleRow}>
                          <Text style={[styles.productName, { color: theme.textColor }]} numberOfLines={2}>
                            {drink.name}
                          </Text>
                          <Text style={[styles.productPrice, { color: theme.secondaryColor }]}>
                            ${drink.price.toFixed(2)}
                          </Text>
                        </View>

                        <Text style={[styles.productDesc, { color: theme.mutedTextColor }]} numberOfLines={2}>
                          {drink.description}
                        </Text>

                        {/* Action Buttons: Add & Stepper */}
                        <View style={styles.cardActionsRow}>
                          {count === 0 ? (
                            <TouchableOpacity
                              onPress={() => handleItemQuantityChange(drink, 1)}
                              activeOpacity={0.8}
                              style={[styles.multiAddBtn, { backgroundColor: 'transparent', borderColor: '#22C55E', borderWidth: 1.5, flex: 1 }]}
                            >
                              <Plus size={16} color="#22C55E" />
                              <Text style={[styles.multiAddBtnText, { color: '#22C55E' }]}>+ ADD</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.quantityStepperRow}>
                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(drink, -1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor }]}
                              >
                                <Minus size={15} color={theme.textColor} />
                              </TouchableOpacity>

                              <View style={[styles.stepperCountBadge, { backgroundColor: '#2C2B2A' }]}>
                                <Text style={styles.stepperCountText}>{count}</Text>
                              </View>

                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(drink, 1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: '#2C2B2A', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}
                              >
                                <Plus size={15} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          )}

                          {onSelectItem && (
                            <TouchableOpacity
                              onPress={() => onSelectItem(drink)}
                              activeOpacity={0.8}
                              style={[styles.customizeBtn, { borderColor: '#E5B13A', borderWidth: 1.5 }]}
                            >
                              <Text style={[styles.customizeBtnText, { color: '#E5B13A' }]}>DETAILS</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* STEP 7: REVIEW SUMMARY (FULL ITEMIZED ORDER REVIEW LIST) */}
          {step === 'review_summary' && (
            <View style={[styles.reviewContainer, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
              {/* Header Bar */}
              <View style={[styles.reviewHeader, { borderBottomColor: theme.borderColor }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ShoppingBag size={22} color={theme.primaryColor} />
                  <Text style={[styles.reviewTitle, { color: theme.textColor }]}>
                    ITEMIZED TABLE ORDER ({cartItems?.reduce((acc, i) => acc + i.quantity, 0) || 0} ITEMS)
                  </Text>
                </View>
                <Text style={{ color: theme.secondaryColor, fontWeight: '900', fontSize: 14 }}>
                  TABLE {theme.tableNumber}
                </Text>
              </View>

              {/* Itemized Cart Items Scroll List */}
              <ScrollView style={styles.reviewItemsScroll} contentContainerStyle={{ paddingVertical: 8 }} showsVerticalScrollIndicator={false}>
                {(!cartItems || cartItems.length === 0) ? (
                  <View style={styles.emptyReviewBox}>
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>🛒</Text>
                    <Text style={{ color: theme.textColor, fontWeight: '900', fontSize: 16 }}>Your Order is Empty</Text>
                    <Text style={{ color: theme.mutedTextColor, fontSize: 12, marginTop: 4 }}>
                      Go back to add hookahs, food, or drinks to your table order.
                    </Text>
                  </View>
                ) : (
                  cartItems.map((cartItem, idx) => {
                    const itemImage = getItemImageSource(cartItem.item);

                    return (
                      <View key={cartItem.cartItemId || `cart_${idx}`} style={[styles.reviewItemRow, { borderBottomColor: 'rgba(255,255,255,0.06)' }]}>
                        {/* Thumbnail */}
                        <View style={[styles.reviewThumb, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                          {itemImage ? (
                            <Image source={itemImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          ) : (
                            <Text style={{ fontSize: 20 }}>
                              {cartItem.item.category === 'hookah' ? '💨' : cartItem.item.category === 'drinks' ? '🍹' : '🍔'}
                            </Text>
                          )}
                        </View>

                        {/* Details */}
                        <View style={{ flex: 1, marginHorizontal: 12 }}>
                          <Text style={[styles.reviewItemName, { color: theme.textColor }]}>{cartItem.item.name}</Text>
                          <Text style={{ color: theme.secondaryColor, fontWeight: '800', fontSize: 13, marginTop: 2 }}>
                            ${cartItem.item.price.toFixed(2)} each
                          </Text>
                          
                          {cartItem.selectedModifiers && cartItem.selectedModifiers.length > 0 && (
                            <Text style={{ color: theme.mutedTextColor, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                              {cartItem.selectedModifiers.map(m => m.optionName).join(', ')}
                            </Text>
                          )}
                          
                          {cartItem.specialInstructions ? (
                            <Text style={{ color: theme.accentColor, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                              Note: {cartItem.specialInstructions}
                            </Text>
                          ) : null}
                        </View>

                        {/* Quantity Stepper & Subtotal */}
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <Text style={{ color: theme.textColor, fontWeight: '900', fontSize: 15 }}>
                            ${cartItem.itemTotal.toFixed(2)}
                          </Text>

                          <View style={styles.reviewStepperRow}>
                            <TouchableOpacity
                              onPress={() => onUpdateQuantity && onUpdateQuantity(cartItem.cartItemId, cartItem.quantity - 1)}
                              style={[styles.miniStepBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor }]}
                            >
                              <Minus size={12} color={theme.textColor} />
                            </TouchableOpacity>

                            <Text style={{ color: theme.textColor, fontWeight: '900', fontSize: 12, paddingHorizontal: 6 }}>
                              {cartItem.quantity}
                            </Text>

                            <TouchableOpacity
                              onPress={() => onUpdateQuantity && onUpdateQuantity(cartItem.cartItemId, cartItem.quantity + 1)}
                              style={[styles.miniStepBtn, { backgroundColor: theme.primaryColor }]}
                            >
                              <Plus size={12} color="#FFFFFF" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => onRemoveItem && onRemoveItem(cartItem.cartItemId)}
                              style={{ marginLeft: 6, padding: 4 }}
                            >
                              <Trash2 size={15} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Order Total Footer & Place Order Button */}
              <View style={[styles.reviewFooter, { borderTopColor: theme.borderColor }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: theme.mutedTextColor, fontSize: 13, fontWeight: '700' }}>TOTAL ORDER SUB-TOTAL</Text>
                  <Text style={{ color: theme.secondaryColor, fontSize: 22, fontWeight: '900' }}>${cartSubtotal.toFixed(2)}</Text>
                </View>

                <View style={styles.finalActionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setDraftCounts({});
                      onPlaceOrder();
                    }}
                    disabled={!cartItems || cartItems.length === 0}
                    activeOpacity={0.88}
                    style={[
                      styles.finalPlaceBtn, 
                      { backgroundColor: theme.primaryColor },
                      (!cartItems || cartItems.length === 0) && { opacity: 0.4 }
                    ]}
                  >
                    <ShoppingBag size={22} color="#FFFFFF" />
                    <Text style={styles.finalPlaceText}>PLACE TABLE ORDER NOW (${cartSubtotal.toFixed(2)})</Text>
                    <ArrowRight size={22} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setStep('welcome_category')}
                    activeOpacity={0.8}
                    style={[styles.startOverBtn, { borderColor: theme.borderColor }]}
                  >
                    <RotateCcw size={16} color={theme.textColor} />
                    <Text style={[styles.startOverText, { color: theme.textColor }]}>ADD MORE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Dynamic Persistent Bottom Navigation Bar */}
      {(() => {
        let bottomAction = onOpenCart;
        let bottomText = 'REVIEW ORDER';
        let bottomIcon: 'next' | 'check' | 'cart' = 'cart';

        if (step === 'welcome_category') {
          bottomText = 'START ORDER';
          bottomAction = () => setStep(hasHookahs ? 'select_hookah' : 'select_food');
          bottomIcon = 'next';
        } else if (step === 'select_hookah') {
          const unvisited = getUnvisitedNextStep('select_hookah');
          bottomText = unvisited === 'prompt_drink' ? 'NEXT: DRINK SELECTION' : 'NEXT: FOOD SELECTION';
          bottomAction = () => handleProceedToNextStep(unvisited || 'review_summary');
          bottomIcon = 'next';
        } else if (step === 'prompt_food') {
          bottomText = 'YES, SHOW ME FOOD';
          bottomAction = () => setStep('select_food');
          bottomIcon = 'next';
        } else if (step === 'select_food') {
          const unvisited = getUnvisitedNextStep('select_food');
          bottomText = unvisited === 'prompt_drink' ? 'NEXT: DRINK SELECTION' : unvisited === 'select_hookah' ? 'NEXT: HOOKAH SELECTION' : 'NEXT: REVIEW ORDER';
          bottomAction = () => handleProceedToNextStep(unvisited || 'review_summary');
          bottomIcon = 'next';
        } else if (step === 'prompt_drink') {
          bottomText = 'YES, SHOW ME DRINKS';
          bottomAction = () => setStep('select_drink');
          bottomIcon = 'next';
        } else if (step === 'select_drink') {
          const unvisited = getUnvisitedNextStep('select_drink');
          bottomText = unvisited === 'prompt_food' ? 'NEXT: FOOD SELECTION' : unvisited === 'select_hookah' ? 'NEXT: HOOKAH SELECTION' : 'NEXT: REVIEW ORDER';
          bottomAction = () => handleProceedToNextStep(unvisited || 'review_summary');
          bottomIcon = 'next';
        } else if (step === 'review_summary') {
          bottomText = 'PLACE TABLE ORDER';
          bottomAction = onPlaceOrder;
          bottomIcon = 'check';
        }

        return (
          <BottomNavigation
            onBack={handleStepBack}
            backText={currentStepIndex === 0 ? 'HOME' : 'BACK'}
            stepDotsCount={stepOrder.length}
            activeStepIndex={currentStepIndex}
            onPrimaryAction={bottomAction}
            primaryText={bottomText}
            primaryIcon={bottomIcon}
            totalCartSubtotal={cartSubtotal}
          />
        );
      })()}
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
  body: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  hostBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 10,
  },
  hostAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogueBox: {
    flex: 1,
  },
  hostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  hostPillText: {
    color: '#0099FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  modalOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  speechOverlayPopCard: {
    width: '100%',
    maxWidth: 540,
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    shadowColor: '#E5B13A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
  },
  speechOverlayTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  closeSpeechIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speechOverlayBodyText: {
    paddingVertical: 8,
  },
  topControlHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  nextTopHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  nextTopHeaderPillText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  nextSectionScrollCard: {
    width: 220,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'transparent',
  },
  nextCardTitleText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  interactiveArea: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 4,
  },
  categoryChoicesRow: {
    flexDirection: 'row',
    gap: 20,
  },
  categoryChoiceCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  choiceIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  choiceTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  choiceSub: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  choiceBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  choiceBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subcatBar: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  subcatScroll: {
    gap: 10,
  },
  subcatPill: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  subcatText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cardsScrollRow: {
    gap: 20,
    paddingVertical: 6,
  },
  portraitProductCard: {
    width: 365,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  portraitImageWrapper: {
    height: 310, // Bigger image presentation
    width: '100%',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  productPlaceholder: {
    width: '100%',
    height: 310,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 13,
  },
  selectedCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  productBody: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 3,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  productName: {
    fontSize: 17,
    fontWeight: '900',
    flex: 1,
    lineHeight: 22,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '900',
  },
  productDesc: {
    fontSize: 12,
    lineHeight: 16,
    height: 32,
    marginTop: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  multiAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 17,
  },
  multiAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  customizeBtn: {
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customizeBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stepNextBar: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  nextSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
  },
  nextSectionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  promptActionsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  promptChoiceCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 2,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptIcon: {
    fontSize: 54,
    marginBottom: 12,
  },
  promptTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  promptSub: {
    color: '#D6C7BC',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryBox: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0,153,255,0.06)',
    borderWidth: 1.5,
    borderColor: '#0099FF',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  summarySub: {
    fontSize: 13,
    marginBottom: 20,
  },
  finalActionsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  finalPlaceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 20,
  },
  finalPlaceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  startOverBtn: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startOverText: {
    fontSize: 13,
    fontWeight: '800',
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
    marginBottom: 12,
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
  mixLabCtaSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  mixLabCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  quantityStepperRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepperCountBadge: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  reviewContainer: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  reviewItemsScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  reviewItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reviewThumb: {
    width: 50,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewItemName: {
    fontSize: 15,
    fontWeight: '900',
  },
  reviewStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  miniStepBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  reviewFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  emptyReviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
