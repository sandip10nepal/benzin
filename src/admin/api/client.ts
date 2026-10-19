/**
 * Benzin Hospitality OS — Live Database & Multi-Tenant API Client
 * Connects directly to backend API routes wired to MongoDB Atlas.
 */

import { RestaurantVenue, StaffUser } from '../types';

export class AdminApiClient {
  public baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }

  /**
   * Resolve current tenant parameters from URL query or localStorage
   */
  public getTenantParams(): { restaurantId: string; restaurantCode: string; restaurantSlug: string } {
    let restaurantId = 'RES_EED4E9D266DF';
    let restaurantCode = '4821';
    let restaurantSlug = 'cavali';

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
      'x-restaurant-id': restaurantId,
      'x-restaurant-code': restaurantCode,
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('benzin_jwt_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const uId = localStorage.getItem('benzin_user_id') || 'usr_owner';
      const uName = localStorage.getItem('benzin_user_name') || 'Owner';
      const uRole = localStorage.getItem('benzin_user_role') || 'owner';
      headers['x-user-id'] = uId;
      headers['x-user-name'] = uName;
      headers['x-user-role'] = uRole;

      const uPin = localStorage.getItem('benzin_user_pin') || localStorage.getItem('benzin_admin_pin') || '1234';
      if (uPin) headers['x-admin-pin'] = uPin;
    }

    return headers;
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         VENUE & USER SESSION                                */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getVenueInfo(): Promise<RestaurantVenue> {
    const { restaurantId, restaurantCode, restaurantSlug } = this.getTenantParams();
    try {
      const res = await fetch(`${this.baseUrl}/api/restaurants/${restaurantId}`, {
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (data.success && data.restaurant) {
        return {
          id: data.restaurant._id,
          name: data.restaurant.name || 'Cavalli Lounge',
          slug: data.restaurant.slug || restaurantSlug,
          code: data.restaurant.restaurant_code || restaurantCode,
          isDemo: false,
        };
      }
    } catch (_) {}

    return {
      id: restaurantId,
      name: 'Cavalli',
      slug: restaurantSlug,
      code: restaurantCode,
      isDemo: false,
    };
  }

  async getCurrentUser(): Promise<StaffUser> {
    let name = 'Sandip Nepal';
    let role = 'owner';
    let id = 'usr_owner';

    if (typeof window !== 'undefined') {
      name = localStorage.getItem('benzin_user_name') || name;
      role = localStorage.getItem('benzin_user_role') || role;
      id = localStorage.getItem('benzin_user_id') || id;
    }

    return {
      id,
      name,
      role,
      position: role.toUpperCase(),
      email: 'owner@cavalli.com',
      isClockedIn: true,
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
      method: 'PUT',
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

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*                         SALES & TAX LEDGER                                  */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  async getSalesSummary(): Promise<{ daily: any; weekly: any; monthly: any; yearly: any; payment_logs: any[] } | null> {
    const { restaurantSlug, restaurantId } = this.getTenantParams();
    try {
      const res = await fetch(`${this.baseUrl}/api/orders/sales/summary?restaurant_slug=${encodeURIComponent(restaurantSlug)}&restaurant_id=${encodeURIComponent(restaurantId)}&authPin=1234`, {
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
}

export const apiClient = new AdminApiClient();
