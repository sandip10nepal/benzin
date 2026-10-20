/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          CAVALI — FULL MENU DATA                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  desc: string;
  emoji: string;
  image_url?: string | null;
  requiresSauce?: boolean;
};

export type MenuSection = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  items: MenuItem[];
};

export const WING_SAUCES = [
  "Buffalo",
  "BBQ",
  "Garlic Parmesan",
  "Lemon Pepper",
  "Honey BBQ",
  "Mango Habanero",
];

export const FOOD_MENU: MenuSection[] = [];

export const DRINKS_MENU: MenuSection[] = [];
