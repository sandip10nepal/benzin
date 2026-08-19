import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ScreenState, 
  MenuItem, 
  CartItem, 
  SelectedModifier, 
  ServerRequestStatus, 
  ServerRequestType,
  ConversationStep 
} from '../types';
import { CAVALLI_HOOKAH_ITEMS, CAVALLI_FOOD_ITEMS, CAVALLI_DRINK_ITEMS } from '../data/mockRestaurant';
import { TenantApiService, STORAGE_KEYS } from '../services/api';

export function useBenzinState() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('splash');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeItemForDetail, setActiveItemForDetail] = useState<MenuItem | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isCallServerModalOpen, setIsCallServerModalOpen] = useState<boolean>(false);
  const [isMixLabOpen, setIsMixLabOpen] = useState<boolean>(false);
  const [activeServerRequest, setActiveServerRequest] = useState<ServerRequestStatus | null>(null);
  const [conversationStep, setConversationStep] = useState<ConversationStep>('welcome_category');
  
  const [draftHookah, setDraftHookah] = useState<MenuItem | null>(null);
  const [draftFood, setDraftFood] = useState<MenuItem | null>(null);
  const [draftDrink, setDraftDrink] = useState<MenuItem | null>(null);
  const [liveMenuItems, setLiveMenuItems] = useState<MenuItem[]>([]);
  const [pairedSlug, setPairedSlug] = useState<string | null>(null);
  const [pairedTableNumber, setPairedTableNumber] = useState<string>('1');
  const [customerName, setCustomerName] = useState<string>('Guest');

  const loadLiveMenu = useCallback(async () => {
    try {
      const storedRestId = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_ID);
      const storedSlug = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_SLUG);
      const storedTable = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER);
      const storedName = await AsyncStorage.getItem('@saas_customer_name');
      setPairedSlug(storedSlug);
      if (storedTable) setPairedTableNumber(storedTable);
      if (storedName) setCustomerName(storedName);

      let config = null;
      if (storedRestId) {
        config = await TenantApiService.fetchRestaurantConfig(storedRestId);
      } else if (storedSlug) {
        config = await TenantApiService.fetchConfigBySlug(storedSlug);
      } else {
        config = await TenantApiService.fetchConfigBySlug('cavali');
      }

      if (config && Array.isArray(config.menu_items)) {
        const catMap = new Map((config.categories || []).map((c: any) => [c.id || c._id, c.title || c.name]));

        const mapped: MenuItem[] = config.menu_items.map((i: any, index: number) => {
          const itemId = i.id || i._id || `item_${index}_${Date.now()}`;
          const rawCatTitle = (catMap.get(i.category_id) || i.category_id || '').toString();
          const catLower = rawCatTitle.toLowerCase();
          const catIdUpper = (i.category_id || '').toString().toUpperCase();

          let cat: 'hookah' | 'food' | 'drinks' = 'food';
          if (catLower.includes('hookah') || catIdUpper.includes('HOOKAH')) {
            cat = 'hookah';
          } else if (catLower.includes('beverage') || catLower.includes('drink') || catIdUpper.includes('BEVERAGE') || catIdUpper.includes('DRINK')) {
            cat = 'drinks';
          }

          // Determine readable subcategory name
          let subcategory = rawCatTitle;
          if (cat === 'drinks') {
            const nameLower = (i.name + ' ' + (i.desc || '')).toLowerCase();
            if (nameLower.includes('mojito') || nameLower.includes('margarita') || nameLower.includes('colada') || nameLower.includes('refresher') || nameLower.includes('mocktail') || nameLower.includes('melon') || nameLower.includes('ocean') || nameLower.includes('red affair') || nameLower.includes('juice') || nameLower.includes('shake') || nameLower.includes('lassi')) {
              subcategory = 'Refreshers & Mocktails';
            } else if (nameLower.includes('chai') || nameLower.includes('tea') || nameLower.includes('coffee') || nameLower.includes('latte') || nameLower.includes('espresso') || nameLower.includes('cappuccino')) {
              subcategory = 'Tea & Coffee';
            } else {
              subcategory = 'Soft Drinks & Sodas';
            }
          }

          return {
            id: itemId,
            name: i.name,
            price: i.price,
            description: i.desc || i.description || '',
            category: cat,
            subcategory,
            imageUrl: i.image_url || undefined,
            imageKey: i.image_url ? undefined : (itemId.replace(/^MI_/, '').replace(/_\d+$/, '')),
            modifierGroups: i.modifier_groups || []
          };
        });

        setLiveMenuItems(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch live menu config in mobile app:', err);
    }
  }, []);

  useEffect(() => {
    loadLiveMenu();

    // Auto-sync menu prices and availability with backend every 4 seconds
    const intervalId = setInterval(() => {
      loadLiveMenu();
    }, 4000);

    return () => clearInterval(intervalId);
  }, [loadLiveMenu]);

  const allMenuItems = useMemo(() => {
    if (liveMenuItems.length > 0) return liveMenuItems;
    // If a specific non-Cavali restaurant is paired (e.g. Vindu), do NOT leak Cavali items
    if (pairedSlug && pairedSlug !== 'cavali') {
      return liveMenuItems;
    }
    return [
      ...CAVALLI_HOOKAH_ITEMS,
      ...CAVALLI_FOOD_ITEMS,
      ...CAVALLI_DRINK_ITEMS,
    ];
  }, [liveMenuItems, pairedSlug]);

  const navigate = useCallback((screen: ScreenState) => {
    setCurrentScreen(screen);
  }, []);

  const addToCart = useCallback((
    item: MenuItem, 
    quantity: number = 1, 
    selectedModifiers: SelectedModifier[] = [],
    specialInstructions: string = ''
  ) => {
    const modifierTotal = selectedModifiers.reduce((acc, m) => acc + m.price, 0);
    const itemTotal = (item.price + modifierTotal) * quantity;
    const cartItemId = `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newCartItem: CartItem = {
      cartItemId,
      item,
      quantity,
      selectedModifiers,
      specialInstructions,
      itemTotal,
    };

    setCart((prev) => [...prev, newCartItem]);
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((ci) => {
        if (ci.cartItemId === cartItemId) {
          const unitPrice = ci.itemTotal / ci.quantity;
          return {
            ...ci,
            quantity: newQty,
            itemTotal: unitPrice * newQty,
          };
        }
        return ci;
      })
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.itemTotal, 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    return cartSubtotal * 0.0825; // 8.25% tax placeholder
  }, [cartSubtotal]);

  const cartTotal = useMemo(() => {
    return cartSubtotal + cartTax;
  }, [cartSubtotal, cartTax]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const requestServer = useCallback((type: ServerRequestType, customNote?: string) => {
    const labels: Record<ServerRequestType, string> = {
      server: 'Request Server Assistance',
      water: 'Water & Ice Refresh',
      coals: 'Hookah Coal Refill',
      utensils: 'Plates & Utensils',
      check: 'Request Check / Bill',
      custom: customNote || 'Custom Request',
    };

    setActiveServerRequest({
      id: `sr-${Date.now()}`,
      type,
      label: labels[type],
      requestedAt: new Date(),
      customNote,
      status: 'pending',
    });
    setIsCallServerModalOpen(true);
    TenantApiService.requestServer({ 
      table: `Table ${pairedTableNumber || '1'}`, 
      requestType: type, 
      note: customNote,
      customerName: customerName || `Guest (Table ${pairedTableNumber || '1'})`
    });
  }, [pairedTableNumber, customerName]);

  const cancelServerRequest = useCallback(() => {
    setActiveServerRequest(null);
  }, []);

  const placeOrder = useCallback(() => {
    if (cart.length === 0) return;

    // Build rich order payload for backend & KDS Admin Dashboard
    const itemsList = cart.map(i => {
      const itemEmoji = (i.item as any).emoji || (i.item.category === 'hookah' ? '💨' : i.item.category === 'drinks' ? '🥤' : '🍔');
      return {
        id: i.item.id,
        name: i.item.name,
        price: i.item.price,
        emoji: itemEmoji,
        qty: i.quantity,
        modifiers: i.selectedModifiers,
        notes: i.specialInstructions
      };
    });

    const hookahs = cart.filter(i => i.item.category === 'hookah').map(i => ({
      flavor: { name: i.item.name, id: i.item.id },
      notes: [i.specialInstructions, ...i.selectedModifiers.map(m => m.optionName)].filter(Boolean).join(' · ')
    }));
    const food = cart.filter(i => i.item.category === 'food').map(i => ({
      item: { name: i.item.name, price: i.item.price, emoji: (i.item as any).emoji || '🍔' },
      qty: i.quantity,
      note: i.specialInstructions
    }));
    const drinks = cart.filter(i => i.item.category === 'drinks').map(i => ({
      item: { name: i.item.name, price: i.item.price, emoji: (i.item as any).emoji || '🥤' },
      qty: i.quantity,
      note: i.specialInstructions
    }));

    const orderPayload = {
      table: `Table ${pairedTableNumber || '1'}`,
      customerName: customerName || `Guest (Table ${pairedTableNumber || '1'})`,
      name: customerName || `Guest (Table ${pairedTableNumber || '1'})`,
      total: cartTotal,
      items: itemsList,
      hookahs,
      food,
      drinks,
      timestamp: new Date().toISOString()
    };
    TenantApiService.submitOrder(orderPayload);

    navigate('order_confirmation');
    setCart([]);
    setDraftHookah(null);
    setDraftFood(null);
    setDraftDrink(null);
  }, [cart, cartTotal, navigate, pairedTableNumber]);

  const logOutSession = useCallback(async () => {
    setCart([]);
    setDraftHookah(null);
    setDraftFood(null);
    setDraftDrink(null);
    setActiveServerRequest(null);
    try {
      await AsyncStorage.removeItem('@saas_customer_name');
    } catch (_) {}
    setCurrentScreen('pairing');
  }, []);

  return {
    currentScreen,
    navigate,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    totalCartCount,
    activeItemForDetail,
    setActiveItemForDetail,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    isCallServerModalOpen,
    setIsCallServerModalOpen,
    isMixLabOpen,
    setIsMixLabOpen,
    activeServerRequest,
    requestServer,
    cancelServerRequest,
    conversationStep,
    setConversationStep,
    draftHookah,
    setDraftHookah,
    draftFood,
    setDraftFood,
    draftDrink,
    setDraftDrink,
    placeOrder,
    allMenuItems,
    refreshLiveMenu: loadLiveMenu,
    logOutSession,
  };
}
