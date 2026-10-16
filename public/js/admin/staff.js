/**
 * Benzin Hospitality OS — Employee Management & Payroll
 * Native ES Module: staff.js
 */

import { API_URL, ROLE_BADGES, state } from './state.js';
import { getAuthHeaders } from './api.js';
import { refreshIcons } from './utils.js';

/**
 * Fetch and render the staff roster list and pending weekly payroll summary.
 */
export async function renderStaffPage() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/employees`, { headers });
    const data = await res.json();
    const listBody = document.getElementById('employeeListBody');

    if (data.success && Array.isArray(data.employees)) {
      state.employeesList = data.employees;
      const countEl = document.getElementById('totalStaffCount');
      if (countEl) countEl.innerText = data.employees.length;

      const activeCount = data.employees.filter(e => e.is_clocked_in).length;
      const activeEl = document.getElementById('activeClockedInCount');
      if (activeEl) activeEl.innerText = `${activeCount} Staff`;

      if (listBody) {
        listBody.innerHTML = data.employees.map(e => {
          const badge = ROLE_BADGES[e.role] || { label: e.role, color: 'var(--muted)' };
          const clockedTag = e.is_clocked_in ? '<span style="background:rgba(34,197,94,0.15);color:var(--success);border:1px solid var(--success);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:800;margin-left:6px;">🟢 ON SHIFT</span>' : '';
          const isMgr = e.role === 'manager' || e.role === 'owner';
          const cleanFallbackEmail = e.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '') + '@cavalli.com';
          const displayEmail = e.email || (isMgr ? cleanFallbackEmail : null);

          const emailDisplay = displayEmail ? `
            <div style="margin-top:6px;font-size:12px;color:var(--gold);display:flex;align-items:center;gap:6px;font-weight:700;">
              <span style="font-size:13px;">✉️</span>
              <span>${displayEmail}</span>
              ${isMgr ? '<span style="font-size:9px;background:rgba(229,177,58,0.18);border:1px solid var(--gold);padding:1px 6px;border-radius:4px;color:var(--gold);font-weight:800;letter-spacing:0.5px;">MANAGER LOGIN</span>' : ''}
            </div>` : '';

          return `<div style="display:flex;align-items:center;justify-content:space-between;background:var(--background);border:1.5px solid var(--line);border-radius:12px;padding:14px 18px;gap:12px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:14px;cursor:pointer;" onclick="openStaffProfileModal('${e.id}')" title="Tap picture/emoji to view full staff profile, 6-month hours &amp; weekly payroll logs">
              <div style="width:42px;height:42px;border-radius:50%;background:rgba(59,130,246,0.15);border:2px solid ${badge.color};display:flex;align-items:center;justify-content:center;font-size:18px;color:${badge.color};font-weight:900;">${e.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-weight:700;color:var(--cream);font-size:15px;display:flex;align-items:center;gap:6px;">${e.name} ${clockedTag} <span style="font-size:11px;color:var(--gold);font-weight:700;">👤 Profile</span></div>
                <div style="margin-top:4px;"><span style="background:rgba(229,177,58,0.1);color:${badge.color};border:1px solid ${badge.color};border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">${badge.label.toUpperCase()}</span></div>
                ${emailDisplay}
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn" style="padding:6px 12px;font-size:12px;" onclick="openEditEmpModal('${e.id}', '${e.name.replace(/'/g, "\\'")}', '${e.role}', '${(displayEmail || '').replace(/'/g, "\\'")}')">
                <i data-lucide="edit-2" style="width:12px;height:12px;"></i> Edit
              </button>
              ${e.id !== 'emp-owner' && e.role !== 'owner' ? `<button class="btn" style="padding:6px 12px;font-size:12px;background:rgba(239,68,68,0.15);border-color:var(--danger);color:var(--danger);" onclick="deleteEmployee('${e.id}')">Remove</button>` : ''}
            </div>
          </div>`;
        }).join('');
      }
    }

    // Fetch Weekly Payroll Summary
    const pRes = await fetch(`${API_URL}/api/employees/payroll/summary`, { headers });
    const pData = await pRes.json();
    if (pData.success && pData.summary) {
      const payEl = document.getElementById('weeklyPayrollPendingText');
      if (payEl) {
        payEl.innerText = `$${pData.summary.total_pending_payroll.toFixed(2)} (${pData.summary.unfulfilled_shifts_count} shifts)`;
      }
    }

    refreshIcons();
  } catch (err) {
    console.error('Failed to load staff page:', err);
  }
}

/**
 * Manager action: fulfill all open shifts across the restaurant.
 */
export async function fulfillWeeklyPayroll() {
  if (!confirm('Fulfill weekly payroll and mark all open employee shift timecards as paid?')) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/employees/payroll/fulfill`, { method: 'POST', headers });
    const data = await res.json();
    if (data.success) {
      alert(`🎉 ${data.message}`);
      await renderStaffPage();
    } else {
      alert('Could not fulfill payroll: ' + (data.message || data.error || 'Forbidden'));
    }
  } catch (err) {
    alert('Network error during payroll fulfillment: ' + err.message);
  }
}

/**
 * Open staff profile modal with metrics, shifts, and 6-month payroll summary.
 */
export async function openStaffProfileModal(empId) {
  if (!empId || empId === 'undefined') empId = localStorage.getItem('benzin_user_id') || 'me';
  state.currentProfileUserId = empId;
  document.getElementById('staffProfileModal').style.display = 'flex';

  try {
    const headers = getAuthHeaders();
    const userName = localStorage.getItem('benzin_user_name') || '';
    const res = await fetch(`${API_URL}/api/employees/${empId}/profile?name=${encodeURIComponent(userName)}`, { headers });
    const data = await res.json();

    if (data.success && data.profile) {
      const p = data.profile;
      const s = data.payroll_summary || {};

      document.getElementById('profName').innerText = p.name || 'Staff Member';
      document.getElementById('profAvatar').innerText = (p.name || 'A').charAt(0).toUpperCase();
      document.getElementById('profPosition').innerText = (p.position || p.role || 'STAFF').toUpperCase();
      document.getElementById('profPayRate').innerText = `$${(Number(p.hourly_rate) || 0).toFixed(2)} / hr`;

      const emailEl = document.getElementById('profEmail');
      if (emailEl) {
        emailEl.innerText = p.email ? `✉️ ${p.email}` : '';
        emailEl.style.display = p.email ? 'inline' : 'none';
      }

      const statusBadge = document.getElementById('profStatusBadge');
      if (statusBadge) {
        statusBadge.innerText = p.is_clocked_in ? '🟢 ON SHIFT' : 'OFF SHIFT';
        statusBadge.style.background = p.is_clocked_in ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)';
        statusBadge.style.color = p.is_clocked_in ? 'var(--success)' : 'var(--muted)';
        statusBadge.style.borderColor = p.is_clocked_in ? 'var(--success)' : 'var(--line)';
      }

      // 3 Metric Cards: Week, Month, 6 Months
      const week = s.current_week || {};
      document.getElementById('profHrsWeek').innerText = `${(Number(week.hours) || 0).toFixed(2)} hrs`;
      document.getElementById('profPayWeek').innerText = `$${(Number(week.gross_pay) || 0).toFixed(2)}`;

      const month = s.current_month || {};
      document.getElementById('profHrsMonth').innerText = `${(Number(month.hours) || 0).toFixed(2)} hrs`;
      document.getElementById('profPayMonth').innerText = `$${(Number(month.gross_pay) || 0).toFixed(2)}`;

      const sixM = s.six_months || {};
      document.getElementById('profHrs6Months').innerText = `${(Number(sixM.hours) || 0).toFixed(2)} hrs`;
      document.getElementById('profPay6Months').innerText = `$${(Number(sixM.gross_pay) || 0).toFixed(2)}`;

      const role = (localStorage.getItem('benzin_user_role') || 'server').toLowerCase();
      const isManager = ['owner', 'manager', 'platform_admin'].includes(role);

      // Render Weekly Payroll List
      const weeklyCont = document.getElementById('profWeeklyPayrollList');
      if (weeklyCont) {
        if (Array.isArray(s.weekly_payroll) && s.weekly_payroll.length > 0) {
          weeklyCont.innerHTML = s.weekly_payroll.map(w => {
            const isPaid = w.fulfilled;
            const statusTag = isPaid 
              ? `<span style="background:rgba(34,197,94,0.15);color:var(--success);border:1px solid var(--success);border-radius:20px;padding:2px 10px;font-size:10px;font-weight:800;">PAID</span>`
              : `<span style="background:rgba(239,68,68,0.15);color:var(--danger);border:1px solid var(--danger);border-radius:20px;padding:2px 10px;font-size:10px;font-weight:800;">UNPAID</span>`;

            const btnHtml = (!isPaid && isManager) 
              ? `<button class="btn btn-primary" style="padding:4px 10px;font-size:11px;font-weight:800;" onclick="fulfillSingleWeeklyPayroll('${p.id}', '${w.week_key}')">Fulfill Payroll</button>`
              : (isPaid ? `<span style="font-size:11px;color:var(--success);font-weight:800;">✓ Settled</span>` : `<span style="font-size:11px;color:var(--gold);font-weight:700;">Pending</span>`);

            return `<div style="display:flex;align-items:center;justify-content:space-between;background:var(--background);border:1px solid var(--line);border-radius:12px;padding:10px 14px;gap:10px;flex-wrap:wrap;">
              <div>
                <div style="font-size:13px;font-weight:800;color:var(--cream);">${w.period_label}</div>
                <div style="font-size:11px;color:var(--gold);font-weight:700;margin-top:2px;">${w.total_hours} hrs • $${w.gross_pay.toFixed(2)} total pay</div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                ${statusTag}
                ${btnHtml}
              </div>
            </div>`;
          }).join('');
        } else {
          weeklyCont.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:10px;text-align:center;">No weekly shift records found.</div>`;
        }
      }

      // Render Clock In / Clock Out Logs
      const logsCont = document.getElementById('profClockLogsList');
      if (logsCont) {
        if (Array.isArray(data.timesheets) && data.timesheets.length > 0) {
          logsCont.innerHTML = data.timesheets.map(t => {
            const inTime = t.clock_in ? new Date(t.clock_in).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
            const outTime = t.clock_out ? new Date(t.clock_out).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Active Shift';
            const dur = t.total_hours ? `${t.total_hours} hrs` : (t.status === 'active' ? 'ON SHIFT' : 'N/A');
            return `<div style="display:flex;align-items:center;justify-content:space-between;background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:8px 12px;font-size:12px;">
              <div>
                <div style="font-weight:800;color:var(--cream);">${inTime} ➔ ${outTime}</div>
                <div style="color:var(--muted);font-size:10px;">Role: ${(t.role || 'staff').toUpperCase()}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:900;color:var(--gold);">${dur}</div>
                <div style="font-size:10px;color:${t.payroll_fulfilled ? 'var(--success)' : 'var(--muted)'};">${t.payroll_fulfilled ? 'Paid' : 'Unpaid'}</div>
              </div>
            </div>`;
          }).join('');
        } else {
          logsCont.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:10px;text-align:center;">No shift logs available.</div>`;
        }
      }
    }
  } catch (err) {
    console.error('Error fetching employee profile:', err);
  }
}

/**
 * Close staff profile modal.
 */
export function closeStaffProfileModal() {
  document.getElementById('staffProfileModal').style.display = 'none';
}

/**
 * Fulfill single week's payroll for a specific employee.
 */
export async function fulfillSingleWeeklyPayroll(userId, weekKey) {
  if (!confirm('Fulfill payroll for this employee for this specific week?')) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/employees/payroll/fulfill`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, weekKey })
    });
    const data = await res.json();
    if (data.success) {
      alert(`🎉 Payroll fulfilled for this week!`);
      await openStaffProfileModal(userId);
      await renderStaffPage();
    } else {
      alert('Could not fulfill payroll: ' + (data.message || data.error || 'Forbidden'));
    }
  } catch (err) {
    alert('Network error during weekly payroll fulfillment: ' + err.message);
  }
}

/**
 * Handle role selection change in employee creation/edit modal.
 */
export function handleEmpRoleChange() {
  const role = document.getElementById('empRole').value;
  const emailCont = document.getElementById('empEmailContainer');
  const emailInput = document.getElementById('empEmail');
  const nameInput = document.getElementById('empName');
  if (role === 'manager') {
    emailCont.style.display = 'block';
    emailInput.required = true;
    if (!emailInput.value.trim() && nameInput.value.trim()) {
      const clean = nameInput.value.trim().toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '');
      const restCode = localStorage.getItem('benzin_restaurant_code') || '';
      if (clean && (restCode === '4821' || !restCode)) {
        emailInput.value = `${clean}@cavalli.com`;
      }
    }
  } else {
    emailCont.style.display = 'none';
    emailInput.required = false;
  }
}

/**
 * Open add employee modal.
 */
export function openAddEmployeeModal() {
  document.getElementById('empModalTitle').innerText = 'Add Employee';
  document.getElementById('empEditId').value = '';
  document.getElementById('empName').value = '';
  document.getElementById('empRole').value = 'cashier';
  document.getElementById('empEmail').value = '';
  document.getElementById('empPin').value = '';
  handleEmpRoleChange();
  document.getElementById('empModal').style.display = 'flex';
}

/**
 * Open edit employee modal.
 */
export function openEditEmpModal(id, name, role, email) {
  document.getElementById('empModalTitle').innerText = 'Edit Employee';
  document.getElementById('empEditId').value = id;
  document.getElementById('empName').value = name;
  document.getElementById('empRole').value = role;
  document.getElementById('empEmail').value = email || '';
  document.getElementById('empPin').value = '';
  handleEmpRoleChange();
  document.getElementById('empModal').style.display = 'flex';
}

/**
 * Close employee modal.
 */
export function closeEmpModal() {
  document.getElementById('empModal').style.display = 'none';
}

/**
 * Save new or modified employee.
 */
export async function submitEmployee() {
  const id = document.getElementById('empEditId').value;
  const name = document.getElementById('empName').value.trim();
  const role = document.getElementById('empRole').value;
  const email = document.getElementById('empEmail').value.trim().toLowerCase();
  const pin = document.getElementById('empPin').value.trim();

  if (!name) {
    alert('Please enter staff name');
    return;
  }

  if (role === 'manager') {
    if (!email) {
      alert('Manager email is required for manager registration across all venues.');
      document.getElementById('empEmail').focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please enter a valid email address (e.g. name@cavalli.com).');
      document.getElementById('empEmail').focus();
      return;
    }
  }

  try {
    const headers = getAuthHeaders();
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/api/employees/${id}` : `${API_URL}/api/employees`;

    const bodyPayload = { name, role };
    if (email) {
      bodyPayload.email = email;
    }
    if (pin) {
      bodyPayload.pin = pin;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(bodyPayload)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      alert('Server error saving staff (status ' + res.status + '): ' + text.slice(0, 150));
      return;
    }

    if (data.success) {
      closeEmpModal();
      await renderStaffPage();
    } else {
      alert('Could not save employee: ' + (data.message || data.error || 'Error'));
    }
  } catch (err) {
    alert('Network error saving staff: ' + err.message);
  }
}

/**
 * Remove employee from roster.
 */
export async function deleteEmployee(id) {
  if (!confirm('Remove this employee from the roster?')) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/employees/${id}`, { method: 'DELETE', headers });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      alert('Server error deleting staff (status ' + res.status + '): ' + text.slice(0, 150));
      return;
    }

    if (data.success) {
      await renderStaffPage();
    } else {
      alert('Could not delete staff: ' + (data.message || data.error || 'Error'));
    }
  } catch (err) {
    alert('Error deleting staff: ' + err.message);
  }
}
