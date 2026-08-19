import { MenuItem, ModifierGroup } from '../types';
import { CAVALLI_FULL_HTML_MENU_ITEMS } from './cavalli_full_html_menu';
import { CAVALLI_HOUSE_MIXES, POPULAR_MIX_RECIPES } from './hookahMixData';

// Exact 2 Hookah Add-Ons specified by user: Ice Base ($2) and Ice Hose ($6)
export const HOOKAH_EXACT_ADDONS: ModifierGroup[] = [
  {
    id: 'hookah_addons',
    name: 'Hookah Enhancers',
    options: [
      { id: 'ice_base', name: 'Ice Base Upgrade', price: 2.0 },
      { id: 'ice_hose', name: 'Sub-Zero Ice Hose', price: 6.0 },
    ],
  },
];

// ONLY House Mixes & Popular Mixes appear on the main Hookah Page
export const CAVALLI_HOOKAH_ITEMS: MenuItem[] = [
  ...CAVALLI_HOUSE_MIXES.map((hm) => ({
    id: hm.id,
    name: hm.name,
    price: hm.price,
    category: 'hookah' as const,
    subcategory: 'House Mixes 👑',
    description: hm.description,
    badge: hm.badge,
    imageKey: hm.imageKey || 'hookah_anarkali',
    isPopular: true,
    modifierGroups: HOOKAH_EXACT_ADDONS,
  })),
  ...POPULAR_MIX_RECIPES.map((pm) => ({
    id: pm.id,
    name: pm.name,
    price: pm.price,
    category: 'hookah' as const,
    subcategory: 'Popular Favorites ⭐',
    description: pm.desc,
    badge: pm.badge,
    imageKey: pm.imageKey || 'hookah_generic',
    isPopular: true,
    modifierGroups: HOOKAH_EXACT_ADDONS,
  })),
];

export const CAVALLI_FOOD_ITEMS: MenuItem[] = CAVALLI_FULL_HTML_MENU_ITEMS.filter(
  (item) => item.category === 'food'
);

export const CAVALLI_DRINK_ITEMS: MenuItem[] = CAVALLI_FULL_HTML_MENU_ITEMS.filter(
  (item) => item.category === 'drinks'
);

export const MOCK_RESTAURANTS_DB = [
  {
    id: 'cavalli',
    name: 'CAVALLI',
    tagline: 'Lounge & Dining Experience',
    tableNumber: '12',
    pin: '1234',
    code: 'CAV-12',
    items: [...CAVALLI_HOOKAH_ITEMS, ...CAVALLI_FULL_HTML_MENU_ITEMS],
  },
];
