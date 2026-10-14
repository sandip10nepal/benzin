export type VibeQuestStage = 'hookah' | 'food' | 'dessert' | 'drinks' | 'checkout';

export type VibeQuestQuestionType = 'single_select' | 'multi_select';

export type VibeQuestDestinationType =
  | 'question'
  | 'recommendations'
  | 'product'
  | 'product_customization'
  | 'category'
  | 'custom_mix_lab'
  | 'daku'
  | 'next_stage'
  | 'end_discovery'
  | 'skip';

export interface VibeQuestDestinationObject {
  type: VibeQuestDestinationType;
  ref_id?: string;
  [key: string]: any;
}

export type VibeQuestDestination = VibeQuestDestinationObject | string;

export type VibeQuestConditionOperator =
  | 'answer_selected'
  | 'answer_not_selected'
  | 'signal_present'
  | 'question_answered'
  | 'question_skipped'
  | 'question_not_seen'
  | 'stage_is'
  | 'cart_has_category'
  | 'cart_not_has_category'
  | 'cart_has_product'
  | 'cart_not_has_product'
  | 'product_available'
  | 'recommendation_selected';

export interface VibeQuestCondition {
  operator: VibeQuestConditionOperator;
  field?: string;
  value?: any;
}

export interface VibeQuestBranchRule {
  id: string;
  description?: string;
  conditions: VibeQuestCondition[];
  destination: VibeQuestDestination;
}

export interface VibeQuestAnswer {
  id: string;
  label: string;
  emoji?: string;
  icon?: string;
  description?: string;
  subtitle?: string;
  subtext?: string;
  active: boolean;
  sort_order: number;
  signals?: string[];
  preference_signals?: string[];
  weights?: Record<string, number>;
  pinned_product_ids?: string[];
  curated_product_ids?: string[];
  eligible_category_ids?: string[];
  excluded_product_ids?: string[];
  destination?: VibeQuestDestination;
  conditions?: VibeQuestCondition[];
  branching_rules?: any[];
}

export type VibeQuestRepeatPolicy = 'show_once' | 'show_always' | 'suppress_if_skipped' | 'cart_conditional' | 'once_per_session';

export interface VibeQuestRecommendationConfig {
  result_count?: number;
  min_score?: number;
  diversity_limit_per_category?: number;
  eligible_category_ids?: string[];
  excluded_product_ids?: string[];
  fallback_category_id?: string;
  inline?: boolean;
}

export interface VibeQuestQuestion {
  id: string;
  stage: VibeQuestStage;
  navigation_trigger?: 'start_order' | 'next_food' | 'next_drinks' | string;
  title: string;
  question_text: string;
  question?: string;
  helper_text?: string;
  emoji?: string;
  icon?: string;
  type: VibeQuestQuestionType;
  active: boolean;
  order?: number;
  sort_order: number;
  priority?: number;
  required: boolean;
  skippable: boolean;
  repeat_policy: VibeQuestRepeatPolicy;
  display_conditions?: VibeQuestCondition[];
  curated_product_ids?: string[];
  pinned_product_ids?: string[];
  answers: VibeQuestAnswer[];
  default_destination?: VibeQuestDestination;
  branches?: VibeQuestBranchRule[];
  recommendation_config?: VibeQuestRecommendationConfig;
}

export interface VibeQuestConfigSettings {
  hookah_selection_screen_enabled?: boolean;
  dessert_reminder_enabled?: boolean;
  dessert_reminder_text?: string;
  dessert_destination_category?: string;
  dessert_featured_product_ids?: string[];
  drink_reminder_enabled?: boolean;
  drink_reminder_text?: string;
  drink_destination_category?: string;
  drink_featured_product_ids?: string[];
  dessert_category_ids?: string[];
  drink_category_ids?: string[];
  dessert_trigger_stage?: VibeQuestStage;
  intro_title?: string;
  intro_subtitle?: string;
  reactions?: Record<string, string>;
  mix_lab_destination?: string;
  default_rec_count?: number;
  diversity_limit_per_category?: number;
  checkout_upsell_stage?: string;
  [key: string]: any;
}

export interface VibeQuestConfig {
  version: number;
  enabled: boolean;
  questions: VibeQuestQuestion[];
  settings: VibeQuestConfigSettings;
  product_tags?: Record<string, string[]>;
  updated_at?: string;
  published_at?: string;
}

export interface VibeQuestSessionState {
  answers: Record<string, string[]>;
  signals: Record<string, number>;
  questions_shown: string[];
  questions_answered: string[];
  questions_skipped: string[];
  questions_dismissed: string[];
  recommendations_shown: string[];
  recommendations_selected: string[];
  cart_items_added: string[];
  current_stage: VibeQuestStage;
  config_version?: number;
}
