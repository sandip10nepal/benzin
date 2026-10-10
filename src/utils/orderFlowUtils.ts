import { CartItem, MenuItem } from '../types';

/**
 * Category & flow classification helpers for Benzin ordering
 */

export const DESSERT_CATEGORY_IDS = ['CAT_DESSERTS', 'dessert', 'desserts'];
export const DRINK_CATEGORY_IDS = [
  'cat_super_drinks',
  'CAT_DRINKS_REFRESHERS',
  'CAT_DRINKS_TEA_COFFEE',
  'CAT_DRINKS_SOFT',
  'drinks',
  'beverages',
];

/**
 * Checks if a single menu item is a dessert
 */
export function isDessertItem(item?: MenuItem | null): boolean {
  if (!item) return false;
  if (item.category === 'dessert') return true;
  if (item.category_id && DESSERT_CATEGORY_IDS.includes(item.category_id)) return true;

  const catIds = item.category_ids || [];
  if (catIds.some((cid) => DESSERT_CATEGORY_IDS.includes(cid) || String(cid).toUpperCase().includes('DESSERT'))) {
    return true;
  }

  const sub = (item.subcategory || '').toLowerCase();
  if (sub.includes('dessert') || sub.includes('sweet') || sub.includes('cake') || sub.includes('kunafa')) {
    return true;
  }

  return false;
}

/**
 * Checks if the customer cart contains at least one dessert item
 */
export function isDessertInCart(cart?: CartItem[] | null): boolean {
  if (!cart || cart.length === 0) return false;
  return cart.some((cartItem) => isDessertItem(cartItem.item));
}

/**
 * Checks if a single menu item is a drink / beverage
 */
export function isDrinkItem(item?: MenuItem | null): boolean {
  if (!item) return false;
  if (item.category === 'drinks') return true;
  if (item.category_id && DRINK_CATEGORY_IDS.includes(item.category_id)) return true;

  const catIds = item.category_ids || [];
  if (
    catIds.some(
      (cid) =>
        DRINK_CATEGORY_IDS.includes(cid) ||
        String(cid).toUpperCase().includes('DRINK') ||
        String(cid).toUpperCase().includes('BEVERAGE') ||
        String(cid).toUpperCase().includes('REFRESHER') ||
        String(cid).toUpperCase().includes('TEA') ||
        String(cid).toUpperCase().includes('COFFEE')
    )
  ) {
    return true;
  }

  const sub = (item.subcategory || '').toLowerCase();
  if (
    sub.includes('drink') ||
    sub.includes('beverage') ||
    sub.includes('refresher') ||
    sub.includes('tea') ||
    sub.includes('coffee') ||
    sub.includes('chai') ||
    sub.includes('mojito') ||
    sub.includes('soda')
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if the customer cart contains at least one drink / beverage item
 */
export function isDrinkInCart(cart?: CartItem[] | null): boolean {
  if (!cart || cart.length === 0) return false;
  return cart.some((cartItem) => isDrinkItem(cartItem.item));
}

/**
 * Checks if a single menu item is a hookah
 */
export function isHookahItem(item?: MenuItem | null): boolean {
  if (!item) return false;
  if (item.category === 'hookah') return true;
  if (item.category_id && String(item.category_id).toLowerCase().includes('hookah')) return true;

  const catIds = item.category_ids || [];
  if (catIds.some((cid) => String(cid).toLowerCase().includes('hookah'))) return true;

  return false;
}

export interface ParsedDestination {
  type: 'category' | 'flow' | 'menu' | 'product' | 'question' | 'stage' | 'skip' | 'other';
  target?: string;
  raw: any;
}

/**
 * Normalizes destination strings and objects into structured navigation intent
 */
export function parseDestination(destination: any): ParsedDestination {
  if (!destination) return { type: 'other', raw: destination };

  if (typeof destination === 'string') {
    const trimmed = destination.trim();
    if (trimmed.startsWith('category:')) {
      return { type: 'category', target: trimmed.replace(/^category:/, ''), raw: destination };
    }
    if (trimmed.startsWith('flow:')) {
      return { type: 'flow', target: trimmed.replace(/^flow:/, ''), raw: destination };
    }
    if (trimmed.startsWith('menu:')) {
      return { type: 'menu', target: trimmed.replace(/^menu:/, ''), raw: destination };
    }
    if (trimmed.startsWith('stage:')) {
      return { type: 'stage', target: trimmed.replace(/^stage:/, ''), raw: destination };
    }
    if (trimmed.startsWith('product:')) {
      return { type: 'product', target: trimmed.replace(/^product:/, ''), raw: destination };
    }
    if (trimmed.startsWith('question:')) {
      return { type: 'question', target: trimmed.replace(/^question:/, ''), raw: destination };
    }
    if (trimmed === 'skip') {
      return { type: 'skip', raw: destination };
    }
    if (trimmed === 'mix_lab' || trimmed === 'custom_mix_lab') {
      return { type: 'flow', target: 'mix_lab', raw: destination };
    }
    return { type: 'other', target: trimmed, raw: destination };
  }

  if (typeof destination === 'object') {
    if (destination.type === 'category' || destination.categoryId) {
      return {
        type: 'category',
        target: destination.categoryId || destination.ref_id || destination.target,
        raw: destination,
      };
    }
    if (destination.type === 'custom_mix_lab' || destination.flow === 'mix_lab') {
      return { type: 'flow', target: 'mix_lab', raw: destination };
    }
    if (destination.type === 'next_stage' || destination.type === 'stage') {
      return { type: 'stage', target: destination.ref_id || destination.stage, raw: destination };
    }
    if (destination.type === 'product' || destination.type === 'product_customization') {
      return { type: 'product', target: destination.ref_id || destination.productId, raw: destination };
    }
    if (destination.type === 'question') {
      return { type: 'question', target: destination.ref_id, raw: destination };
    }
    if (destination.type === 'skip') {
      return { type: 'skip', raw: destination };
    }
    return { type: destination.type || 'other', target: destination.ref_id || destination.target, raw: destination };
  }

  return { type: 'other', raw: destination };
}

/**
 * Finds category title / name matching a given category ID or slug
 */
export function resolveCategoryTitle(categoryId: string, categories: any[] = []): string {
  if (!categoryId) return '';
  const match = categories.find((c) => {
    const cid = c.id || c._id;
    return (
      cid === categoryId ||
      String(cid).toLowerCase() === String(categoryId).toLowerCase() ||
      c.name === categoryId ||
      c.title === categoryId
    );
  });
  return match?.title || match?.name || categoryId;
}
