import { MultiTenantDbService } from './multi-tenant-db.service';

export interface IngredientDeduction {
  ingredientId: string;
  amount: number;
}

// Recipes dictionary mapping item IDs to ingredients list
const RECIPES: Record<string, IngredientDeduction[]> = {
  // --- APPETIZERS ---
  hummus: [
    { ingredientId: 'chickpeas', amount: 80 },
    { ingredientId: 'tahini', amount: 20 },
    { ingredientId: 'pita_bread', amount: 1 }
  ],
  falafel: [
    { ingredientId: 'chickpea_flour', amount: 60 },
    { ingredientId: 'tahini', amount: 15 },
    { ingredientId: 'jalapenos', amount: 10 }
  ],
  dyn_chk: [
    { ingredientId: 'chicken_breast', amount: 150 },
    { ingredientId: 'sour_cream', amount: 30 }
  ],
  bun_kab: [
    { ingredientId: 'spiced_patty', amount: 1 },
    { ingredientId: 'soft_bun', amount: 1 }
  ],
  samosa: [
    { ingredientId: 'samosa_wrappers', amount: 3 }
  ],
  papri: [
    { ingredientId: 'wafers', amount: 50 },
    { ingredientId: 'chickpeas', amount: 30 },
    { ingredientId: 'yogurt', amount: 30 }
  ],
  pani: [
    { ingredientId: 'hollow_puris', amount: 6 },
    { ingredientId: 'potatoes', amount: 50 },
    { ingredientId: 'chickpeas', amount: 20 }
  ],
  spy_pot: [
    { ingredientId: 'potatoes', amount: 200 }
  ],
  tenders: [
    { ingredientId: 'tenders', amount: 3 },
    { ingredientId: 'frozen_fries', amount: 150 }
  ],
  pizza_b: [
    { ingredientId: 'american_cheese', amount: 2 }
  ],
  fries: [
    { ingredientId: 'frozen_fries', amount: 150 }
  ],
  ld_fries: [
    { ingredientId: 'frozen_fries', amount: 200 },
    { ingredientId: 'queso_dip', amount: 50 },
    { ingredientId: 'jalapenos', amount: 15 },
    { ingredientId: 'sour_cream', amount: 15 }
  ],
  ld_nachos: [
    { ingredientId: 'tortilla_chips', amount: 100 },
    { ingredientId: 'queso_dip', amount: 60 },
    { ingredientId: 'jalapenos', amount: 20 },
    { ingredientId: 'sour_cream', amount: 20 }
  ],
  chips_q: [
    { ingredientId: 'tortilla_chips', amount: 100 },
    { ingredientId: 'queso_dip', amount: 80 }
  ],
  chips_g: [
    { ingredientId: 'tortilla_chips', amount: 100 },
    { ingredientId: 'guacamole', amount: 80 }
  ],

  // --- MAINS ---
  shaw_pl: [
    { ingredientId: 'shawarma_meat', amount: 180 },
    { ingredientId: 'frozen_fries', amount: 100 }
  ],
  koobideh: [
    { ingredientId: 'beef_koobideh', amount: 2 }
  ],
  chk_boti: [
    { ingredientId: 'chicken_breast', amount: 200 },
    { ingredientId: 'naan', amount: 1 }
  ],
  chk_kab: [
    { ingredientId: 'chicken_breast', amount: 180 },
    { ingredientId: 'basmati_rice', amount: 150 }
  ],
  lamb_ch: [
    { ingredientId: 'lamb_chops', amount: 3 },
    { ingredientId: 'potatoes', amount: 100 }
  ],
  but_chk: [
    { ingredientId: 'chicken_breast', amount: 150 },
    { ingredientId: 'milk', amount: 100 },
    { ingredientId: 'basmati_rice', amount: 150 }
  ],
  biryani: [
    { ingredientId: 'chicken_breast', amount: 150 },
    { ingredientId: 'basmati_rice', amount: 200 },
    { ingredientId: 'yogurt', amount: 30 }
  ],

  // --- WINGS ---
  wings6: [
    { ingredientId: 'tenders', amount: 6 }
  ],
  wings10: [
    { ingredientId: 'tenders', amount: 10 }
  ],

  // --- VEGETARIAN ---
  v_papri: [
    { ingredientId: 'wafers', amount: 50 },
    { ingredientId: 'chickpeas', amount: 30 },
    { ingredientId: 'yogurt', amount: 30 }
  ],
  v_pani: [
    { ingredientId: 'hollow_puris', amount: 6 },
    { ingredientId: 'potatoes', amount: 50 },
    { ingredientId: 'chickpeas', amount: 20 }
  ],
  v_spypot: [
    { ingredientId: 'potatoes', amount: 200 }
  ],
  v_fal: [
    { ingredientId: 'chickpea_flour', amount: 60 },
    { ingredientId: 'tahini', amount: 15 }
  ],
  v_hum: [
    { ingredientId: 'chickpeas', amount: 80 },
    { ingredientId: 'tahini', amount: 20 },
    { ingredientId: 'pita_bread', amount: 1 }
  ],
  paneer_m: [
    { ingredientId: 'dumpling_wrappers', amount: 6 }
  ],
  veg_sam: [
    { ingredientId: 'samosa_wrappers', amount: 3 }
  ],
  v_chipsq: [
    { ingredientId: 'tortilla_chips', amount: 100 },
    { ingredientId: 'queso_dip', amount: 80 }
  ],
  v_chipsg: [
    { ingredientId: 'tortilla_chips', amount: 100 },
    { ingredientId: 'guacamole', amount: 80 }
  ],
  daal_c: [
    { ingredientId: 'lentils', amount: 100 },
    { ingredientId: 'basmati_rice', amount: 200 }
  ],
  v_fries: [
    { ingredientId: 'frozen_fries', amount: 150 }
  ],
  v_ldfr: [
    { ingredientId: 'frozen_fries', amount: 200 },
    { ingredientId: 'queso_dip', amount: 50 },
    { ingredientId: 'jalapenos', amount: 15 }
  ],
  v_ldna: [
    { ingredientId: 'tortilla_chips', amount: 100 },
    { ingredientId: 'queso_dip', amount: 60 },
    { ingredientId: 'jalapenos', amount: 20 }
  ],

  // --- BURGERS ---
  smash: [
    { ingredientId: 'beef_patty', amount: 2 },
    { ingredientId: 'american_cheese', amount: 2 },
    { ingredientId: 'burger_bun', amount: 1 }
  ],
  zinger: [
    { ingredientId: 'chicken_breast', amount: 150 },
    { ingredientId: 'burger_bun', amount: 1 },
    { ingredientId: 'lettuce', amount: 10 }
  ],
  club: [
    { ingredientId: 'chicken_breast', amount: 100 },
    { ingredientId: 'lettuce', amount: 15 }
  ],
  swiss_m: [
    { ingredientId: 'beef_patty', amount: 1 },
    { ingredientId: 'swiss_cheese', amount: 1 },
    { ingredientId: 'burger_bun', amount: 1 },
    { ingredientId: 'mushrooms', amount: 50 },
    { ingredientId: 'onions', amount: 30 }
  ],

  // --- WRAPS ---
  shaw_w: [
    { ingredientId: 'shawarma_meat', amount: 120 },
    { ingredientId: 'pita_bread', amount: 1 }
  ],
  dyn_w: [
    { ingredientId: 'chicken_breast', amount: 120 },
    { ingredientId: 'pita_bread', amount: 1 }
  ],
  zing_w: [
    { ingredientId: 'chicken_breast', amount: 120 },
    { ingredientId: 'burger_bun', amount: 1 }
  ],
  mir_p: [
    { ingredientId: 'chicken_breast', amount: 120 },
    { ingredientId: 'naan', amount: 1 }
  ],

  // --- CONTINENTAL ---
  tacos: [
    { ingredientId: 'chicken_breast', amount: 120 }
  ],
  c_chipsq: [
    { ingredientId: 'tortilla_chips', amount: 100 },
    { ingredientId: 'queso_dip', amount: 80 }
  ],
  chili_c: [
    { ingredientId: 'chicken_breast', amount: 150 },
    { ingredientId: 'basmati_rice', amount: 150 }
  ],
  mongo_c: [
    { ingredientId: 'chicken_breast', amount: 150 },
    { ingredientId: 'basmati_rice', amount: 150 }
  ],
  momo: [
    { ingredientId: 'dumpling_wrappers', amount: 6 },
    { ingredientId: 'dumpling_meat', amount: 100 }
  ],
  chow: [
    { ingredientId: 'onions', amount: 30 }
  ],
  daal_s: [
    { ingredientId: 'lentils', amount: 100 },
    { ingredientId: 'basmati_rice', amount: 150 },
    { ingredientId: 'shami_kabob', amount: 1 }
  ],
  cordon: [
    { ingredientId: 'chicken_breast', amount: 200 },
    { ingredientId: 'american_cheese', amount: 2 },
    { ingredientId: 'potatoes', amount: 100 }
  ],

  // --- DESSERTS ---
  car_cr: [{ ingredientId: 'caramel_cake', amount: 1 }],
  pis_ck: [{ ingredientId: 'pistachio_cake', amount: 1 }],
  rasp_ck: [{ ingredientId: 'raspberry_cake', amount: 1 }],
  choc_ck: [{ ingredientId: 'chocolate_cake', amount: 1 }],
  butt_b: [{ ingredientId: 'butterscotch_cake', amount: 1 }],

  // --- DRINKS: REFRESHERS ---
  cl_moj: [
    { ingredientId: 'mint_leaves', amount: 5 },
    { ingredientId: 'lime', amount: 0.5 },
    { ingredientId: 'syrup', amount: 30 },
    { ingredientId: 'soda', amount: 150 }
  ],
  mn_moj: [
    { ingredientId: 'mint_leaves', amount: 5 },
    { ingredientId: 'syrup', amount: 40 },
    { ingredientId: 'soda', amount: 150 }
  ],
  ly_moj: [
    { ingredientId: 'mint_leaves', amount: 5 },
    { ingredientId: 'syrup', amount: 40 },
    { ingredientId: 'soda', amount: 150 }
  ],
  mt_marg: [
    { ingredientId: 'mint_leaves', amount: 5 },
    { ingredientId: 'lime', amount: 0.5 },
    { ingredientId: 'soda', amount: 150 }
  ],
  rm_fire: [
    { ingredientId: 'watermelon', amount: 200 }
  ],
  wm_jce: [
    { ingredientId: 'watermelon', amount: 250 }
  ],
  or_jce: [
    { ingredientId: 'orange_fruit', amount: 3 }
  ],
  mn_shk: [
    { ingredientId: 'milk', amount: 200 }
  ],
  sw_las: [
    { ingredientId: 'yogurt', amount: 150 },
    { ingredientId: 'milk', amount: 50 }
  ],

  // --- DRINKS: TEA & COFFEE ---
  karak: [
    { ingredientId: 'milk', amount: 100 },
    { ingredientId: 'black_tea', amount: 5 }
  ],
  kash_c: [
    { ingredientId: 'milk', amount: 100 },
    { ingredientId: 'pink_tea', amount: 5 }
  ],
  desi_c: [
    { ingredientId: 'milk', amount: 120 },
    { ingredientId: 'coffee_beans', amount: 10 }
  ],
  cold_c: [
    { ingredientId: 'milk', amount: 150 },
    { ingredientId: 'coffee_beans', amount: 10 }
  ],
  mint_t: [
    { ingredientId: 'mint_leaves', amount: 5 }
  ],
  moroc_t: [
    { ingredientId: 'mint_leaves', amount: 3 }
  ],

  // --- DRINKS: SOFT DRINKS ---
  coca: [{ ingredientId: 'coca_cola', amount: 1 }],
  coke_z: [{ ingredientId: 'coke_zero', amount: 1 }],
  fanta: [{ ingredientId: 'fanta', amount: 1 }],
  ging_a: [{ ingredientId: 'ginger_ale', amount: 1 }],
  sprite: [{ ingredientId: 'sprite', amount: 1 }],
  drpep: [{ ingredientId: 'dr_pepper', amount: 1 }],
  redbull: [{ ingredientId: 'red_bull', amount: 1 }],
  spark_w: [{ ingredientId: 'sparkling_water', amount: 1 }],
  sara_w: [{ ingredientId: 'saratoga_water', amount: 1 }]
};

// Composite House Mix Shisha Recipes (ratios sum to 100%)
const HOUSE_MIX_RECIPES: Record<string, { id: string; ratio: number }[]> = {
  anarkali: [
    { id: 'pan_ras', ratio: 30 },
    { id: 'lady_killer', ratio: 40 },
    { id: 'bagdadi', ratio: 30 }
  ],
  sokha: [
    { id: 'pan_ras', ratio: 30 },
    { id: 'lychee', ratio: 40 },
    { id: 'blueberry', ratio: 30 }
  ],
  zalim: [
    { id: 'red_bull_shisha', ratio: 50 },
    { id: 'mint_pro', ratio: 50 }
  ],
  dragon: [
    { id: 'red_bull_shisha', ratio: 40 },
    { id: 'dragon_fruit', ratio: 40 },
    { id: 'spice_shisha', ratio: 20 }
  ],
  chulbuli: [
    { id: 'mango', ratio: 50 },
    { id: 'peach', ratio: 30 },
    { id: 'mint_pro', ratio: 20 }
  ],
  white_king: [
    { id: 'vanilla', ratio: 50 },
    { id: 'cardamom', ratio: 30 },
    { id: 'cream_shisha', ratio: 20 }
  ],
  dubai_nights: [
    { id: 'watermelon_lit', ratio: 60 },
    { id: 'grape_hub', ratio: 30 },
    { id: 'mint_pro', ratio: 10 }
  ]
};

import { InventoryRepository } from '../modules/inventory/inventory.repository';

export interface RecordedDeduction {
  inventory_item_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  order_id: string;
  restaurant_id: string;
  timestamp: string;
}

export class RecipeService {
  /**
   * Calculate all ingredient deductions required for an order.
   * Dynamically uses configured total_flavor_weight and database recipes.
   */
  static async calculateOrderDeductions(
    order: any,
    restaurantId: string
  ): Promise<Map<string, { inventory_item_id: string; item_name: string; quantity: number; unit: string }>> {
    const deductionsMap = new Map<string, { inventory_item_id: string; item_name: string; quantity: number; unit: string }>();

    const addDeduction = (itemId: string, itemName: string, grams: number, unit = 'g') => {
      if (!itemId || !Number.isFinite(grams) || grams <= 0) return;
      const key = String(itemId).trim();
      const existing = deductionsMap.get(key);
      if (existing) {
        existing.quantity = parseFloat((existing.quantity + grams).toFixed(2));
      } else {
        deductionsMap.set(key, {
          inventory_item_id: key,
          item_name: itemName || key,
          quantity: parseFloat(grams.toFixed(2)),
          unit
        });
      }
    };

    const hookahConfig = await MultiTenantDbService.getHookahConfig(restaurantId);
    const totalFlavorWeight = Number(hookahConfig?.total_flavor_weight) || 20;

    const [dbMenuItems, invItems] = await Promise.all([
      MultiTenantDbService.listMenuItems(restaurantId),
      MultiTenantDbService.listInventory(restaurantId)
    ]);

    const resolveInvItem = (idOrName: string) => {
      if (!idOrName) return null;
      const lower = String(idOrName).toLowerCase().trim();
      return invItems.find(i => 
        i._id === idOrName || 
        (i as any).id === idOrName || 
        (i.name && i.name.toLowerCase() === lower) ||
        (i._id && i._id.toLowerCase() === lower)
      );
    };

    // 1. Process Hookahs (order.hookahs)
    if (Array.isArray(order.hookahs)) {
      for (const hookah of order.hookahs) {
        const hookahQty = Math.max(1, Number(hookah.quantity || hookah.qty) || 1);
        const flavor = hookah.flavor;
        if (!flavor) continue;

        // Custom Mix Lab order
        if (flavor.isMix && Array.isArray(flavor.mixDetails) && flavor.mixDetails.length > 0) {
          for (const component of flavor.mixDetails) {
            const rawId = component.inventory_item_id || component.ingredient_id || component.id || component._id;
            const inv = resolveInvItem(rawId) || resolveInvItem(component.name);
            const targetId = inv ? (inv._id || (inv as any).id) : rawId;
            const targetName = inv ? inv.name : (component.name || 'Flavor');
            const pct = Number(component.percentage !== undefined ? component.percentage : (component.ratio || 0));
            const gramsPerHookah = component.grams !== undefined && component.grams !== null
              ? Number(component.grams)
              : (pct / 100) * totalFlavorWeight;
            addDeduction(targetId, targetName, gramsPerHookah * hookahQty, inv?.unit || 'g');
          }
        } else {
          // House Mix Hookah or Single Flavor
          const dbMatch = dbMenuItems.find((m: any) => 
            (flavor.id && (m._id === flavor.id || (m as any).id === flavor.id)) || 
            (flavor.name && m.name.toLowerCase() === flavor.name.toLowerCase())
          );

          if (dbMatch && Array.isArray(dbMatch.recipe) && dbMatch.recipe.length > 0) {
            for (const ing of dbMatch.recipe) {
              const rawId = ing.ingredient_id || ing.ingredientId;
              const inv = resolveInvItem(rawId) || resolveInvItem(ing.name);
              const targetId = inv ? (inv._id || (inv as any).id) : rawId;
              const targetName = inv ? inv.name : (ing.name || 'House Mix Ingredient');
              let grams = 0;
              if (ing.percentage !== undefined && Number(ing.percentage) > 0) {
                grams = (Number(ing.percentage) / 100) * totalFlavorWeight;
              } else {
                grams = Number(ing.quantity !== undefined ? ing.quantity : (ing.amount || 0));
              }
              addDeduction(targetId, targetName, grams * hookahQty, ing.unit || inv?.unit || 'g');
            }
          } else {
            // Check direct inventory item
            const inv = resolveInvItem(flavor.id) || resolveInvItem(flavor.name);
            if (inv) {
              addDeduction(inv._id || (inv as any).id, inv.name, totalFlavorWeight * hookahQty, inv.unit || 'g');
            } else {
              // Legacy static recipe fallback
              const legacyMix = HOUSE_MIX_RECIPES[flavor.id] || (flavor.name ? HOUSE_MIX_RECIPES[flavor.name.toLowerCase().replace(/[^a-z0-9]/g, '_')] : null);
              if (legacyMix) {
                for (const comp of legacyMix) {
                  const compInv = resolveInvItem(comp.id);
                  const targetId = compInv ? (compInv._id || (compInv as any).id) : comp.id;
                  const targetName = compInv ? compInv.name : comp.id;
                  const grams = (comp.ratio / 100) * totalFlavorWeight;
                  addDeduction(targetId, targetName, grams * hookahQty, 'g');
                }
              }
            }
          }
        }
      }
    }

    // 2. Process Unified Items (order.items)
    const itemsList = Array.isArray(order.items) ? order.items : [];
    for (const lineItem of itemsList) {
      const itemQty = Math.max(1, Number(lineItem.qty || lineItem.quantity) || 1);
      const isHookahItem = (lineItem.category === 'hookah' || String(lineItem.category_id || '').toLowerCase().includes('hookah') || lineItem.subcategory === 'House Mixes' || lineItem.subcategory === 'Mix Lab Creation');

      if (Array.isArray(lineItem.recipe) && lineItem.recipe.length > 0) {
        for (const ing of lineItem.recipe) {
          const rawId = ing.ingredient_id || ing.ingredientId;
          const inv = resolveInvItem(rawId) || resolveInvItem(ing.name);
          const targetId = inv ? (inv._id || (inv as any).id) : rawId;
          const targetName = inv ? inv.name : (ing.name || 'Recipe Ingredient');
          let grams = 0;
          if (ing.percentage !== undefined && Number(ing.percentage) > 0) {
            grams = (Number(ing.percentage) / 100) * totalFlavorWeight;
          } else {
            grams = Number(ing.quantity !== undefined ? ing.quantity : (ing.amount || 0));
          }
          addDeduction(targetId, targetName, grams * itemQty, ing.unit || inv?.unit || 'g');
        }
      } else {
        const itemId = lineItem.id || lineItem._id || lineItem.menu_item_id;
        const itemName = lineItem.name || lineItem.item?.name;
        const dbMatch = dbMenuItems.find((m: any) => 
          (itemId && (m._id === itemId || (m as any).id === itemId)) || 
          (itemName && m.name.toLowerCase() === String(itemName).toLowerCase())
        );

        if (dbMatch && Array.isArray(dbMatch.recipe) && dbMatch.recipe.length > 0) {
          for (const ing of dbMatch.recipe) {
            const rawId = ing.ingredient_id || ing.ingredientId;
            const inv = resolveInvItem(rawId) || resolveInvItem(ing.name);
            const targetId = inv ? (inv._id || (inv as any).id) : rawId;
            const targetName = inv ? inv.name : (ing.name || 'Recipe Ingredient');
            let grams = 0;
            if (ing.percentage !== undefined && Number(ing.percentage) > 0) {
              grams = (Number(ing.percentage) / 100) * totalFlavorWeight;
            } else {
              grams = Number(ing.quantity !== undefined ? ing.quantity : (ing.amount || 0));
            }
            addDeduction(targetId, targetName, grams * itemQty, ing.unit || inv?.unit || 'g');
          }
        } else if (isHookahItem) {
          const inv = resolveInvItem(itemId) || resolveInvItem(itemName);
          if (inv) {
            addDeduction(inv._id || (inv as any).id, inv.name, totalFlavorWeight * itemQty, inv.unit || 'g');
          }
        } else if (lineItem.ingredient_id && lineItem.ingredient_amount) {
          const inv = resolveInvItem(lineItem.ingredient_id);
          addDeduction(inv ? (inv._id || (inv as any).id) : lineItem.ingredient_id, inv ? inv.name : lineItem.ingredient_id, Number(lineItem.ingredient_amount) * itemQty, inv?.unit || 'g');
        } else if (itemId || itemName) {
          const staticIngredients = RECIPES[itemId] || (itemName ? RECIPES[String(itemName).toLowerCase()] : null);
          if (staticIngredients) {
            for (const ing of staticIngredients) {
              const inv = resolveInvItem(ing.ingredientId);
              addDeduction(inv ? (inv._id || (inv as any).id) : ing.ingredientId, inv ? inv.name : ing.ingredientId, ing.amount * itemQty, inv?.unit || 'g');
            }
          }
        }
      }
    }

    // 3. Process Food items (order.food)
    if (Array.isArray(order.food)) {
      for (const cartLine of order.food) {
        const item = cartLine.item;
        const qty = Number(cartLine.qty) || 1;
        if (!item || qty <= 0) continue;

        if (Array.isArray(item.recipe) && item.recipe.length > 0) {
          for (const ing of item.recipe) {
            const rawId = ing.ingredient_id || ing.ingredientId;
            const inv = resolveInvItem(rawId) || resolveInvItem(ing.name);
            const targetId = inv ? (inv._id || (inv as any).id) : rawId;
            const amount = Number(ing.quantity !== undefined ? ing.quantity : (ing.amount || 0));
            if (targetId && amount > 0) {
              addDeduction(targetId, inv ? inv.name : (ing.name || targetId), amount * qty, ing.unit || inv?.unit || 'g');
            }
          }
        } else {
          const staticIngredients = RECIPES[item.id] || (item.name ? RECIPES[String(item.name).toLowerCase()] : null);
          if (staticIngredients) {
            for (const ing of staticIngredients) {
              const inv = resolveInvItem(ing.ingredientId);
              addDeduction(inv ? (inv._id || (inv as any).id) : ing.ingredientId, inv ? inv.name : ing.ingredientId, ing.amount * qty, inv?.unit || 'g');
            }
          }
        }
      }
    }

    // 4. Process Drinks (order.drinks)
    if (Array.isArray(order.drinks)) {
      for (const cartLine of order.drinks) {
        const item = cartLine.item;
        const qty = Number(cartLine.qty) || 1;
        if (!item || qty <= 0) continue;

        const staticIngredients = RECIPES[item.id] || (item.name ? RECIPES[String(item.name).toLowerCase()] : null);
        if (staticIngredients) {
          for (const ing of staticIngredients) {
            const inv = resolveInvItem(ing.ingredientId);
            addDeduction(inv ? (inv._id || (inv as any).id) : ing.ingredientId, inv ? inv.name : ing.ingredientId, ing.amount * qty, inv?.unit || 'bottle');
          }
        }
      }
    }

    return deductionsMap;
  }

  /**
   * Validate that all ingredients in the order have sufficient stock before creation.
   * Throws an error if any ingredient is missing, inactive, or has insufficient stock.
   */
  static async validateOrderStock(orderData: any, restaurantId: string): Promise<void> {
    if (!orderData || !restaurantId) return;

    const deductionsMap = await this.calculateOrderDeductions(orderData, restaurantId);
    if (deductionsMap.size === 0) return;

    const invItems = await MultiTenantDbService.listInventory(restaurantId);

    for (const required of deductionsMap.values()) {
      const inv = invItems.find(i => 
        i._id === required.inventory_item_id || 
        (i as any).id === required.inventory_item_id ||
        (i.name && i.name.toLowerCase() === required.item_name.toLowerCase())
      );

      if (!inv) {
        throw new Error(`Referenced inventory stock item "${required.item_name}" (${required.inventory_item_id}) does not exist for restaurant "${restaurantId}".`);
      }

      if (inv.active === false) {
        throw new Error(`Flavor/ingredient "${inv.name}" is currently marked inactive in inventory.`);
      }

      const availableStock = Number(inv.stock) || 0;
      if (availableStock < required.quantity) {
        throw new Error(`Insufficient stock for "${inv.name}": required ${required.quantity}${inv.unit || 'g'}, only ${availableStock}${inv.unit || 'g'} available.`);
      }
    }
  }

  /**
   * Process order deductions for raw material inventory based on recipes.
   * Idempotent: Deducts exactly once per order.
   * Atomic: Decrements stock safely and records each transaction.
   */
  static async processOrderDeductions(order: any): Promise<void> {
    if (!order) return;
    const restaurantId = order.restaurant_id || order.restaurantId;
    const orderId = String(order.id || order._id);
    if (!restaurantId || !orderId) {
      throw new Error('Order is missing restaurant_id or id required for inventory deduction');
    }

    // Idempotency check 1: in-memory flag
    if (order.inventory_deducted === true || (order as any).inventoryDeducted === true) {
      console.log(`[RecipeService] Order #${orderId} already marked as inventory_deducted. Skipping duplicate deduction.`);
      return;
    }

    // Idempotency check 2: check persistent database record
    const existingOrder = await MultiTenantDbService.getOrderById(orderId, restaurantId);
    if (existingOrder && (existingOrder.inventory_deducted || (existingOrder as any).inventoryDeducted)) {
      console.log(`[RecipeService] Order #${orderId} already has persistent inventory deduction in database. Skipping duplicate.`);
      order.inventory_deducted = true;
      order.inventory_deductions = existingOrder.inventory_deductions;
      return;
    }

    const deductionsMap = await this.calculateOrderDeductions(order, restaurantId);
    if (deductionsMap.size === 0) return;

    const recordedDeductions: RecordedDeduction[] = [];

    for (const deduction of deductionsMap.values()) {
      const success = await MultiTenantDbService.updateInventoryStock(
        deduction.inventory_item_id,
        restaurantId,
        -deduction.quantity,
        {
          type: 'SALE_DEDUCTION',
          reason: `Auto deduction for Order #${orderId}`,
          orderId,
        }
      );

      if (success) {
        recordedDeductions.push({
          inventory_item_id: deduction.inventory_item_id,
          item_name: deduction.item_name,
          quantity: deduction.quantity,
          unit: deduction.unit || 'g',
          order_id: orderId,
          restaurant_id: restaurantId,
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn(`[RecipeService] Failed to deduct ${deduction.quantity}${deduction.unit} of "${deduction.item_name}" for Order #${orderId} (insufficient stock or item missing).`);
      }
    }

    // Persist actual deduction details on the order document
    await MultiTenantDbService.updateOrderStatus(orderId, restaurantId, order.status || 'pending', {
      inventory_deducted: true,
      inventory_deductions: recordedDeductions,
      inventory_restored: false,
    } as any);

    order.inventory_deducted = true;
    order.inventory_deductions = recordedDeductions;
    order.inventory_restored = false;
  }

  /**
   * Restore deducted stock when an order is cancelled, voided, or refunded.
   * Ensures inventory restoration is idempotent and exact.
   */
  static async restoreOrderDeductions(order: any): Promise<void> {
    if (!order) return;
    const restaurantId = order.restaurant_id || order.restaurantId;
    const orderId = String(order.id || order._id);
    if (!restaurantId || !orderId) return;

    const existingOrder = await MultiTenantDbService.getOrderById(orderId, restaurantId);
    const targetOrder = existingOrder || order;

    if (!targetOrder.inventory_deducted || targetOrder.inventory_restored) {
      return;
    }

    const deductions = targetOrder.inventory_deductions;
    if (Array.isArray(deductions) && deductions.length > 0) {
      for (const d of deductions) {
        if (!d.inventory_item_id || !d.quantity || d.quantity <= 0) continue;
        await MultiTenantDbService.updateInventoryStock(
          d.inventory_item_id,
          restaurantId,
          d.quantity,
          {
            type: 'RETURN',
            reason: `Stock restored - Order #${orderId} cancelled/voided`,
            orderId,
          }
        );
      }
    }

    await MultiTenantDbService.updateOrderStatus(orderId, restaurantId, targetOrder.status || 'cancelled', {
      inventory_deducted: false,
      inventory_restored: true,
    } as any);

    order.inventory_deducted = false;
    order.inventory_restored = true;
  }
}
