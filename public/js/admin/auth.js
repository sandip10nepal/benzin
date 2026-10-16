/**
 * Benzin Hospitality OS — Authentication & Staff Switching Module
 * Native ES Module: auth.js
 */

import { API_URL, state, clearInMemoryState } from './state.js';
import { getAuthHeaders, verifyRestaurantVenue } from './api.js';

/**
 * Check if the active logged in user has Manager, Owner, or Admin privileges.
 */
export function isManagerOrOwnerUser() {
  const role = (localStorage.getItem('benzin_user_role') || 'owner').toLowerCase();
  return role === 'owner' || role === 'manager' || role === 'admin' || role === 'platform_admin';
}

/**
 * Check authentication status and toggle login overlay vs main dashboard.
 */
export function checkLoginStatus() {
  const token = localStorage.getItem('benzin_jwt_token');
  const userName = localStorage.getItem('benzin_user_name');
  const userRole = localStorage.getItem('benzin_user_role');
  const venueName = localStorage.getItem('benzin_restaurant_name');
  const overlay = document.getElementById('benzinLoginOverlay');

  const restNameEl = document.getElementById('currentRestaurantName');
  if (venueName && restNameEl) {
    restNameEl.innerText = venueName;
  }

  if (!token && !userName) {
    if (overlay) overlay.style.display = 'flex';
    loadStaffDropdown();
  } else {
    if (overlay) overlay.style.display = 'none';
    const nameEl = document.getElementById('headerStaffName');
    if (nameEl) nameEl.innerText = userName || 'Manager';
    const roleEl = document.getElementById('headerStaffRole');
    if (roleEl) roleEl.innerText = (userRole || 'OWNER').toUpperCase();
    
    if (typeof window.updateNavTabLockBadges === 'function') {
      window.updateNavTabLockBadges();
    }
    syncActiveShiftTimer();
  }
}

/**
 * Load staff accounts into login dropdown after venue verification.
 */
export async function loadStaffDropdown() {
  const codeInput = document.getElementById('loginVenueCode');
  if (codeInput && codeInput.value.trim()) {
    await verifyRestaurantVenue();
  }
}

/**
 * Switch login mode tab between Staff PIN pad and Manager Email/Password.
 */
export function switchLoginMode(mode) {
  document.querySelectorAll('#benzinLoginOverlay .sub-tab').forEach(el => el.classList.remove('active'));
  const btn = document.getElementById(`loginTab-${mode}`);
  if (btn) btn.classList.add('active');

  const formPin = document.getElementById('loginFormPin');
  const formEmail = document.getElementById('loginFormEmail');
  if (formPin) formPin.style.display = mode === 'pin' ? 'block' : 'none';
  if (formEmail) formEmail.style.display = mode === 'email' ? 'block' : 'none';
}

/**
 * Handle staff login via 4-digit PIN.
 */
export async function handleStaffPinLogin(isClockOnly) {
  const codeInput = document.getElementById('loginVenueCode');
  const rCode = codeInput ? codeInput.value.trim() : (localStorage.getItem('benzin_restaurant_code') || '');
  const empSelect = document.getElementById('loginStaffSelect');
  const empId = empSelect ? empSelect.value : '';
  const pinInput = document.getElementById('loginPinInput');
  const pin = pinInput ? pinInput.value.trim() : '';

  if (!rCode) {
    alert('Please enter a valid Venue ID');
    return;
  }
  if (!empId) {
    alert('Please select your staff account');
    return;
  }
  if (!pin || pin.length < 4) {
    alert('Please enter 4-digit Staff PIN');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/staff-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_code: rCode,
        user_id: empId,
        pin: pin,
        action: isClockOnly ? 'clock_in' : 'login'
      })
    });
    const data = await res.json();
    if (data.success && data.user) {
      localStorage.setItem('benzin_jwt_token', data.token);
      localStorage.setItem('benzin_user_id', data.user.id || data.user._id || '');
      localStorage.setItem('benzin_user_name', data.user.name);
      localStorage.setItem('benzin_user_role', data.user.role);
      if (data.restaurant) {
        localStorage.setItem('benzin_restaurant_id', data.restaurant.id);
        localStorage.setItem('benzin_selected_slug', data.restaurant.slug);
        localStorage.setItem('benzin_restaurant_code', data.restaurant.restaurant_code);
      }

      const overlay = document.getElementById('benzinLoginOverlay');
      if (overlay) overlay.style.display = 'none';
      clearInMemoryState();
      checkLoginStatus();
      if (typeof window.loadData === 'function') await window.loadData();
      if (typeof window.connectSSE === 'function') window.connectSSE();
      if (data.message) alert('🎉 ' + data.message);
    } else {
      alert('Verification Failed: ' + (data.error || data.message || 'Invalid PIN'));
    }
  } catch (err) {
    alert('Network error verifying staff PIN: ' + err.message);
  }
}

/**
 * Handle manager login using email and password.
 */
export async function handleManagerEmailLogin() {
  const emailEl = document.getElementById('loginManagerEmailInput') || document.getElementById('loginEmailInput');
  const passEl = document.getElementById('loginManagerPassInput') || document.getElementById('loginPassInput');
  const venueCodeEl = document.getElementById('loginManagerVenueCode');

  const email = emailEl ? emailEl.value.trim() : '';
  const password = passEl ? passEl.value.trim() : '';
  const venueCode = venueCodeEl ? venueCodeEl.value.trim() : (localStorage.getItem('benzin_restaurant_code') || '');

  if (!email || !password) {
    alert('Please enter your owner email and password.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/manager-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_code: venueCode || undefined,
        email: email,
        password: password,
        pin: password
      })
    });
    const data = await res.json();
    if (data.success && data.user) {
      localStorage.setItem('benzin_jwt_token', data.token);
      localStorage.setItem('benzin_user_id', data.user.id || data.user._id || '');
      localStorage.setItem('benzin_user_name', data.user.name);
      localStorage.setItem('benzin_user_role', data.user.role);
      if (data.restaurant) {
        localStorage.setItem('benzin_restaurant_id', data.restaurant.id);
        localStorage.setItem('benzin_selected_slug', data.restaurant.slug);
        localStorage.setItem('benzin_restaurant_code', data.restaurant.restaurant_code);
      }

      const overlay = document.getElementById('benzinLoginOverlay');
      if (overlay) overlay.style.display = 'none';
      clearInMemoryState();
      checkLoginStatus();
      if (typeof window.loadData === 'function') await window.loadData();
      if (typeof window.connectSSE === 'function') window.connectSSE();
    } else {
      alert('Manager Authentication Failed: ' + (data.error || data.message || 'Invalid credentials'));
    }
  } catch (err) {
    alert('Network error during manager login: ' + err.message);
  }
}

/**
 * Handle manager phone and verification code login.
 */
export async function handleManagerCodeLogin() {
  const venueCodeEl = document.getElementById('loginManagerVenueCode');
  const phoneEl = document.getElementById('loginManagerPhoneInput');
  const codeEl = document.getElementById('loginManagerCodeInput');

  const venueCode = venueCodeEl ? venueCodeEl.value.trim() : '';
  const phone = phoneEl ? phoneEl.value.trim() : '';
  const code = codeEl ? codeEl.value.trim() : '';

  if (!venueCode) {
    alert('Please enter Venue ID');
    return;
  }
  if (!phone) {
    alert('Please enter Manager Phone Number');
    return;
  }
  if (!code) {
    alert('Please enter Verification Code');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/manager-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_code: venueCode,
        phone: phone,
        code: code
      })
    });
    const data = await res.json();
    if (data.success && data.user) {
      localStorage.setItem('benzin_jwt_token', data.token);
      localStorage.setItem('benzin_user_name', data.user.name);
      localStorage.setItem('benzin_user_role', data.user.role || 'manager');
      if (data.restaurant) {
        localStorage.setItem('benzin_restaurant_id', data.restaurant.id);
        localStorage.setItem('benzin_selected_slug', data.restaurant.slug);
        localStorage.setItem('benzin_restaurant_code', data.restaurant.restaurant_code);
      }

      const overlay = document.getElementById('benzinLoginOverlay');
      if (overlay) overlay.style.display = 'none';
      clearInMemoryState();
      checkLoginStatus();
      if (typeof window.loadData === 'function') await window.loadData();
      if (typeof window.connectSSE === 'function') window.connectSSE();
    } else {
      alert('Manager Code Login Failed: ' + (data.error || data.message || 'Invalid verification code'));
    }
  } catch (err) {
    alert('Network error during manager code login: ' + err.message);
  }
}

/**
 * Log out of active session and reload page.
 */
export function benzinLogout() {
  localStorage.removeItem('benzin_jwt_token');
  localStorage.removeItem('benzin_user_role');
  localStorage.removeItem('benzin_user_name');
  window.location.reload();
}

/**
 * Open staff PIN quick-switch modal.
 */
export function openStaffSwitchModal() {
  const modal = document.getElementById('staffSwitchModal');
  if (modal) {
    modal.style.display = 'flex';
    const pinInput = document.getElementById('staffSwitchPinInput');
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
  }
}

/**
 * Close staff PIN quick-switch modal.
 */
export function closeStaffSwitchModal() {
  const modal = document.getElementById('staffSwitchModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Verify staff PIN in modal and issue scoped JWT token.
 */
export async function submitStaffSwitchPin() {
  const pinInput = document.getElementById('staffSwitchPinInput');
  const pin = pinInput ? pinInput.value.trim() : '';
  if (!pin || pin.length < 4) {
    alert('Please enter 4-digit staff PIN');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/employees/verify-pin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    if (data.success && (data.user || data.employee)) {
      const user = data.user || data.employee;
      if (data.token) {
        localStorage.setItem('benzin_jwt_token', data.token);
      }
      localStorage.setItem('benzin_user_id', user.id || user._id || '');
      localStorage.setItem('benzin_user_role', user.role);
      localStorage.setItem('benzin_user_name', user.name);

      const nameEl = document.getElementById('headerStaffName');
      if (nameEl) nameEl.innerText = user.name;
      const roleEl = document.getElementById('headerStaffRole');
      if (roleEl) roleEl.innerText = String(user.role).toUpperCase();

      closeStaffSwitchModal();
      if (typeof window.loadData === 'function') await window.loadData();
    } else {
      alert('Invalid Staff PIN: ' + (data.message || 'Verification failed'));
    }
  } catch (err) {
    alert('Network error verifying PIN: ' + err.message);
  }
}

/**
 * Toggle Shift Clock In / Clock Out for current user.
 */
export async function toggleShiftClock() {
  const headers = getAuthHeaders();

  try {
    if (!state.isUserClockedIn) {
      const res = await fetch(`${API_URL}/api/employees/clock-in`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'clock_in' })
      });
      const data = await res.json();
      if (data.success || data.is_clocked_in) {
        state.isUserClockedIn = true;
        updateClockWidgetState(true);
        alert(`🎉 Shift Clock-In Successful! You are now ON SHIFT.`);
      } else {
        alert('Clock in failed: ' + (data.error || data.message || 'Unknown error'));
      }
    } else {
      const res = await fetch(`${API_URL}/api/employees/clock-out`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'clock_out' })
      });
      const data = await res.json();
      if (data.success || !data.is_clocked_in) {
        state.isUserClockedIn = false;
        updateClockWidgetState(false);
        alert(`✅ Shift Clock-Out Successful! You are now OFF SHIFT.`);
      } else {
        alert('Clock out failed: ' + (data.error || data.message || 'Unknown error'));
      }
    }
  } catch (err) {
    alert('Network error toggling shift clock: ' + err.message);
  }
}

/**
 * Update UI clock button, timer dot, and text states.
 */
export function updateClockWidgetState(clockedIn) {
  state.isUserClockedIn = clockedIn;
  const btn = document.getElementById('headerTimeclockBtn');
  const dot = document.getElementById('headerClockDot');
  const timerText = document.getElementById('headerShiftTimerText');
  const btnText = document.getElementById('headerClockBtnText');

  if (clockedIn) {
    if (btn) {
      btn.style.background = 'rgba(34,197,94,0.15)';
      btn.style.borderColor = 'var(--success)';
      btn.style.color = 'var(--success)';
    }
    if (dot) {
      dot.style.background = 'var(--success)';
      dot.style.boxShadow = '0 0 6px var(--success)';
    }
    if (timerText) {
      timerText.style.color = 'var(--success)';
      const hrs = String(Math.floor(state.shiftTimerSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((state.shiftTimerSeconds % 3600) / 60)).padStart(2, '0');
      const secs = String(state.shiftTimerSeconds % 60).padStart(2, '0');
      timerText.innerText = `${hrs}:${mins}:${secs}`;
    }
    if (btnText) btnText.innerText = 'CLOCK OUT';
  } else {
    state.shiftTimerSeconds = 0;
    if (btn) {
      btn.style.background = 'var(--card2)';
      btn.style.borderColor = 'var(--line)';
      btn.style.color = 'var(--cream)';
    }
    if (dot) {
      dot.style.background = 'var(--muted)';
      dot.style.boxShadow = 'none';
    }
    if (timerText) {
      timerText.innerText = '00:00:00';
      timerText.style.color = 'var(--muted)';
    }
    if (btnText) btnText.innerText = 'CLOCK IN';
  }
}

/**
 * Sync active shift timer against backend timecards.
 */
export async function syncActiveShiftTimer() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/employees`, { headers });
    const data = await res.json();
    const userName = localStorage.getItem('benzin_user_name');
    if (data.success && Array.isArray(data.employees)) {
      const me = data.employees.find(e => e.name === userName || e.id === localStorage.getItem('benzin_user_id'));
      if (me && me.is_clocked_in && me.active_shift) {
        const clockInMs = new Date(me.active_shift.clock_in).getTime();
        state.shiftTimerSeconds = Math.max(0, Math.floor((Date.now() - clockInMs) / 1000));
        updateClockWidgetState(true);
        return;
      }
    }
    updateClockWidgetState(false);
  } catch (err) {
    console.warn('Could not sync active shift timer:', err);
    updateClockWidgetState(false);
  }
}

/**
 * Open staff profile modal when header user badge is clicked.
 */
export function handleHeaderProfileClick() {
  const userId = localStorage.getItem('benzin_user_id') || 'me';
  if (typeof window.openStaffProfileModal === 'function') {
    window.openStaffProfileModal(userId);
  }
}
