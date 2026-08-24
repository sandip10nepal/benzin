import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Platform 
} from 'react-native';
import { 
  Bot, 
  ArrowRight, 
  ArrowLeft,
  Check, 
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  X
} from 'lucide-react-native';
import { useRestaurantTheme } from '../theme/ThemeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { BenzinHeader } from '../components/Navigation/BenzinHeader';
import { MenuItem, SelectedModifier, CartItem, ConversationStep } from '../types';
import { getItemImageSource } from '../data/menu_images';

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
  allCategories?: any[];
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
  const isMobile = layout.isMobilePhone;

  const [step, setStep] = React.useState<ConversationalStep>(
    (initialStep as ConversationalStep) || 'welcome_category'
  );

  React.useEffect(() => {
    if (initialStep) {
      setStep(initialStep as ConversationalStep);
    }
  }, [initialStep]);

  // Track if full host speech prompt overlay is visible
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

  // Track visited Super Categories
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

  // Dynamic Super Categories
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

  // Next action label and target
  const nextActionConfig = useMemo(() => {
    if (step === 'welcome_category') {
      return {
        label: 'START ORDER',
        action: () => setStep(hasHookahs ? 'select_hookah' : 'select_food')
      };
    }
    if (step === 'select_hookah') {
      const unvisited = getUnvisitedNextStep('select_hookah');
      return {
        label: unvisited === 'prompt_drink' ? 'NEXT: DRINKS' : 'NEXT: FOOD MENU',
        action: () => handleProceedToNextStep(unvisited || 'review_summary')
      };
    }
    if (step === 'select_food') {
      const unvisited = getUnvisitedNextStep('select_food');
      return {
        label: unvisited === 'prompt_drink' ? 'NEXT: DRINKS' : unvisited === 'select_hookah' ? 'NEXT: HOOKAH' : 'REVIEW ORDER',
        action: () => handleProceedToNextStep(unvisited || 'review_summary')
      };
    }
    if (step === 'select_drink') {
      const unvisited = getUnvisitedNextStep('select_drink');
      return {
        label: unvisited === 'prompt_food' ? 'NEXT: FOOD' : unvisited === 'select_hookah' ? 'NEXT: HOOKAH' : 'REVIEW ORDER',
        action: () => handleProceedToNextStep(unvisited || 'review_summary')
      };
    }
    return null;
  }, [step, visitedSuperCategorySteps, hasFood, hasDrinks, hasHookahs]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <View style={[styles.floatingToast, { backgroundColor: theme.primaryColor }]}>
          <ShoppingBag size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
          <Check size={18} color="#FFFFFF" />
        </View>
      )}

      {/* Top Header */}
      <BenzinHeader
        showBackButton
        onBack={handleStepBack}
        onOpenCart={onOpenCart}
        onOpenCallServer={onCallServer}
        onOpenHost={() => setIsSpeechOverlayVisible(true)}
        hostSpeechText={currentSpeechText}
        cartCount={cartCount}
      />

      {/* Speech Overlay Modal */}
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

      {/* Main Content Area */}
      <View style={[styles.body, isMobile && { paddingHorizontal: layout.contentPadding, paddingVertical: 8 }]}>
        
        {/* Dynamic Content Interactive Choices */}
        <View style={styles.interactiveArea}>
          {/* STEP 1: INITIAL CATEGORY CHOICE */}
          {step === 'welcome_category' && (
            <ScrollView contentContainerStyle={[styles.categoryChoicesRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
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
                    style={[
                      styles.categoryChoiceCard,
                      { backgroundColor: theme.cardColor, borderColor: cardColor },
                      isMobile && { padding: 18, width: '100%' }
                    ]}
                  >
                    <Text style={[styles.choiceIcon, isMobile && { fontSize: 36, marginBottom: 8 }]}>{superObj.icon || '📋'}</Text>
                    <Text style={[styles.choiceTitle, { color: theme.textColor }, isMobile && { fontSize: 18 }]}>{superObj.name}</Text>
                    <View style={[styles.choiceBadge, { backgroundColor: cardColor }]}>
                      <Text style={styles.choiceBadgeText}>{badgeText}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* STEP 2: SELECT HOOKAH */}
          {step === 'select_hookah' && (
            <View style={{ flex: 1 }}>
              {onOpenMixLab && (
                <TouchableOpacity
                  onPress={onOpenMixLab}
                  activeOpacity={0.88}
                  style={[styles.mixLabCtaBanner, { backgroundColor: theme.cardColor, borderColor: '#3B82F6', borderWidth: 2 }, isMobile && { paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 }]}
                >
                  <View style={styles.mixLabCtaLeft}>
                    <Text style={{ fontSize: isMobile ? 20 : 24 }}>🧪</Text>
                    <Text style={[styles.mixLabCtaTitle, { color: theme.textColor, fontSize: isMobile ? 12 : 13 }]}>
                      CREATE CUSTOM HOOKAH MIX
                    </Text>
                  </View>
                  <View style={[styles.mixLabCtaBtn, { backgroundColor: '#3B82F6', paddingVertical: 4, paddingHorizontal: 10 }]}>
                    <Text style={[styles.mixLabCtaBtnText, { fontSize: 10 }]}>MIX LAB →</Text>
                  </View>
                </TouchableOpacity>
              )}

              <ScrollView
                horizontal={!isMobile}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.cardsScrollRow, isMobile && { flexDirection: 'column', gap: 12 }]}
              >
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
                        isMobile && { width: '100%' },
                        count > 0 && { borderColor: '#10B981', borderWidth: 2.5 }
                      ]}
                    >
                      <View style={[styles.portraitImageWrapper, isMobile && { height: 160 }]}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.portraitImage} resizeMode="contain" />
                        ) : (
                          <View style={styles.productPlaceholder}>
                            <Text style={{ fontSize: isMobile ? 36 : 48 }}>💨</Text>
                          </View>
                        )}
                        {count > 0 && (
                          <View style={[styles.selectedCountBadge, { backgroundColor: '#10B981' }]}>
                            <Check size={12} color="#FFFFFF" />
                            <Text style={styles.selectedCountText}>{count} in order</Text>
                          </View>
                        )}
                      </View>

                      <View style={[styles.productBody, isMobile && { padding: 10, gap: 2 }]}>
                        <View style={styles.productTitleRow}>
                          <Text style={[styles.productName, { color: theme.textColor, fontSize: isMobile ? 14 : 17 }]} numberOfLines={1}>
                            {hookah.name}
                          </Text>
                          <Text style={[styles.productPrice, { color: theme.secondaryColor, fontSize: isMobile ? 14 : 17 }]}>
                            ${hookah.price.toFixed(2)}
                          </Text>
                        </View>

                        <Text style={[styles.productDesc, { color: theme.mutedTextColor, fontSize: isMobile ? 11 : 12, height: isMobile ? 26 : 32 }]} numberOfLines={2}>
                          {hookah.description}
                        </Text>

                        <View style={styles.cardActionsRow}>
                          {count === 0 ? (
                            <TouchableOpacity
                              onPress={() => handleItemQuantityChange(hookah, 1)}
                              activeOpacity={0.8}
                              style={[styles.multiAddBtn, { backgroundColor: 'transparent', borderColor: '#22C55E', borderWidth: 1.5, flex: 1 }, isMobile && { paddingVertical: 6 }]}
                            >
                              <Plus size={14} color="#22C55E" />
                              <Text style={[styles.multiAddBtnText, { color: '#22C55E', fontSize: 11 }]}>+ ADD TO ORDER</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.quantityStepperRow}>
                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(hookah, -1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor }]}
                              >
                                <Minus size={14} color={theme.textColor} />
                              </TouchableOpacity>

                              <View style={[styles.stepperCountBadge, { backgroundColor: '#2C2B2A' }]}>
                                <Text style={styles.stepperCountText}>{count}</Text>
                              </View>

                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(hookah, 1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: '#2C2B2A', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}
                              >
                                <Plus size={14} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
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
            <ScrollView contentContainerStyle={[styles.promptActionsRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setStep('select_food')}
                style={[styles.promptChoiceCard, { backgroundColor: theme.cardColor, borderColor: theme.primaryColor }, isMobile && { padding: 20, width: '100%' }]}
              >
                <Text style={[styles.promptIcon, isMobile && { fontSize: 36, marginBottom: 8 }]}>🍔</Text>
                <Text style={[styles.promptTitle, { color: theme.textColor }, isMobile && { fontSize: 18 }]}>YES, SHOW ME FOOD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setStep('prompt_drink')}
                style={[styles.promptChoiceCard, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }, isMobile && { padding: 20, width: '100%' }]}
              >
                <Text style={[styles.promptIcon, isMobile && { fontSize: 36, marginBottom: 8 }]}>⏩</Text>
                <Text style={[styles.promptTitle, { color: theme.textColor }, isMobile && { fontSize: 18 }]}>SKIP TO DRINKS</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 4: SELECT FOOD */}
          {step === 'select_food' && (
            <View style={{ flex: 1 }}>
              <View style={styles.subcatBar}>
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
                          isMobile && { paddingHorizontal: 12, paddingVertical: 6 }
                        ]}
                      >
                        <Text style={[
                          styles.subcatText, 
                          { color: isActive ? '#000000' : theme.textColor, fontSize: isMobile ? 11 : 13 }
                        ]}>
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <ScrollView
                horizontal={!isMobile}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.cardsScrollRow, isMobile && { flexDirection: 'column', gap: 12 }]}
              >
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
                        isMobile && { width: '100%' },
                        count > 0 && { borderColor: '#10B981', borderWidth: 2.5 }
                      ]}
                    >
                      <View style={[styles.portraitImageWrapper, isMobile && { height: 160 }]}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.portraitImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.productPlaceholder}>
                            <Text style={{ fontSize: isMobile ? 36 : 48 }}>🍔</Text>
                          </View>
                        )}
                        {count > 0 && (
                          <View style={[styles.selectedCountBadge, { backgroundColor: '#10B981' }]}>
                            <Check size={12} color="#FFFFFF" />
                            <Text style={styles.selectedCountText}>{count} in order</Text>
                          </View>
                        )}
                      </View>

                      <View style={[styles.productBody, isMobile && { padding: 10, gap: 2 }]}>
                        <View style={styles.productTitleRow}>
                          <Text style={[styles.productName, { color: theme.textColor, fontSize: isMobile ? 14 : 17 }]} numberOfLines={1}>
                            {food.name}
                          </Text>
                          <Text style={[styles.productPrice, { color: theme.secondaryColor, fontSize: isMobile ? 14 : 17 }]}>
                            ${food.price.toFixed(2)}
                          </Text>
                        </View>

                        <Text style={[styles.productDesc, { color: theme.mutedTextColor, fontSize: isMobile ? 11 : 12, height: isMobile ? 26 : 32 }]} numberOfLines={2}>
                          {food.description}
                        </Text>

                        <View style={styles.cardActionsRow}>
                          {count === 0 ? (
                            <TouchableOpacity
                              onPress={() => handleItemQuantityChange(food, 1)}
                              activeOpacity={0.8}
                              style={[styles.multiAddBtn, { backgroundColor: 'transparent', borderColor: '#22C55E', borderWidth: 1.5, flex: 1 }, isMobile && { paddingVertical: 6 }]}
                            >
                              <Plus size={14} color="#22C55E" />
                              <Text style={[styles.multiAddBtnText, { color: '#22C55E', fontSize: 11 }]}>+ ADD TO ORDER</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.quantityStepperRow}>
                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(food, -1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor }]}
                              >
                                <Minus size={14} color={theme.textColor} />
                              </TouchableOpacity>

                              <View style={[styles.stepperCountBadge, { backgroundColor: '#2C2B2A' }]}>
                                <Text style={styles.stepperCountText}>{count}</Text>
                              </View>

                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(food, 1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: '#2C2B2A', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}
                              >
                                <Plus size={14} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
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
            <ScrollView contentContainerStyle={[styles.promptActionsRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setStep('select_drink')}
                style={[styles.promptChoiceCard, { backgroundColor: theme.cardColor, borderColor: theme.primaryColor }, isMobile && { padding: 20, width: '100%' }]}
              >
                <Text style={[styles.promptIcon, isMobile && { fontSize: 36, marginBottom: 8 }]}>🍹</Text>
                <Text style={[styles.promptTitle, { color: theme.textColor }, isMobile && { fontSize: 18 }]}>YES, SHOW ME DRINKS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => handleProceedToNextStep('review_summary')}
                style={[styles.promptChoiceCard, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }, isMobile && { padding: 20, width: '100%' }]}
              >
                <Text style={[styles.promptIcon, isMobile && { fontSize: 36, marginBottom: 8 }]}>📋</Text>
                <Text style={[styles.promptTitle, { color: theme.textColor }, isMobile && { fontSize: 18 }]}>FINISH ORDER</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 6: SELECT DRINK */}
          {step === 'select_drink' && (
            <View style={{ flex: 1 }}>
              <View style={styles.subcatBar}>
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
                          isMobile && { paddingHorizontal: 12, paddingVertical: 6 }
                        ]}
                      >
                        <Text style={[
                          styles.subcatText, 
                          { color: isActive ? '#FFFFFF' : theme.textColor, fontSize: isMobile ? 11 : 13 }
                        ]}>
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <ScrollView
                horizontal={!isMobile}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.cardsScrollRow, isMobile && { flexDirection: 'column', gap: 12 }]}
              >
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
                        isMobile && { width: '100%' },
                        count > 0 && { borderColor: '#10B981', borderWidth: 2.5 }
                      ]}
                    >
                      <View style={[styles.portraitImageWrapper, isMobile && { height: 160 }]}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.portraitImage} resizeMode="contain" />
                        ) : (
                          <View style={styles.productPlaceholder}>
                            <Text style={{ fontSize: isMobile ? 36 : 48 }}>🍹</Text>
                          </View>
                        )}
                        {count > 0 && (
                          <View style={[styles.selectedCountBadge, { backgroundColor: '#10B981' }]}>
                            <Check size={12} color="#FFFFFF" />
                            <Text style={styles.selectedCountText}>{count} in order</Text>
                          </View>
                        )}
                      </View>

                      <View style={[styles.productBody, isMobile && { padding: 10, gap: 2 }]}>
                        <View style={styles.productTitleRow}>
                          <Text style={[styles.productName, { color: theme.textColor, fontSize: isMobile ? 14 : 17 }]} numberOfLines={1}>
                            {drink.name}
                          </Text>
                          <Text style={[styles.productPrice, { color: theme.secondaryColor, fontSize: isMobile ? 14 : 17 }]}>
                            ${drink.price.toFixed(2)}
                          </Text>
                        </View>

                        <Text style={[styles.productDesc, { color: theme.mutedTextColor, fontSize: isMobile ? 11 : 12, height: isMobile ? 26 : 32 }]} numberOfLines={2}>
                          {drink.description}
                        </Text>

                        <View style={styles.cardActionsRow}>
                          {count === 0 ? (
                            <TouchableOpacity
                              onPress={() => handleItemQuantityChange(drink, 1)}
                              activeOpacity={0.8}
                              style={[styles.multiAddBtn, { backgroundColor: 'transparent', borderColor: '#22C55E', borderWidth: 1.5, flex: 1 }, isMobile && { paddingVertical: 6 }]}
                            >
                              <Plus size={14} color="#22C55E" />
                              <Text style={[styles.multiAddBtnText, { color: '#22C55E', fontSize: 11 }]}>+ ADD TO ORDER</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.quantityStepperRow}>
                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(drink, -1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor }]}
                              >
                                <Minus size={14} color={theme.textColor} />
                              </TouchableOpacity>

                              <View style={[styles.stepperCountBadge, { backgroundColor: '#2C2B2A' }]}>
                                <Text style={styles.stepperCountText}>{count}</Text>
                              </View>

                              <TouchableOpacity
                                onPress={() => handleItemQuantityChange(drink, 1)}
                                activeOpacity={0.8}
                                style={[styles.stepperBtn, { backgroundColor: '#2C2B2A', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}
                              >
                                <Plus size={14} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* STEP 7: REVIEW SUMMARY */}
          {step === 'review_summary' && (
            <View style={[styles.reviewContainer, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
              <View style={[styles.reviewHeader, { borderBottomColor: theme.borderColor }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ShoppingBag size={18} color={theme.primaryColor} />
                  <Text style={[styles.reviewTitle, { color: theme.textColor, fontSize: isMobile ? 13 : 15 }]}>
                    ITEMIZED TABLE ORDER ({cartItems?.reduce((acc, i) => acc + i.quantity, 0) || 0} ITEMS)
                  </Text>
                </View>
              </View>

              <ScrollView style={styles.reviewItemsScroll} contentContainerStyle={{ paddingVertical: 8 }} showsVerticalScrollIndicator={false}>
                {(!cartItems || cartItems.length === 0) ? (
                  <View style={styles.emptyReviewBox}>
                    <Text style={{ fontSize: 32, marginBottom: 6 }}>🛒</Text>
                    <Text style={{ color: theme.textColor, fontWeight: '900', fontSize: 15 }}>Your Order is Empty</Text>
                    <Text style={{ color: theme.mutedTextColor, fontSize: 12, marginTop: 4 }}>
                      Go back to add hookahs, food, or drinks to your table order.
                    </Text>
                  </View>
                ) : (
                  cartItems.map((cartItem, idx) => {
                    const itemImage = getItemImageSource(cartItem.item);

                    return (
                      <View key={cartItem.cartItemId || `cart_${idx}`} style={[styles.reviewItemRow, { borderBottomColor: 'rgba(255,255,255,0.06)' }]}>
                        <View style={[styles.reviewThumb, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                          {itemImage ? (
                            <Image source={itemImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          ) : (
                            <Text style={{ fontSize: 18 }}>
                              {cartItem.item.category === 'hookah' ? '💨' : cartItem.item.category === 'drinks' ? '🍹' : '🍔'}
                            </Text>
                          )}
                        </View>

                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text style={[styles.reviewItemName, { color: theme.textColor, fontSize: isMobile ? 13 : 15 }]}>{cartItem.item.name}</Text>
                          <Text style={{ color: theme.secondaryColor, fontWeight: '800', fontSize: 12, marginTop: 1 }}>
                            ${cartItem.item.price.toFixed(2)} each
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <Text style={{ color: theme.textColor, fontWeight: '900', fontSize: 14 }}>
                            ${cartItem.itemTotal.toFixed(2)}
                          </Text>

                          <View style={styles.reviewStepperRow}>
                            <TouchableOpacity
                              onPress={() => onUpdateQuantity && onUpdateQuantity(cartItem.cartItemId, cartItem.quantity - 1)}
                              style={[styles.miniStepBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: theme.borderColor }]}
                            >
                              <Minus size={12} color={theme.textColor} />
                            </TouchableOpacity>

                            <Text style={{ color: theme.textColor, fontWeight: '900', fontSize: 12, paddingHorizontal: 4 }}>
                              {cartItem.quantity}
                            </Text>

                            <TouchableOpacity
                              onPress={() => onUpdateQuantity && onUpdateQuantity(cartItem.cartItemId, cartItem.quantity + 1)}
                              style={[styles.miniStepBtn, { backgroundColor: theme.primaryColor }]}
                            >
                              <Plus size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <View style={[styles.reviewFooter, { borderTopColor: theme.borderColor }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: theme.mutedTextColor, fontSize: 12, fontWeight: '700' }}>TOTAL ORDER</Text>
                  <Text style={{ color: theme.secondaryColor, fontSize: 18, fontWeight: '900' }}>${cartSubtotal.toFixed(2)}</Text>
                </View>

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
                  <ShoppingBag size={18} color="#FFFFFF" />
                  <Text style={styles.finalPlaceText}>SEND ORDER TO KITCHEN (${cartSubtotal.toFixed(2)})</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Prominent Bottom Navigation Bar (Back & High-Visibility Next Button) */}
      <View style={[styles.bottomActionBar, { backgroundColor: theme.cardColor, borderTopColor: theme.borderColor }]}>
        <TouchableOpacity
          onPress={handleStepBack}
          activeOpacity={0.8}
          style={[styles.bottomBackBtn, { borderColor: theme.borderColor }]}
        >
          <ArrowLeft size={18} color={theme.textColor} />
          <Text style={[styles.bottomBackText, { color: theme.textColor }]}>
            {currentStepIndex === 0 ? 'HOME' : 'BACK'}
          </Text>
        </TouchableOpacity>

        {nextActionConfig && step !== 'review_summary' && (
          <TouchableOpacity
            onPress={nextActionConfig.action}
            activeOpacity={0.88}
            style={[styles.prominentNextBtn, { backgroundColor: '#10B981' }]}
          >
            <Text style={styles.prominentNextText}>{nextActionConfig.label}</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
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
    bottom: 80,
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
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  hostAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  modalOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  speechOverlayPopCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    shadowColor: '#E5B13A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
  },
  speechOverlayTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  closeSpeechIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speechOverlayBodyText: {
    paddingVertical: 6,
  },
  interactiveArea: {
    flex: 1,
    maxWidth: 1320,
    alignSelf: 'center',
    width: '100%',
  },
  categoryChoicesRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 16,
  },
  categoryChoiceCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  choiceIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  choiceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  choiceBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  subcatBar: {
    marginBottom: 8,
  },
  subcatScroll: {
    gap: 8,
  },
  subcatPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  subcatText: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardsScrollRow: {
    gap: 16,
    paddingBottom: 16,
  },
  portraitProductCard: {
    width: 320,
    maxWidth: 350,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  portraitImageWrapper: {
    height: 155,
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
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  selectedCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  productBody: {
    padding: 10,
    gap: 2,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  productName: {
    fontWeight: '900',
    flex: 1,
  },
  productPrice: {
    fontWeight: '900',
  },
  productDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  multiAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 14,
  },
  multiAddBtnText: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  promptActionsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 16,
  },
  promptChoiceCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  reviewContainer: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  reviewTitle: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  reviewItemsScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reviewItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  reviewThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewItemName: {
    fontWeight: '800',
  },
  reviewStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewFooter: {
    borderTopWidth: 1,
    padding: 14,
  },
  finalPlaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  finalPlaceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  mixLabCtaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  mixLabCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mixLabCtaTitle: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mixLabCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
  },
  mixLabCtaBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  quantityStepperRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepperCountBadge: {
    flex: 1,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  emptyReviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1.5,
    gap: 12,
  },
  bottomBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  bottomBackText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  prominentNextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  prominentNextText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
