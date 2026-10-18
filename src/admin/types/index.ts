/**
 * Benzin Hospitality OS — React Admin Core Type Definitions
 */

export type AdminTabId =
  | 'dashboard'
  | 'kds'
  | 'tables'
  | 'menu'
  | 'inventory'
  | 'staff'
  | 'sales';

export type UserRole =
  | 'owner'
  | 'manager'
  | 'host'
  | 'server'
  | 'bartender'
  | 'chef'
  | 'hookah_maker'
  | 'cashier'
  | 'kitchen';

export interface StaffUser {
  id: string;
  name: string;
  role: UserRole;
  position?: string;
  email?: string | null;
  isClockedIn?: boolean;
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
