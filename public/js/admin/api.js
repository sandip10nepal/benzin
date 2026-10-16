/**
 * Benzin Hospitality OS — API & Tenant Communication Layer
 * Native ES Module: api.js
 */

import { API_URL, state } from './state.js';

/**
 * Retrieve authorization and tenant headers for backend HTTP requests.
 * Uses localStorage persistence to transmit Bearer JWT, tenant restaurant ID, and user info.
 */
export function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('benzin_jwt_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const restId = localStorage.getItem('benzin_restaurant_id') || 'RES_EED4E9D266DF';
  const restCode = localStorage.getItem('benzin_restaurant_code') || '4821';
  headers['x-restaurant-id'] = restId;
  headers['x-restaurant-code'] = restCode;
  
  const uId = localStorage.getItem('benzin_user_id') || 'usr_owner';
  const uName = localStorage.getItem('benzin_user_name') || 'Owner';
  const uRole = localStorage.getItem('benzin_user_role') || 'owner';
  headers['x-user-id'] = uId;
  headers['x-user-name'] = uName;
  headers['x-user-role'] = uRole;
  
  const uPin = localStorage.getItem('benzin_user_pin') || localStorage.getItem('benzin_admin_pin');
  if (uPin) headers['x-admin-pin'] = uPin;
  
  return headers;
}

/**
 * Extract tenant credentials from the browser URL search query if provided.
 * Supports: ?code=4821 or ?restaurant_id=RES_... or ?slug=cavali
 */
export function initTenantFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || params.get('restaurant_code');
    const slug = params.get('slug') || params.get('restaurant_slug') || params.get('restaurant');
    const rid = params.get('restaurant_id') || params.get('rid') || params.get('id');

    if (code) {
      localStorage.setItem('benzin_restaurant_code', code);
      const codeInput = document.getElementById('loginVenueCode');
      if (codeInput) codeInput.value = code;
    }
    if (slug) {
      localStorage.setItem('benzin_selected_slug', slug);
    }
    if (rid) {
      localStorage.setItem('benzin_restaurant_id', rid);
    }
  } catch (e) {
    console.warn('[Tenant] Error parsing URL tenant params:', e);
  }
}

/**
 * Verify restaurant venue with backend and populate staff roster dropdown.
 */
export async function verifyRestaurantVenue() {
  const codeInput = document.getElementById('loginVenueCode');
  const statusEl = document.getElementById('loginVenueStatus');
  const rCode = (codeInput && codeInput.value.trim()) || localStorage.getItem('benzin_restaurant_code') || '4821';

  if (!rCode) {
    if (statusEl) {
      statusEl.innerText = 'Please enter a valid Venue ID';
      statusEl.style.color = 'var(--gold)';
    }
    const fieldsCont = document.getElementById('loginStaffFieldsContainer');
    if (fieldsCont) fieldsCont.style.display = 'none';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/staff-roster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurant_code: rCode })
    });
    const data = await res.json();
    if (data.success && data.restaurant) {
      localStorage.setItem('benzin_restaurant_id', data.restaurant.id);
      localStorage.setItem('benzin_restaurant_name', data.restaurant.name);
      localStorage.setItem('benzin_selected_slug', data.restaurant.slug);
      localStorage.setItem('benzin_restaurant_code', data.restaurant.restaurant_code);

      const headerNameEl = document.getElementById('currentRestaurantName');
      if (headerNameEl) headerNameEl.innerText = data.restaurant.name;

      if (statusEl) {
        statusEl.innerText = `Verified Venue: ${data.restaurant.name}`;
        statusEl.style.color = 'var(--success)';
      }

      const select = document.getElementById('loginStaffSelect');
      if (select && Array.isArray(data.staff)) {
        state.employeesList = data.staff;
        select.innerHTML = data.staff.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
      }

      const fieldsCont = document.getElementById('loginStaffFieldsContainer');
      if (fieldsCont) fieldsCont.style.display = 'block';
    } else {
      if (statusEl) {
        statusEl.innerText = (data.error || 'Invalid Venue ID');
        statusEl.style.color = 'var(--gold)';
      }
      const fieldsCont = document.getElementById('loginStaffFieldsContainer');
      if (fieldsCont) fieldsCont.style.display = 'none';
    }
  } catch (err) {
    if (statusEl) {
      statusEl.innerText = 'Network error verifying venue: ' + err.message;
      statusEl.style.color = 'var(--gold)';
    }
    const fieldsCont = document.getElementById('loginStaffFieldsContainer');
    if (fieldsCont) fieldsCont.style.display = 'none';
  }
}
