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

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'hookah' | 'food' | 'drinks';
  subcategory?: string;
  badge?: string;
  imageKey?: string;
  imageUrl?: string;
  isPopular?: boolean;
  isNew?: boolean;
  modifierGroups?: ModifierGroup[];
};

export type SelectedModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
};

export type CartItem = {
  cartItemId: string;
  item: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  specialInstructions?: string;
  itemTotal: number;
};

export type ServerRequestType = 
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
  requestedAt: Date;
  customNote?: string;
  status: 'pending' | 'acknowledged' | 'completed';
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
  category: HookahFlavorCategory;
  description: string;
  color: string;
  emoji: string;
  tags: string[];
  sweetness: number; // 1 to 5
  freshness: number; // 1 to 5
  fruitiness: number; // 1 to 5
  intensity: number; // 1 to 5
  coolness: number; // 1 to 5
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
