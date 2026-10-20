/**
 * Benzin Hospitality OS — Shared Branding & Theme Contracts
 */

export type ThemePresetId = 'cavalli_classic' | 'modern_dark' | 'clean_light' | 'ocean_blue';

export interface RestaurantBranding {
  primary_color: string;      // e.g. "#0099FF" or "#FF5A1F"
  secondary_color: string;    // e.g. "#E5B13A" (gold)
  accent_color: string;       // e.g. "#14B8A6" (teal)
  background_color: string;   // e.g. "#0C0806" (night)
  card_color: string;         // e.g. "#19120E"
  text_color: string;         // e.g. "#F8F1EA" (cream)
  muted_color: string;        // e.g. "#9C8C7E"
  logo_url: string | null;
  banner_url?: string | null;
  font_family: string;        // e.g. "ui-rounded"
  theme_preset?: ThemePresetId;
}

export type MediaCategory = 'menu' | 'logo' | 'branding' | 'other';
export type MediaSourceType = 'upload' | 'external_url';

export interface RestaurantMedia {
  _id: string;
  restaurant_id: string;
  source_type: MediaSourceType;
  category: MediaCategory;
  storage_provider?: 'gcs' | 'local';
  bucket_name?: string;
  object_key?: string;
  public_url: string;
  external_url?: string;
  original_filename?: string;
  mime_type: string;
  file_size?: number;
  width?: number;
  height?: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export const THEME_PRESETS: Record<ThemePresetId, {
  id: ThemePresetId;
  name: string;
  description: string;
  branding: Omit<RestaurantBranding, 'logo_url' | 'banner_url'>;
}> = {
  cavalli_classic: {
    id: 'cavalli_classic',
    name: 'Cavalli Classic',
    description: 'Deep midnight obsidian with warm gold accents and radiant blue highlights',
    branding: {
      primary_color: '#0099FF',
      secondary_color: '#E5B13A',
      accent_color: '#14B8A6',
      background_color: '#0C0806',
      card_color: '#19120E',
      text_color: '#F8F1EA',
      muted_color: '#9C8C7E',
      font_family: 'ui-rounded',
      theme_preset: 'cavalli_classic',
    },
  },
  modern_dark: {
    id: 'modern_dark',
    name: 'Modern Dark',
    description: 'Sleek dark charcoal styling with high-contrast electric violet and cyan accents',
    branding: {
      primary_color: '#8B5CF6',
      secondary_color: '#06B6D4',
      accent_color: '#10B981',
      background_color: '#111827',
      card_color: '#1F2937',
      text_color: '#F9FAFB',
      muted_color: '#9CA3AF',
      font_family: 'ui-sans-serif',
      theme_preset: 'modern_dark',
    },
  },
  clean_light: {
    id: 'clean_light',
    name: 'Clean Light',
    description: 'Crisp porcelain layout with sophisticated warm accents and emerald details',
    branding: {
      primary_color: '#0284C7',
      secondary_color: '#C5911A',
      accent_color: '#0D9488',
      background_color: '#F7F4EE',
      card_color: '#FFFFFF',
      text_color: '#1A120B',
      muted_color: '#6B5B4E',
      font_family: 'ui-sans-serif',
      theme_preset: 'clean_light',
    },
  },
  ocean_blue: {
    id: 'ocean_blue',
    name: 'Ocean Blue',
    description: 'Atmospheric deep marine theme with vibrant cyan highlights and warm amber cues',
    branding: {
      primary_color: '#00E5FF',
      secondary_color: '#F59E0B',
      accent_color: '#3B82F6',
      background_color: '#0A192F',
      card_color: '#112240',
      text_color: '#E6F1FF',
      muted_color: '#8892B0',
      font_family: 'ui-sans-serif',
      theme_preset: 'ocean_blue',
    },
  },
};
