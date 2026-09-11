import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ScreenState, 
  MenuItem, 
  CartItem, 
  SelectedModifier, 
  ServerRequestStatus, 
  ServerRequestType,
  ConversationStep,
  MenuCategory 
} from '../types';
import { CAVALLI_HOOKAH_ITEMS, CAVALLI_FOOD_ITEMS, CAVALLI_DRINK_ITEMS } from '../data/mockRestaurant';
import { TenantApiService, STORAGE_KEYS, getBaseUrl } from '../services/api';
import { useRestaurantTheme } from '../theme/ThemeContext';

export function useBenzinState() {
  const { updateTheme } = useRestaurantTheme();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('pairing');
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
  const [liveCategories, setLiveCategories] = useState<MenuCategory[]>([]);
  const [liveMenuItems, setLiveMenuItems] = useState<MenuItem[]>([]);
  const [pairedSlug, setPairedSlug] = useState<string | null>(null);
  const [pairedTableNumber, setPairedTableNumber] = useState<string>('1');
  const [customerName, setCustomerName] = useState<string>('Guest');
  const [activeCoalRefill, setActiveCoalRefill] = useState<any | null>(null);
  const [isRequestingCoalRefill, setIsRequestingCoalRefill] = useState<boolean>(false);

  const loadLiveMenu = useCallback(async () => {
    try {
      const storedRestId = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_ID);
      const storedSlug = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_SLUG);
      const storedTable = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER);
      const storedName = await AsyncStorage.getItem('@saas_customer_name');
      setPairedSlug(storedSlug);
      if (storedTable) {
        setPairedTableNumber(storedTable);
        updateTheme({ tableNumber: storedTable });
      }
      if (storedName) setCustomerName(storedName);

      let config = null;
      if (storedRestId) {
        config = await TenantApiService.fetchRestaurantConfig(storedRestId);
      }
      if (!config && storedSlug) {
        config = await TenantApiService.fetchConfigBySlug(storedSlug);
      }
      if (!config) {
        config = await TenantApiService.fetchConfigBySlug('cavali');
      }

      if (config) {
        let catList: MenuCategory[] = [];
        const catMap = new Map<string, any>();

        if (Array.isArray(config.categories)) {
          catList = config.categories
            .filter((c: any) => c.active !== false)
            .map((c: any) => ({
              _id: c._id || c.id,
              id: c._id || c.id,
              restaurant_id: c.restaurant_id,
              parent_id: c.parent_id !== undefined ? c.parent_id : null,
              name: c.name || c.title || 'Category',
              title: c.name || c.title || 'Category',
              description: c.description || c.subtitle || '',
              icon: c.icon || (c.parent_id === null ? '👑' : '📋'),
              color: c.color || '#E5B13A',
              sort_order: c.sort_order ?? 0,
              active: c.active !== false,
            }))
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          
          catList.forEach(c => catMap.set(c._id, c));
          setLiveCategories(catList);
        }

        if (Array.isArray(config.menu_items)) {
          const itemList: MenuItem[] = config.menu_items
            .filter((i: any) => i.active !== false)
            .map((i: any) => {
              const subCat = catMap.get(i.category_id);
              const parentSuper = subCat?.parent_id ? catMap.get(subCat.parent_id) : null;
              const catRawName = (parentSuper?.name || parentSuper?.title || subCat?.name || subCat?.title || i.category_id || i.category || '').toLowerCase();
              
              let cat: 'hookah' | 'food' | 'drinks' = 'food';
              if (catRawName.includes('hookah') || (i.category_id && String(i.category_id).toUpperCase().includes('HOOKAH')) || (i.name && String(i.name).toLowerCase().includes('hookah'))) {
                cat = 'hookah';
              } else if (catRawName.includes('beverage') || catRawName.includes('drink') || (i.category_id && (String(i.category_id).toUpperCase().includes('BEVERAGE') || String(i.category_id).toUpperCase().includes('DRINK')))) {
                cat = 'drinks';
              }

              let subcategory = subCat?.name || subCat?.title || i.subcategory || '';
              if (!subcategory && i.category_id) {
                const cleanCat = String(i.category_id).replace(/^cat_/, '').replace(/_/g, ' ');
                subcategory = cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1);
              }
              if (!subcategory) subcategory = 'General';

              return {
                id: i._id || i.id,
                _id: i._id || i.id,
                restaurant_id: i.restaurant_id,
                category_id: i.category_id,
                name: i.name,
                price: Number(i.price) || 0,
                description: i.description || i.desc || '',
                desc: i.desc || i.description || '',
                emoji: i.emoji || '🍽️',
                imageUrl: i.image_url || i.imageUrl || undefined,
                image_url: i.image_url || i.imageUrl || null,
                sort_order: i.sort_order ?? 0,
                active: i.active !== false,
                available: i.available !== false,
                modifierGroups: i.modifier_groups || i.modifierGroups || [],
                recipe: i.recipe || [],
                variants: i.variants || [],
                category_sort_order: subCat?.sort_order ?? 9999,
                category: cat,
                subcategory,
              };
            })
            .sort((a, b) => {
              const catOrderA = (a as any).category_sort_order ?? 9999;
              const catOrderB = (b as any).category_sort_order ?? 9999;
              if (catOrderA !== catOrderB) return catOrderA - catOrderB;
              const itemOrderA = a.sort_order ?? 0;
              const itemOrderB = b.sort_order ?? 0;
              if (itemOrderA !== itemOrderB) return itemOrderA - itemOrderB;
              return (a.name || '').localeCompare(b.name || '');
            });
          setLiveMenuItems(itemList);
        }
      }
    } catch (err) {
      console.warn('Could not fetch live menu config in mobile app:', err);
    }
  }, [updateTheme]);

  const refreshActiveCoalRefill = useCallback(async () => {
    try {
      const table = `Table ${pairedTableNumber || '1'}`;
      const active = await TenantApiService.getActiveCoalRefill(table);
      setActiveCoalRefill(active);
    } catch (err) {
      // silently ignore
    }
  }, [pairedTableNumber]);

  useEffect(() => {
    const handleNfcUrlRouting = async () => {
      if (typeof window !== 'undefined' && window.location) {
        const pathParts = window.location.pathname
          .split('/')
          .filter(p => p && p !== 'explore' && p !== '_sitemap' && p !== 'index.html');
        const urlParams = new URLSearchParams(window.location.search);

        let venueCode: string | null = urlParams.get('venue') || urlParams.get('v');
        let tableNum: string | null = urlParams.get('table') || urlParams.get('t');

        if (!venueCode && pathParts.length >= 1) {
          const firstPart = pathParts[0];
          if (!['menu', 'pairing', 'admin', 'api', 'staff', 'kds'].includes(firstPart)) {
            venueCode = firstPart;
          }
        }
        if (!tableNum && pathParts.length >= 2) {
          tableNum = pathParts[1];
        }

        if (venueCode) {
          try {
            const config = await TenantApiService.fetchConfigBySlug(venueCode);
            if (config && config.restaurant) {
              await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_ID, config.restaurant.id);
              await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_SLUG, config.restaurant.slug);
              await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_NAME, config.restaurant.name);
              setPairedSlug(config.restaurant.slug);

              let effectiveTable = tableNum ? tableNum.replace(/[^0-9]/g, '') : null;
              if (!effectiveTable) {
                effectiveTable = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER);
              }

              if (effectiveTable) {
                await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER, effectiveTable);
                setPairedTableNumber(effectiveTable);
                updateTheme({
                  name: config.restaurant.name,
                  tableNumber: effectiveTable,
                  primaryColor: config.restaurant.branding?.primary_color || '#E5B13A',
                });
                setCurrentScreen('home');
                loadLiveMenu();
                refreshActiveCoalRefill();
                return;
              } else {
                updateTheme({
                  name: config.restaurant.name,
                  primaryColor: config.restaurant.branding?.primary_color || '#E5B13A',
                });
                setCurrentScreen('pairing');
                return;
              }
            }
          } catch (e) {
            console.warn('NFC auto-configure note:', e);
          }
        }
      }

      const storedRestId = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_ID);
      const storedSlug = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_SLUG);
      const storedTable = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER);

      if ((storedRestId || storedSlug) && storedTable) {
        setPairedSlug(storedSlug || storedRestId);
        setPairedTableNumber(storedTable);
        setCurrentScreen('home');
      } else {
        setCurrentScreen('pairing');
      }
    };

    handleNfcUrlRouting();
    loadLiveMenu();
    refreshActiveCoalRefill();

    let eventSource: any = null;
    if (typeof window !== 'undefined' && (window as any).EventSource) {
      try {
        const baseUrl = getBaseUrl();
        const sseUrl = `${baseUrl}/api/sse?restaurant_id=RES_EED4E9D266DF`;
        eventSource = new (window as any).EventSource(sseUrl);
        eventSource.onmessage = (event: any) => {
          try {
            const data = JSON.parse(event.data);
            if (data && (data.type === 'menu_update' || data.type === 'inventory_update' || data.type === 'category_update')) {
              loadLiveMenu();
            }
            if (data && (
              data.type === 'coal_refill_updated' || 
              data.type === 'coal_refill_request' || 
              data.type === 'service_request_updated' ||
              data.type === 'server_call'
            )) {
              refreshActiveCoalRefill();
            }
          } catch (e) {}
        };
      } catch (err) {
        console.warn('SSE stream notice:', err);
      }
    }

    const intervalId = setInterval(() => {
      loadLiveMenu();
      refreshActiveCoalRefill();
    }, 3000);

    return () => {
      clearInterval(intervalId);
      if (eventSource) {
        try { eventSource.close(); } catch (e) {}
      }
    };
  }, [loadLiveMenu, refreshActiveCoalRefill, updateTheme]);

  const allCategories = useMemo(() => liveCategories, [liveCategories]);
  const allMenuItems = useMemo(() => liveMenuItems, [liveMenuItems]);

  const navigate = useCallback((screen: ScreenState) => {
    setCurrentScreen(screen);
  }, []);

  const addToCart = useCallback((
    item: MenuItem, 
    quantity: number = 1, 
    selectedModifiers: SelectedModifier[] = [],
    specialInstructions: string = ''
  ) => {
    const modifierTotal = selectedModifiers.reduce((acc, m) => acc + (Number(m.price) || 0), 0);
    const basePrice = Number(item.price) || 0;
    const cleanQty = Number(quantity) || 1;
    const itemTotal = (basePrice + modifierTotal) * cleanQty;
    const cartItemId = `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newCartItem: CartItem = {
      cartItemId,
      item: { ...item, price: basePrice },
      quantity: cleanQty,
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
          const qty = Number(newQty) || 1;
          const unitPrice = (Number(ci.itemTotal) || 0) / (Number(ci.quantity) || 1);
          return {
            ...ci,
            quantity: qty,
            itemTotal: unitPrice * qty,
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
    return Number(cart.reduce((sum, item) => sum + (Number(item.itemTotal) || 0), 0).toFixed(2));
  }, [cart]);

  const cartTax = useMemo(() => {
    return Number(((Number(cartSubtotal) || 0) * 0.0825).toFixed(2));
  }, [cartSubtotal]);

  const cartGratuity = useMemo(() => {
    return Number(((Number(cartSubtotal) || 0) * 0.18).toFixed(2));
  }, [cartSubtotal]);

  const cartTotal = useMemo(() => {
    return Number(((Number(cartSubtotal) || 0) + (Number(cartTax) || 0) + (Number(cartGratuity) || 0)).toFixed(2));
  }, [cartSubtotal, cartTax, cartGratuity]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const requestServer = useCallback((type: ServerRequestType, customNote?: string) => {
    const labels: Record<ServerRequestType, string> = {
      server: 'Request Server Assistance',
      water: 'Water & Ice Refresh',
      coals: 'Hookah Coal Refill',
      COAL_REFILL: 'Hookah Coal Refill',
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

  /**
   * Unified single implementation for Coal Refill across customer screens
   */
  const requestCoalRefill = useCallback(async (customNote?: string): Promise<{ success: boolean; duplicate?: boolean; request?: any; error?: string }> => {
    if (
      activeCoalRefill &&
      (activeCoalRefill.status === 'PENDING' ||
        activeCoalRefill.status === 'IN_PROGRESS' ||
        activeCoalRefill.status === 'pending' ||
        activeCoalRefill.status === 'in_progress')
    ) {
      return {
        success: false,
        duplicate: true,
        request: activeCoalRefill,
        error: 'A coal refill request is already pending or in progress for your table.',
      };
    }

    setIsRequestingCoalRefill(true);
    try {
      const table = `Table ${pairedTableNumber || '1'}`;
      const res = await TenantApiService.requestCoalRefill({
        table,
        customerName: customerName || `Guest (Table ${pairedTableNumber || '1'})`,
        note: customNote || 'Hookah Coal Refill 🔥',
      });

      if (res.duplicate) {
        if (res.request) setActiveCoalRefill(res.request);
        return {
          success: false,
          duplicate: true,
          request: res.request,
          error: res.error || 'A coal refill request is already pending or in progress for your table.',
        };
      }

      if (res.success && res.request) {
        setActiveCoalRefill(res.request);
        return { success: true, request: res.request };
      }

      return {
        success: false,
        error: res.error || 'Could not request coal refill at this time.',
      };
    } finally {
      setIsRequestingCoalRefill(false);
      refreshActiveCoalRefill();
    }
  }, [activeCoalRefill, pairedTableNumber, customerName, refreshActiveCoalRefill]);

  const placeOrder = useCallback(() => {
    if (cart.length === 0) return;

    // Build rich order payload for backend & KDS Admin Dashboard
    const itemsList = cart.map(i => {
      const itemEmoji = (i.item as any).emoji || (i.item.category === 'hookah' ? '💨' : i.item.category === 'drinks' ? '🥤' : '🍔');
      const modNames = (i.selectedModifiers || []).map(m => m.optionName || m.name || '').filter(Boolean);
      const instr = i.specialInstructions || '';
      const combinedNotes = [instr, ...modNames.filter(mn => mn && !instr.includes(mn))].filter(Boolean).join(' · ');
      return {
        id: i.item.id,
        name: i.item.name,
        price: i.item.price,
        emoji: itemEmoji,
        qty: i.quantity,
        modifiers: i.selectedModifiers,
        notes: combinedNotes,
        note: combinedNotes
      };
    });

    const hookahs = cart.filter(i => {
      const cat = (i.item.category || '').toLowerCase();
      const name = (i.item.name || '').toLowerCase();
      return cat === 'hookah' || name.includes('hookah') || (i.item as any).emoji === '💨' || (i.item as any).emoji === '🧪';
    }).map(i => {
      const modNames = (i.selectedModifiers || []).map(m => m.optionName || m.name || '').filter(Boolean);
      const instr = i.specialInstructions || '';
      const combinedNotes = [instr, ...modNames.filter(mn => mn && !instr.includes(mn))].filter(Boolean).join(' · ');
      return {
        flavor: { name: i.item.name, id: i.item.id },
        name: i.item.name,
        qty: i.quantity,
        price: i.item.price,
        modifiers: i.selectedModifiers,
        notes: combinedNotes,
        note: combinedNotes
      };
    });
    const food = cart.filter(i => i.item.category === 'food').map(i => ({
      item: { name: i.item.name, price: i.item.price, emoji: (i.item as any).emoji || '🍔' },
      qty: i.quantity,
      note: i.specialInstructions
    }));
    const drinks = cart.filter(i => i.item.category === 'drinks').map(i => {
      const flavorNotes = (i.selectedModifiers || []).map(m => m.optionName).filter(Boolean);
      const combinedNote = [i.specialInstructions, ...flavorNotes].filter(Boolean).join(' · ');
      let drinkName = i.item.name;
      if ((drinkName.toLowerCase().includes('soft drink') || drinkName.toLowerCase().includes('soda')) && flavorNotes.length > 0) {
        drinkName = flavorNotes.join(', ');
      }
      return {
        item: { name: drinkName, price: Number(i.item.price) || 0, emoji: (i.item as any).emoji || '🥤' },
        qty: Number(i.quantity) || 1,
        note: combinedNote,
        notes: combinedNote,
        modifiers: i.selectedModifiers,
      };
    });

    const orderPayload = {
      table: `Table ${pairedTableNumber || '1'}`,
      customerName: customerName || `Guest (Table ${pairedTableNumber || '1'})`,
      name: customerName || `Guest (Table ${pairedTableNumber || '1'})`,
      subtotal: cartSubtotal,
      taxAmount: cartTax,
      gratuityAmount: cartGratuity,
      tipAmount: cartGratuity,
      total: cartTotal,
      grandTotal: cartTotal,
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
  }, [cart, cartSubtotal, cartTax, cartGratuity, cartTotal, customerName, navigate, pairedTableNumber]);

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
    cartGratuity,
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
    activeCoalRefill,
    isRequestingCoalRefill,
    requestCoalRefill,
    refreshActiveCoalRefill,
    conversationStep,
    setConversationStep,
    draftHookah,
    setDraftHookah,
    draftFood,
    setDraftFood,
    draftDrink,
    setDraftDrink,
    placeOrder,
    allCategories,
    allMenuItems,
    refreshLiveMenu: loadLiveMenu,
    logOutSession,
  };
}
