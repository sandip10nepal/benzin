export type RestaurantThemeConfig = {
  id: string;
  name: string;
  tagline: string;
  tableNumber: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  mode?: 'dark' | 'light';
};

export type ModifierOption = {
  id: string;
  name: string;
  price: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  required?: boolean;
  minSelect?: number;
  maxSelect?: number;
  options: ModifierOption[];
};

export type MenuCategory = {
  _id: string;
  id: string;
  restaurant_id?: string;
  parent_id: string | null;
  name: string;
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  active: boolean;
};

export type MenuItem = {
  id: string;
  _id?: string;
  restaurant_id?: string;
  category_id?: string;
  category_ids?: string[];
  name: string;
  price: number;
  description: string;
  desc?: string;
  emoji?: string;
  imageKey?: string;
  imageUrl?: string;
  image_url?: string | null;
  sort_order?: number;
  available?: boolean;
  active?: boolean;
  badge?: string;
  isPopular?: boolean;
  isNew?: boolean;
  recipe?: any[];
  modifierGroups?: ModifierGroup[];
  variants?: any[];
  category?: string;
  subcategory?: string;
  brand?: string;
  color?: string;
  tags?: string[];
};

export type SelectedModifier = {
  groupId?: string;
  groupName?: string;
  optionId?: string;
  optionName: string;
  price: number;
  id?: string;
  name?: string;
};

export type CartItem = {
  cartItemId: string;
  item: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  specialInstructions?: string;
  notes?: string;
  itemTotal: number;
};

export type ServerRequestType = 
  | 'COAL_REFILL'
  | 'server'
  | 'water'
  | 'coals'
  | 'utensils'
  | 'check'
  | 'custom';

export type ServerRequestStatus = {
  id: string;
  type: ServerRequestType;
  label: string;
  requestedAt: Date | string;
  customNote?: string;
  status: 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  tableNumber?: string;
  table_id?: string;
};

export type ScreenState = 
  | 'splash'
  | 'pairing'
  | 'home'
  | 'menu'
  | 'start_order'
  | 'order_confirmation'
  | 'mix_lab';

export type ConversationStep = 
  | 'welcome_category'
  | 'select_hookah'
  | 'customize_hookah'
  | 'prompt_food'
  | 'select_food'
  | 'customize_food'
  | 'prompt_drink'
  | 'select_drink'
  | 'review_summary';

export type HookahFlavorCategory = 
  | 'fruity'
  | 'classic'
  | 'lit'
  | 'signature'
  | 'mint';

export type HookahFlavor = {
  id: string;
  name: string;
  brand?: string;
  category: HookahFlavorCategory | string;
  description: string;
  color: string;
  emoji: string;
  tags: string[];
  sweetness?: number; // 1 to 5
  freshness?: number; // 1 to 5
  fruitiness?: number; // 1 to 5
  intensity?: number; // 1 to 5
  coolness?: number; // 1 to 5
};

export type FlavorInMix = {
  flavor: HookahFlavor;
  percentage: number;
};

export type HouseMixRecipe = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  price: number;
  color: string;
  imageKey?: string;
  flavors: { flavorId: string; percentage: number }[];
};
