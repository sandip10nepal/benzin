/**
 * Benzin Hospitality OS — Isolated Admin API Client Foundation
 * Strictly avoids connecting to production services during development.
 */

import { RestaurantVenue, StaffUser } from '../types';

// Mock dataset for isolated Phase 1 development & smoke testing
export const MOCK_VENUE: RestaurantVenue = {
  id: 'RES_EED4E9D266DF',
  name: 'Cavalli Lounge (Dev Isolation)',
  slug: 'cavali',
  code: '4821',
  isDemo: true,
};

export const MOCK_STAFF: StaffUser = {
  id: 'USR_OWNER_DEV',
  name: 'Sandip Nepal',
  role: 'owner',
  position: 'Owner & Operator',
  email: 'owner@cavalli.com',
  isClockedIn: true,
};

export class AdminApiClient {
  public baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }

  /**
   * Get safe headers with authentication token if present in localStorage
   */
  public getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-restaurant-id': MOCK_VENUE.id,
      'x-restaurant-code': MOCK_VENUE.code,
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('benzin_jwt_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Get active venue context (Mocked in Phase 1 for strict production isolation)
   */
  async getVenueInfo(): Promise<RestaurantVenue> {
    // In future phases this will fetch(`${this.baseUrl}/api/restaurants/...`, { headers: this.getHeaders() })
    return Promise.resolve(MOCK_VENUE);
  }

  /**
   * Get active session user (Mocked in Phase 1 for strict production isolation)
   */
  async getCurrentUser(): Promise<StaffUser> {
    return Promise.resolve(MOCK_STAFF);
  }
}

export const apiClient = new AdminApiClient();
