import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const BACKEND_TUNNEL_URL = 'https://hookah-lounge-backend-833090629754.us-central1.run.app';
export const LOCAL_LAN_URL = 'http://192.168.1.206:3000';

export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    if (window.location.origin) {
      return window.location.origin;
    }
  }

  const hostUri = Constants.expoConfig?.hostUri ||
                  (Constants as any).manifest2?.extra?.expoGo?.developer?.tool ||
                  (Constants as any).manifest?.debuggerHost ||
                  (Constants as any).experienceUrl;

  if (hostUri && typeof hostUri === 'string') {
    if (hostUri.includes('exp.direct') || hostUri.includes('ngrok') || hostUri.includes('trycloudflare') || hostUri.includes('loca.lt')) {
      return BACKEND_TUNNEL_URL;
    }
    const extractedIp = hostUri.split(':')[0].replace(/[^0-9.]/g, '');
    if (extractedIp && extractedIp.split('.').length === 4) {
      return `http://${extractedIp}:3000`;
    }
  }

  return 'http://localhost:3000';
};

export const getApiHeaders = (extraHeaders?: Record<string, string>): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };
};

export const STORAGE_KEYS = {
  DEVICE_TOKEN: '@saas_device_token',
  JWT_TOKEN: '@saas_jwt_token',
  RESTAURANT_CONFIG: '@saas_restaurant_config',
  CUSTOMER_SESSION: '@saas_active_customer_session',
  PAIRED_RESTAURANT_ID: '@saas_paired_restaurant_id',
  PAIRED_RESTAURANT_SLUG: '@saas_paired_restaurant_slug',
  PAIRED_RESTAURANT_NAME: '@saas_paired_restaurant_name',
  PAIRED_TABLE_NUMBER: '@saas_paired_table_number',
};

export interface PublicRestaurantConfig {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    restaurant_code?: string;
    branding: {
      primary_color: string;
      secondary_color: string;
      accent_color: string;
      background_color: string;
      card_color: string;
      text_color: string;
      muted_color: string;
      logo_url: string | null;
      font_family: string;
    };
    settings: {
      currency: string;
      timezone: string;
      require_table_number: boolean;
      enable_tips: boolean;
      tip_options: number[];
      enable_split_payment: boolean;
      tax_config: {
        default_rate: number;
        category_rates: Record<string, number>;
      };
    };
  };
  categories: Array<{
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    menu_type: string;
    sort_order: number;
  }>;
  menu_items: Array<{
    id: string;
    category_id: string;
    name: string;
    price: number;
    desc: string;
    emoji: string;
    image_url: string | null;
    modifier_groups: any[];
    sort_order: number;
  }>;
  tables: Array<{
    id: string;
    number: number;
    label: string;
  }>;
}

export class TenantApiService {
  /**
   * Universal resilient fetch with automatic multi-candidate failover
   */
  private static async resilientFetch(path: string, init?: RequestInit): Promise<Response> {
    const candidateBases = Array.from(new Set([
      getBaseUrl(),
      'https://benzin-backend-833090629754.us-central1.run.app',
      BACKEND_TUNNEL_URL,
      'http://localhost:3000',
    ])).filter(Boolean);

    const headers: Record<string, string> = {
      'Bypass-Tunnel-Reminder': 'true',
      'bypass-tunnel-reminder': 'true',
      ...(init?.headers as Record<string, string> || {}),
    };

    let lastError: any = null;

    for (const base of candidateBases) {
      const fullUrl = `${base}${path}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const res = await fetch(fullUrl, {
          ...init,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok || res.status < 500) {
          return res;
        }
        // Non-500 HTTP response (e.g. 400 Bad Request or 401 Unauthorized) is a valid response from the backend
        return res;
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        console.warn(`[TenantApi] Attempt to ${fullUrl} failed (${err.message}). Trying next endpoint...`);
      }
    }

    throw new Error(`Unable to reach backend. Please reload the app or ensure server is running (${lastError?.message || 'Network error'}).`);
  }

  /**
   * Authenticate device on app startup using stored device_token
   */
  static async authenticateDevice(): Promise<{
    success: boolean;
    token?: string;
    restaurant?: any;
    table?: any;
    device?: any;
    error?: string;
  }> {
    try {
      const deviceToken = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
      if (!deviceToken) {
        return { success: false, error: 'NO_DEVICE_TOKEN' };
      }

      const res = await this.resilientFetch('/api/auth/device', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ device_token: deviceToken }),
      });

      const data = await res.json();
      if (data.success && data.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, data.token);
        if (data.restaurant?.id) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_ID, data.restaurant.id);
        }
        if (data.restaurant?.slug) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_SLUG, data.restaurant.slug);
        }
        if (data.restaurant?.name) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_NAME, data.restaurant.name);
        }
        if (data.table?.number) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER, String(data.table.number));
        }
      }
      return data;
    } catch (err: any) {
      console.warn('[TenantApi] Device auth network failure:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Pair a new device to a restaurant + table
   */
  static async pairDevice(params: {
    restaurant_slug: string;
    table_number: number;
    admin_pin: string;
    device_name: string;
  }): Promise<{
    success: boolean;
    device_token?: string;
    jwt_token?: string;
    restaurant?: { id: string; name: string; slug: string };
    table?: { id: string; number: number; label: string };
    device?: { id: string; name: string };
    error?: string;
  }> {
    try {
      console.log('[TenantApi] Pairing device...');
      const res = await this.resilientFetch('/api/auth/device/pair', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (data.success && data.device_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, data.device_token);
        if (data.jwt_token) {
          await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, data.jwt_token);
        }
        if (data.restaurant?.id) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_ID, data.restaurant.id);
        }
        if (data.restaurant?.slug) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_SLUG, data.restaurant.slug);
        }
        if (data.restaurant?.name) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_NAME, data.restaurant.name);
        }
        if (data.table?.number || params.table_number) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER, String(data.table?.number || params.table_number));
        }
        await AsyncStorage.removeItem(STORAGE_KEYS.RESTAURANT_CONFIG);
      }
      return data;
    } catch (err: any) {
      console.error('[TenantApi] Device pairing error:', err.message);
      return { success: false, error: err.message || 'Could not connect to backend server.' };
    }
  }

  /**
   * Configure / Pair a table device using 8-digit Restaurant & Staff PIN (e.g. 4821-1234)
   */
  static async configureTableDevice(params: {
    restaurant_name?: string;
    restaurant_code?: string;
    table_number: string | number;
    pin: string;
    device_name?: string;
  }): Promise<{
    success: boolean;
    token?: string;
    restaurant?: { id: string; name: string; slug: string; restaurant_code: string; branding?: any };
    table?: { id: string; number: number; label: string };
    authorized_by?: { name: string; role: string };
    device?: { id: string; name: string };
    error?: string;
  }> {
    try {
      console.log('[TenantApi] Configuring table device...');
      const res = await this.resilientFetch('/api/auth/device/configure-table', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (data.success && data.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, data.token);
        if (data.device?.id) {
          await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, data.device.id);
        }
        if (data.restaurant?.id) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_ID, data.restaurant.id);
        }
        if (data.restaurant?.slug) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_SLUG, data.restaurant.slug);
        }
        if (data.restaurant?.name) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_NAME, data.restaurant.name);
        }
        if (params.table_number || data.table?.number) {
          await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER, String(params.table_number || data.table?.number));
        }
        // Invalidate stale menu cache so fresh isolated menu loads instantly
        await AsyncStorage.removeItem(STORAGE_KEYS.RESTAURANT_CONFIG);
      }
      return data;
    } catch (err: any) {
      console.error('[TenantApi] Device configure-table error:', err.message);
      return { success: false, error: err.message || 'Could not connect to backend server.' };
    }
  }

  /**
   * Fetch public restaurant configuration by slug without requiring auth token
   */
  static async fetchConfigBySlug(slug?: string): Promise<PublicRestaurantConfig | null> {
    try {
      const targetSlug = slug || (await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_SLUG)) || 'cavali';

      const res = await this.resilientFetch(`/api/restaurants/slug/${targetSlug}/config?_t=${Date.now()}`, {
        headers: getApiHeaders({ 'Cache-Control': 'no-cache, no-store, must-revalidate' }),
      });
      const data = await res.json();

      if (data.success && data.categories && data.menu_items) {
        await AsyncStorage.setItem(STORAGE_KEYS.RESTAURANT_CONFIG, JSON.stringify(data));
        return data;
      }
      return null;
    } catch (err: any) {
      console.warn('[TenantApi] Slug config fetch failed, trying cached config:', err.message);
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.RESTAURANT_CONFIG);
      return cached ? JSON.parse(cached) : null;
    }
  }

  /**
   * Fetch complete restaurant configuration (branding + menu + settings)
   */
  static async fetchRestaurantConfig(restaurantId?: string): Promise<PublicRestaurantConfig | null> {
    try {
      const targetId = restaurantId || (await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_ID));
      const targetSlug = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_SLUG);

      if (!targetId && targetSlug) {
        return this.fetchConfigBySlug(targetSlug);
      }
      if (!targetId && !targetSlug) {
        return this.fetchConfigBySlug('cavali');
      }

      const jwtToken = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      };
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }

      const res = await this.resilientFetch(`/api/restaurants/${targetId}/config?_t=${Date.now()}`, {
        headers: getApiHeaders(headers),
      });
      const data = await res.json();

      if (data.success && data.categories && data.menu_items) {
        await AsyncStorage.setItem(STORAGE_KEYS.RESTAURANT_CONFIG, JSON.stringify(data));
        return data;
      }

      if (targetSlug) {
        return this.fetchConfigBySlug(targetSlug);
      }
      return null;
    } catch (err: any) {
      console.warn('[TenantApi] Config fetch failed, loading cached config:', err.message);
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.RESTAURANT_CONFIG);
      return cached ? JSON.parse(cached) : null;
    }
  }

  /**
   * Submit live customer order to backend REST endpoint
   */
  static async submitOrder(orderData: any): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const jwtToken = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      const pairedRestId = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_ID);

      const idempotencyKey = orderData.idempotencyKey || orderData.idempotency_key || `idem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const headers: Record<string, string> = {
        'Idempotency-Key': idempotencyKey,
        'idempotency-key': idempotencyKey,
      };
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }
      if (pairedRestId) {
        headers['X-Restaurant-ID'] = pairedRestId;
      }

      const payload = {
        ...orderData,
        idempotencyKey,
        ...(pairedRestId && !orderData.restaurant_id ? { restaurant_id: pairedRestId } : {})
      };

      const res = await this.resilientFetch('/api/orders', {
        method: 'POST',
        headers: getApiHeaders(headers),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success || data.id) {
        return { success: true, orderId: data.id || data.order?.id };
      }
      return { success: false, error: data.error || 'Failed to submit order' };
    } catch (err: any) {
      console.warn('[TenantApi] Submit order network fallback:', err.message);
      return { success: true, orderId: `local-${Date.now()}` };
    }
  }

  /**
   * Dispatch waiter / server assistance request to backend
   */
  static async requestServer(params: { table: string; requestType: string; note?: string; customerName?: string }): Promise<{ success: boolean }> {
    try {
      const pairedRestId = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_ID);
      const jwtToken = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);

      const headers: Record<string, string> = {};
      if (jwtToken) headers['Authorization'] = `Bearer ${jwtToken}`;
      if (pairedRestId) headers['X-Restaurant-ID'] = pairedRestId;

      const res = await this.resilientFetch('/api/orders/server-call', {
        method: 'POST',
        headers: getApiHeaders(headers),
        body: JSON.stringify({
          ...params,
          ...(pairedRestId ? { restaurant_id: pairedRestId } : {})
        }),
      });
      const data = await res.json();
      return { success: Boolean(data.success) };
    } catch (err: any) {
      console.warn('[TenantApi] Server call fallback:', err.message);
      return { success: true };
    }
  }

  /**
   * Unpair current device (e.g. for re-assigning table)
   */
  static async unpairDevice(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.RESTAURANT_CONFIG);
    await AsyncStorage.removeItem(STORAGE_KEYS.PAIRED_RESTAURANT_ID);
    await AsyncStorage.removeItem(STORAGE_KEYS.PAIRED_RESTAURANT_SLUG);
    await AsyncStorage.removeItem(STORAGE_KEYS.PAIRED_RESTAURANT_NAME);
    await AsyncStorage.removeItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER);
  }
}
