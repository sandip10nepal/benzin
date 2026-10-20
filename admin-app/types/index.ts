/**
 * Benzin Hospitality OS — React Admin Core Type Definitions
 * Exact Parity with public/admin.html
 */

export type AdminTabId =
  | 'kds'
  | 'tables'
  | 'archive'
  | 'inventory'
  | 'menu'
  | 'sales'
  | 'staff';

export type UserRole =
  | 'owner'
  | 'manager'
  | 'host'
  | 'server'
  | 'bartender'
  | 'chef'
  | 'hookah_maker'
  | 'cashier'
  | 'kitchen'
  | string;

export interface StaffUser {
  id: string;
  name: string;
  role: UserRole;
  position?: string;
  email?: string | null;
  pin?: string;
  hourlyWage?: number;
  isClockedIn?: boolean;
  weeklyHours?: string;
}

export interface RestaurantVenue {
  id: string;
  name: string;
  slug: string;
  code: string;
  isDemo?: boolean;
}

export interface MetricSummary {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  iconName: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  category_ids?: string[];
  categoryIds?: string[];
  superCategory?: 'Hookah' | 'Food' | 'Drinks' | string;
  emoji: string;
  description?: string;
  imageUrl?: string;
  isSpecial?: boolean;
  available?: boolean;
  recipe?: any[];
  modifier_groups?: any[];
  modifierGroups?: any[];
  recipeIngredientsCount?: number;
  modifierGroupsCount?: number;
}

