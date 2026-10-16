/**
 * Benzin Hospitality OS — Sales Analytics & Payment Ledger
 * Native ES Module: sales.js
 */

import { API_URL } from './state.js';
import { getAuthHeaders } from './api.js';

/**
 * Fetch and render sales summary and payment transaction ledger.
 */
export async function renderSalesPage() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${API_URL}/api/orders/sales/summary`, { headers });
    const data = await res.json();
    if (data.success && data.analytics) {
      const a = data.analytics;

      const dSales = document.getElementById('salesDailyTotal');
      if (dSales) dSales.innerText = `$${a.daily.sales.toFixed(2)}`;
      const dMeta = document.getElementById('salesDailyMeta');
      if (dMeta) dMeta.innerText = `Gross: $${a.daily.gross.toFixed(2)} • ${a.daily.count} orders`;

      const wSales = document.getElementById('salesWeeklyTotal');
      if (wSales) wSales.innerText = `$${a.weekly.sales.toFixed(2)}`;
      const wMeta = document.getElementById('salesWeeklyMeta');
      if (wMeta) wMeta.innerText = `Gross: $${a.weekly.gross.toFixed(2)} • ${a.weekly.count} orders`;

      const ySales = document.getElementById('salesYearlyTotal');
      if (ySales) ySales.innerText = `$${a.yearly.sales.toFixed(2)}`;
      const yMeta = document.getElementById('salesYearlyMeta');
      if (yMeta) yMeta.innerText = `Monthly: $${a.monthly.sales.toFixed(2)} • ${a.yearly.count} orders YTD`;

      const taxTips = document.getElementById('salesTaxTipsTotal');
      if (taxTips) taxTips.innerText = `$${(a.yearly.tax + a.yearly.tips).toFixed(2)}`;
      const taxMeta = document.getElementById('salesTaxTipsMeta');
      if (taxMeta) taxMeta.innerText = `Tax: $${a.yearly.tax.toFixed(2)} • Tips: $${a.yearly.tips.toFixed(2)}`;

      const tbody = document.getElementById('paymentLogsTbody');
      if (tbody && Array.isArray(a.payment_logs)) {
        if (a.payment_logs.length === 0) {
          tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--muted);">No payment logs found.</td></tr>`;
        } else {
          tbody.innerHTML = a.payment_logs.map(log => {
            const dateStr = new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
            const methodBadge = log.payment_method === 'CASH' 
              ? `<span style="background:rgba(34,197,94,0.15); color:var(--success); border:1px solid var(--success); border-radius:12px; padding:2px 8px; font-size:11px; font-weight:800;">💵 CASH</span>`
              : `<span style="background:rgba(59,130,246,0.15); color:#3b82f6; border:1px solid #3b82f6; border-radius:12px; padding:2px 8px; font-size:11px; font-weight:800;">💳 ${log.payment_method}</span>`;

            return `<tr style="border-bottom:1px solid var(--line); font-size:13px;">
              <td style="padding:12px; font-weight:800; color:var(--gold);">#${String(log.id).slice(-6).toUpperCase()}</td>
              <td style="padding:12px; font-weight:700; color:var(--cream);">Table ${log.table}</td>
              <td style="padding:12px; color:var(--cream);">${log.customer}</td>
              <td style="padding:12px;">${methodBadge}</td>
              <td style="padding:12px; font-weight:700; color:var(--cream);">$${log.subtotal.toFixed(2)}</td>
              <td style="padding:12px; color:var(--muted);">$${log.tax_amount.toFixed(2)}</td>
              <td style="padding:12px; color:var(--muted);">$${log.tip_amount.toFixed(2)}</td>
              <td style="padding:12px; font-weight:800; color:var(--gold);">$${log.grand_total.toFixed(2)}</td>
              <td style="padding:12px; color:var(--muted); font-size:11px;">${dateStr}</td>
            </tr>`;
          }).join('');
        }
      }
    }
  } catch (err) {
    console.error('Error rendering sales page:', err);
  }
}
