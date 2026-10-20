/**
 * Benzin Hospitality OS — Live Database & Multi-Tenant API Client
 * Connects directly to backend API routes wired to MongoDB Atlas.
 */

import { RestaurantVenue, StaffUser } from '../types';

export class AdminApiClient {
  public baseUrl: string;

  constructor() {
    if (typeof window !== 'undefined') {
      if (window.location.port === '3001') {
        this.baseUrl = 'http://localhost:3000';
      } else {
        this.baseUrl = window.location.origin;
      }
    } else {
      this.baseUrl = 'http://localhost:3000';
    }
  }

  /**
   * Resolve current tenant parameters from URL query or localStorage
   */
  public getTenantParams(): { restaurantId: string; restaurantCode: string; restaurantSlug: string } {
    let restaurantId = '';
    let restaurantCode = '';
    let restaurantSlug = '';

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qRid = params.get('restaurant_id') || params.get('rid') || params.get('id');
      const qCode = params.get('restaurant_code') || params.get('code');
      const qSlug = params.get('restaurant_slug') || params.get('slug') || params.get('restaurant');

      if (qRid) restaurantId = qRid;
      else if (localStorage.getItem('benzin_restaurant_id')) {
        restaurantId = localStorage.getItem('benzin_restaurant_id')!;
      }

      if (qCode) restaurantCode = qCode;
      else if (localStorage.getItem('benzin_restaurant_code')) {
        restaurantCode = localStorage.getItem('benzin_restaurant_code')!;
      }

      if (qSlug) restaurantSlug = qSlug;
      else if (localStorage.getItem('benzin_selected_slug')) {
        restaurantSlug = localStorage.getItem('benzin_selected_slug')!;
      }
    }

    return { restaurantId, restaurantCode, restaurantSlug };
  }

  /**
   * Get safe headers with authentication token and tenant headers for backend requests
   */
  public getHeaders(): Record<string, string> {
    const { restaurantId, restaurantCode } = this.getTenantParams();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (restaurantId) headers['x-restaurant-id'] = restaurantId;
    if (restaurantCode) headers['x-restaurant-code'] = restaurantCode;

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('benzin_jwt_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const uId = localStorage.getItem('benzin_user_id');
      const uName = localStorage.getItem('benzin_user_name');
      const uRole = localStorage.getItem('benzin_user_role');
      if (uId) headers['x-user-id'] = uId;
      if (uName) headers['x-user-name'] = uName;
      if (uRole) headers['x-user-role'] = uRole;

      const uPin = localStorage.getItem('benzin_user_pin') || localStorage.getItem('benzin_admin_pin');
      if (uPin) headers['x-admin-pin'] = uPin;
    }

    return headers;
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         VENUE & USER SESSION                                */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getVenueInfo(): Promise<RestaurantVenue> {
    const { restaurantId, restaurantCode, restaurantSlug } = this.getTenantParams();
    if (!restaurantId) {
      return { id: '', name: '', slug: '', code: '', isDemo: false };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/restaurants/${restaurantId}`, {
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (data.success && data.restaurant) {
        return {
          id: data.restaurant._id || data.restaurant.id || restaurantId,
          name: data.restaurant.name || '',
          slug: data.restaurant.slug || restaurantSlug,
          code: data.restaurant.restaurant_code || restaurantCode,
          isDemo: Boolean(data.restaurant.isDemo),
        };
      }
    } catch (_) {}

    return {
      id: restaurantId,
      name: typeof window !== 'undefined' ? localStorage.getItem('benzin_restaurant_name') || '' : '',
      slug: restaurantSlug,
      code: restaurantCode,
      isDemo: false,
    };
  }

  async getCurrentUser(): Promise<StaffUser> {
    let name = '';
    let role = 'staff';
    let id = '';
    let position = '';
    let email = '';
    let isClockedIn = false;

    if (typeof window !== 'undefined') {
      name = localStorage.getItem('benzin_user_name') || '';
      role = localStorage.getItem('benzin_user_role') || 'staff';
      id = localStorage.getItem('benzin_user_id') || '';
      position = localStorage.getItem('benzin_user_position') || (role ? role.toUpperCase() : 'Staff');
      email = localStorage.getItem('benzin_user_email') || '';
      isClockedIn = localStorage.getItem('benzin_user_clocked_in') === 'true';
    }

    return {
      id,
      name,
      role: role as any,
      position: position || (role ? role.toUpperCase() : 'Staff'),
      email,
      isClockedIn,
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         EMPLOYEES & PAYROLL                                 */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getEmployees(): Promise<any[]> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const url = `${this.baseUrl}/api/employees?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const data = await res.json();
    return data.success && Array.isArray(data.employees) ? data.employees : [];
  }

  async getPayrollSummary(): Promise<any> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const url = `${this.baseUrl}/api/employees/payroll/summary?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const data = await res.json();
    return data.success && data.summary ? data.summary : null;
  }

  async getTimecards(userId?: string): Promise<any[]> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    let url = `${this.baseUrl}/api/employees/timecards?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`;
    if (userId) url += `&userId=${encodeURIComponent(userId)}`;
    try {
      const res = await fetch(url, { headers: this.getHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.timecards)) return data.timecards;
    } catch (_) {}
    return [];
  }

  async fulfillWeeklyPayroll(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/api/employees/payroll/fulfill`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/api/employees/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         TABLES & SESSIONS                                   */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getTables(): Promise<any[]> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const url = `${this.baseUrl}/api/tables?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const data = await res.json();
    return data.success && Array.isArray(data.tables) ? data.tables : [];
  }

  async resetTable(tableId: string, orderId?: string): Promise<{ success: boolean; message: string }> {
    const headers = this.getHeaders();
    if (orderId) {
      try {
        const res = await fetch(`${this.baseUrl}/api/orders/${orderId}/reset-table`, {
          method: 'POST',
          headers,
        });
        const data = await res.json();
        if (data.success) return data;
      } catch (_) {}
    }

    const res = await fetch(`${this.baseUrl}/api/tables/${tableId}/reset`, {
      method: 'POST',
      headers,
    });
    return res.json();
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         ORDERS & KDS TICKETS                                */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getOrders(activeOnly = false): Promise<any[]> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const url = `${this.baseUrl}/api/orders?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}${activeOnly ? '&active=true' : ''}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data.success && Array.isArray(data.orders)) return data.orders;
    return [];
  }

  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         INVENTORY STOCK                                     */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getInventory(): Promise<{ inventory: Record<string, any>; categories: any[] }> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const headers = this.getHeaders();
    const [invRes, catRes] = await Promise.all([
      fetch(`${this.baseUrl}/api/orders/inventory?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, { headers }),
      fetch(`${this.baseUrl}/api/orders/inventory/categories?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, { headers }),
    ]);

    const invData = await invRes.json();
    const catData = await catRes.json();

    const inventory = invData.success ? (invData.inventory || invData.rawMaterials || {}) : {};
    const categories = catData.success && Array.isArray(catData.categories) ? catData.categories : [];

    return { inventory, categories };
  }

  async adjustInventory(itemId: string, amount: number, action: 'add' | 'remove'): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/orders/inventory/adjust`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ item_id: itemId, amount, action }),
    });
    return res.json();
  }

  async saveInventoryCategory(cat: { id?: string; title: string; icon: string }): Promise<any> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const pin = typeof window !== 'undefined' ? (localStorage.getItem('benzin_user_pin') || localStorage.getItem('benzin_admin_pin') || '') : '';
    const url = cat.id
      ? `${this.baseUrl}/api/orders/inventory/categories/update?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`
      : `${this.baseUrl}/api/orders/inventory/categories?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`;
    const body = cat.id
      ? { id: cat.id, title: cat.title, icon: cat.icon, authPin: pin, pin }
      : { title: cat.title, icon: cat.icon, authPin: pin, pin };
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  }

  async deleteInventoryCategory(id: string): Promise<any> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const pin = typeof window !== 'undefined' ? (localStorage.getItem('benzin_user_pin') || localStorage.getItem('benzin_admin_pin') || '') : '';
    const res = await fetch(`${this.baseUrl}/api/orders/inventory/categories/delete?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id, authPin: pin, pin }),
    });
    return await res.json();
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         MENU CATALOG                                        */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getMenu(): Promise<{ items: any[]; categories: any[] }> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const headers = this.getHeaders();
    const [menuRes, catRes] = await Promise.all([
      fetch(`${this.baseUrl}/api/menu?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, { headers }),
      fetch(`${this.baseUrl}/api/v2/menu/categories?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, { headers }),
    ]);

    const menuData = await menuRes.json();
    const catData = await catRes.json();

    const items = menuData.success && Array.isArray(menuData.items) ? menuData.items : (Array.isArray(menuData) ? menuData : []);
    const categories = catData.success && Array.isArray(catData.categories) ? catData.categories : (Array.isArray(catData) ? catData : []);

    return { items, categories };
  }

  async saveMenuItem(item: any): Promise<any> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const id = item.id || item._id;
    const url = id
      ? `${this.baseUrl}/api/menu/${encodeURIComponent(id)}?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`
      : `${this.baseUrl}/api/menu?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`;
    const method = id ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(item),
    });
    return await res.json();
  }

  async deleteMenuItem(id: string): Promise<any> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const res = await fetch(`${this.baseUrl}/api/menu/${encodeURIComponent(id)}?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return await res.json();
  }

  async saveMenuCategory(cat: any): Promise<any> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const id = cat.id || cat._id;
    const isSuper = cat.isSuper || cat.is_super || cat.parent_id === null;
    const payload = {
      name: cat.title || cat.name,
      title: cat.title || cat.name,
      description: cat.subtitle || cat.description || '',
      subtitle: cat.subtitle || cat.description || '',
      icon: cat.icon || (isSuper ? '👑' : '📋'),
      color: cat.color || '#6366F1',
      is_super: isSuper,
      parent_id: cat.parent_id !== undefined ? cat.parent_id : (isSuper ? null : null),
      menu_type: cat.menu_type || (isSuper ? (cat.title || '').toLowerCase().replace(/[^a-z0-9]/g, '_') : 'hookah'),
    };
    const url = id
      ? `${this.baseUrl}/api/v2/menu/categories/${encodeURIComponent(id)}?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`
      : `${this.baseUrl}/api/v2/menu/categories?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`;
    const method = id ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  async deleteMenuCategory(id: string): Promise<any> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const res = await fetch(`${this.baseUrl}/api/v2/menu/categories/${encodeURIComponent(id)}?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return await res.json();
  }

  async getSpecials(): Promise<any[]> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    try {
      const res = await fetch(`${this.baseUrl}/api/menu/specials?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, {
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.specials)) return data.specials;
    } catch (_) {}
    return [];
  }

  async saveSpecials(specials: any[]): Promise<any> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const res = await fetch(`${this.baseUrl}/api/menu/specials?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ specials }),
    });
    return await res.json();
  }

  async getHookahConfig(): Promise<any> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    try {
      const res = await fetch(`${this.baseUrl}/api/menu/hookah-config?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, {
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (data.success && data.hookah_config) return data.hookah_config;
    } catch (_) {}
    return null;
  }

  async saveHookahConfig(config: any): Promise<any> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const res = await fetch(`${this.baseUrl}/api/menu/hookah-config?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ hookah_config: config }),
    });
    return await res.json();
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         SALES & TAX LEDGER                                  */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getSalesSummary(): Promise<{ daily: any; weekly: any; monthly: any; yearly: any; payment_logs: any[] } | null> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const pin = typeof window !== 'undefined' ? (localStorage.getItem('benzin_user_pin') || localStorage.getItem('benzin_admin_pin') || '') : '';
    let url = `${this.baseUrl}/api/orders/sales/summary?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`;
    if (pin) url += `&authPin=${encodeURIComponent(pin)}`;

    try {
      const res = await fetch(url, {
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (data.success && data.analytics) {
        return data.analytics;
      }
    } catch (e) {
      console.warn('Failed to fetch sales summary:', e);
    }
    return null;
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         SERVICE CALL REQUESTS                              */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getServiceRequests(): Promise<any[]> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    try {
      const res = await fetch(`${this.baseUrl}/api/service-requests?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, {
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (data.success && Array.isArray(data.requests)) return data.requests;
    } catch (e) {
      console.warn('Failed to fetch service requests:', e);
    }
    return [];
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         VIBE QUEST QUESTIONS                               */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getVibeQuest(): Promise<any[]> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    try {
      const adminRes = await fetch(`${this.baseUrl}/api/vibe-quest/admin/settings?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, {
        headers: this.getHeaders(),
      });
      if (adminRes.ok) {
        const data = await adminRes.json();
        const rawQuestions = data.draft?.questions || data.questions || data.published?.questions || data.settings?.draft?.questions || [];
        if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
          return rawQuestions;
        }
      }
    } catch (e) {
      console.warn('Failed admin/settings for vibe quest, falling back to public config:', e);
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/vibe-quest?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, {
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (data.success && data.config && Array.isArray(data.config.questions)) {
        return data.config.questions;
      }
    } catch (e) {
      console.warn('Failed to fetch vibe-quest questions:', e);
    }
    return [];
  }

  async saveVibeQuest(questions: any[], settings?: any): Promise<any> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    const res = await fetch(`${this.baseUrl}/api/vibe-quest/admin/save-questions?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ questions, settings }),
    });
    return await res.json();
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         AUTHENTICATION METHODS                             */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async verifySession(): Promise<{ valid: boolean; session_id?: string; user?: any; restaurant?: any }> {
    if (typeof window === 'undefined') return { valid: false };
    const token = localStorage.getItem('benzin_jwt_token');
    const uId = localStorage.getItem('benzin_user_id');
    const rId = localStorage.getItem('benzin_restaurant_id');

    if (!token || !uId || !rId) {
      return { valid: false };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/auth/session`, {
        headers: this.getHeaders(),
      });
      if (res.status === 401 || res.status === 403) {
        return { valid: false };
      }
      if (!res.ok) {
        return { valid: true };
      }
      const data = await res.json();
      if (data && data.valid && data.success) {
        if (data.session_id) {
          localStorage.setItem('benzin_session_id', data.session_id);
        }
        return data;
      }
      return { valid: false };
    } catch (_) {
      return { valid: true };
    }
  }

  async verifyVenue(venueCode: string): Promise<{ success: boolean; restaurant?: any; staff?: any[]; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/staff-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_code: venueCode.trim() }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying venue' };
    }
  }

  async staffLogin(params: { restaurant_code: string; user_id: string; pin: string }): Promise<{ success: boolean; token?: string; user?: any; restaurant?: any; message?: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/staff-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_code: params.restaurant_code,
          user_id: params.user_id,
          pin: params.pin,
          action: 'login',
        }),
      });
      const data = await res.json();
      if (data.success && data.token && typeof window !== 'undefined') {
        const sessionId = `sess_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
        localStorage.setItem('benzin_session_id', sessionId);
        localStorage.setItem('benzin_jwt_token', data.token);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying staff PIN' };
    }
  }

  async managerLogin(params: { email: string; password: string; restaurant_code?: string }): Promise<{ success: boolean; token?: string; user?: any; restaurant?: any; message?: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/manager-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: params.email.trim(),
          password: params.password.trim(),
          pin: params.password.trim(),
          restaurant_code: params.restaurant_code?.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.token && typeof window !== 'undefined') {
        const sessionId = `sess_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
        localStorage.setItem('benzin_session_id', sessionId);
        localStorage.setItem('benzin_jwt_token', data.token);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during manager login' };
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('benzin_session_id');
      localStorage.removeItem('benzin_jwt_token');
      localStorage.removeItem('benzin_user_id');
      localStorage.removeItem('benzin_user_name');
      localStorage.removeItem('benzin_user_role');
      localStorage.removeItem('benzin_user_pin');
      localStorage.removeItem('benzin_user_position');
      localStorage.removeItem('benzin_restaurant_id');
      localStorage.removeItem('benzin_selected_slug');
      localStorage.removeItem('benzin_restaurant_code');
      localStorage.removeItem('benzin_restaurant_name');
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         MEDIA MANAGEMENT & GCS                              */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async uploadMediaFile(
    file: File,
    category: 'menu' | 'logo' | 'branding' | 'other' = 'menu'
  ): Promise<{ success: boolean; media?: any; url?: string; error?: string }> {
    try {
      const headers = { ...this.getHeaders() };
      delete headers['Content-Type']; // Let browser set multipart boundary

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await fetch(`${this.baseUrl}/api/media/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during image upload' };
    }
  }

  async saveExternalMediaUrl(
    url: string,
    category: 'menu' | 'logo' | 'branding' | 'other' = 'menu',
    name?: string
  ): Promise<{ success: boolean; media?: any; url?: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/media/external`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ url: url.trim(), category, name }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error saving external image URL' };
    }
  }

  async listRestaurantMedia(
    category?: string,
    limit = 50,
    skip = 0
  ): Promise<{ success: boolean; media: any[]; total: number; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      params.set('limit', String(limit));
      params.set('skip', String(skip));

      const res = await fetch(`${this.baseUrl}/api/media?${params.toString()}`, {
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.media)) {
        return { success: true, media: data.media, total: data.total ?? data.media.length };
      }
      return { success: false, media: [], total: 0, error: data.error || 'Failed to list media' };
    } catch (err: any) {
      return { success: false, media: [], total: 0, error: err.message || 'Network error listing media' };
    }
  }

  async deleteRestaurantMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/media/${mediaId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error deleting media' };
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                     RESTAURANT BRANDING & THEMES                            */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getRestaurantDetails(
    restaurantId?: string
  ): Promise<{ success: boolean; restaurant?: any; error?: string }> {
    try {
      const rid = restaurantId || this.getTenantParams().restaurantId;
      if (!rid) return { success: false, error: 'Restaurant ID missing' };

      const res = await fetch(`${this.baseUrl}/api/restaurants/${rid}`, {
        headers: this.getHeaders(),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching restaurant details' };
    }
  }

  async updateRestaurantBranding(
    restaurantId: string,
    branding: any,
    name?: string
  ): Promise<{ success: boolean; restaurant?: any; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ branding, name }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error saving restaurant branding' };
    }
  }
}

export const apiClient = new AdminApiClient();
