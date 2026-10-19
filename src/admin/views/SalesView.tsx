import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface PaymentLog {
  orderId: string;
  table: string;
  customer: string;
  method: string;
  subtotal: string;
  tax: string;
  tips: string;
  grandTotal: string;
  dateTime: string;
}

export const SalesView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState({ sales: 0, gross: 0, count: 0, tax: 0, tips: 0 });
  const [weekly, setWeekly] = useState({ sales: 0, gross: 0, count: 0 });
  const [yearly, setYearly] = useState({ sales: 0, gross: 0, count: 0 });
  const [taxTips, setTaxTips] = useState({ tax: 0, tips: 0, total: 0 });
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getSalesSummary();
        if (mounted && data) {
          if (data.daily) setDaily(data.daily);
          if (data.weekly) setWeekly(data.weekly);
          if (data.yearly) setYearly(data.yearly);

          const tax = (data.daily?.tax || 0) + (data.weekly?.tax || 0);
          const tips = (data.daily?.tips || 0) + (data.weekly?.tips || 0);
          setTaxTips({ tax, tips, total: tax + tips });

          if (Array.isArray(data.payment_logs)) {
            const mappedLogs: PaymentLog[] = data.payment_logs.map((log: any) => {
              const dt = log.created_at ? new Date(log.created_at) : new Date();
              const dateStr = !isNaN(dt.getTime())
                ? dt.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Recent';

              return {
                orderId: log.id ? `#${String(log.id).slice(-4)}` : '#N/A',
                table: `Table ${log.table || '1'}`,
                customer: log.customer || 'Guest',
                method: log.payment_method || 'CASH',
                subtotal: `$${(Number(log.subtotal) || 0).toFixed(2)}`,
                tax: `$${(Number(log.tax) || 0).toFixed(2)}`,
                tips: `$${(Number(log.tips) || 0).toFixed(2)}`,
                grandTotal: `$${(Number(log.grandTotal) || 0).toFixed(2)}`,
                dateTime: dateStr,
              };
            });
            setPaymentLogs(mappedLogs);
          }
        }
      } catch (e) {
        console.error('Failed to load sales analytics from MongoDB Atlas:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div id="salesPageLayout" style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cream)', margin: 0 }}>
            Sales Analytics, Tax Collection &amp; Payment Ledger
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>
            Live MongoDB Atlas metrics for Cavalli Lounge.
          </p>
        </div>
      </div>

      {/* Financial Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--line)',
            borderRadius: '14px',
            padding: '18px',
            borderLeft: '4px solid var(--gold)',
          }}
        >
          <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💵 DAILY SALES (TODAY)
          </div>
          <div id="salesDailyTotal" style={{ fontSize: '26px', fontWeight: 900, color: 'var(--cream)', marginTop: '4px' }}>
            ${daily.sales.toFixed(2)}
          </div>
          <div id="salesDailyMeta" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', fontWeight: 700 }}>
            Gross: ${daily.gross.toFixed(2)} • {daily.count} orders
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--line)',
            borderRadius: '14px',
            padding: '18px',
            borderLeft: '4px solid var(--success)',
          }}
        >
          <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📅 WEEKLY SALES (THIS WEEK)
          </div>
          <div id="salesWeeklyTotal" style={{ fontSize: '26px', fontWeight: 900, color: 'var(--success)', marginTop: '4px' }}>
            ${weekly.sales.toFixed(2)}
          </div>
          <div id="salesWeeklyMeta" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', fontWeight: 700 }}>
            Gross: ${weekly.gross.toFixed(2)} • {weekly.count} orders
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--line)',
            borderRadius: '14px',
            padding: '18px',
            borderLeft: '4px solid #3b82f6',
          }}
        >
          <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🗓️ YEAR TO DATE (YTD) SALES
          </div>
          <div id="salesYearlyTotal" style={{ fontSize: '26px', fontWeight: 900, color: '#3b82f6', marginTop: '4px' }}>
            ${yearly.sales.toFixed(2)}
          </div>
          <div id="salesYearlyMeta" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', fontWeight: 700 }}>
            Gross: ${yearly.gross.toFixed(2)} • {yearly.count} orders YTD
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--line)',
            borderRadius: '14px',
            padding: '18px',
            borderLeft: '4px solid var(--ember)',
          }}
        >
          <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🏛️ TAX &amp; TIPS COLLECTED
          </div>
          <div id="salesTaxTipsTotal" style={{ fontSize: '26px', fontWeight: 900, color: 'var(--ember)', marginTop: '4px' }}>
            ${taxTips.total.toFixed(2)}
          </div>
          <div id="salesTaxTipsMeta" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', fontWeight: 700 }}>
            Tax: ${taxTips.tax.toFixed(2)} • Tips: ${taxTips.tips.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Payment Logs & Transaction Ledger Table */}
      <div
        style={{
          background: 'var(--card)',
          border: '1.5px solid var(--line)',
          borderRadius: '16px',
          padding: '20px',
          overflowX: 'auto',
        }}
      >
        <h3
          style={{
            color: 'var(--gold)',
            fontSize: '16px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            margin: '0 0 16px 0',
          }}
        >
          💳 Payment Logs &amp; Transaction Ledger ({paymentLogs.length} Records)
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                borderBottom: '2px solid var(--line)',
                color: 'var(--muted)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <th style={{ padding: '10px' }}>Order ID</th>
              <th style={{ padding: '10px' }}>Table</th>
              <th style={{ padding: '10px' }}>Customer</th>
              <th style={{ padding: '10px' }}>Payment Method</th>
              <th style={{ padding: '10px' }}>Subtotal</th>
              <th style={{ padding: '10px' }}>Tax</th>
              <th style={{ padding: '10px' }}>Tips</th>
              <th style={{ padding: '10px' }}>Grand Total</th>
              <th style={{ padding: '10px' }}>Date &amp; Time</th>
            </tr>
          </thead>
          <tbody id="paymentLogsTbody">
            {paymentLogs.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>
                  {loading ? 'Loading payment records from database...' : 'No transactions recorded yet.'}
                </td>
              </tr>
            ) : (
              paymentLogs.map((log) => (
                <tr
                  key={log.orderId}
                  style={{
                    borderBottom: '1px solid var(--line)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--cream)',
                  }}
                >
                  <td style={{ padding: '12px 10px', color: 'var(--gold)', fontWeight: 800 }}>{log.orderId}</td>
                  <td style={{ padding: '12px 10px' }}>{log.table}</td>
                  <td style={{ padding: '12px 10px' }}>{log.customer}</td>
                  <td style={{ padding: '12px 10px' }}>{log.method}</td>
                  <td style={{ padding: '12px 10px' }}>{log.subtotal}</td>
                  <td style={{ padding: '12px 10px' }}>{log.tax}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--success)' }}>{log.tips}</td>
                  <td style={{ padding: '12px 10px', fontWeight: 800 }}>{log.grandTotal}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--muted)', fontSize: '12px' }}>{log.dateTime}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
