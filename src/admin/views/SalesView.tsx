import React from 'react';

interface MockPaymentLog {
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

const PAYMENT_LOGS: MockPaymentLog[] = [
  {
    orderId: '#102',
    table: 'Table 3',
    customer: 'Walk-in Guest',
    method: 'Credit Card (Stripe)',
    subtotal: '$68.00',
    tax: '$5.61',
    tips: '$12.00',
    grandTotal: '$85.61',
    dateTime: 'Today, 6:15 PM',
  },
  {
    orderId: '#99',
    table: 'Table 6 (VIP)',
    customer: 'Farhan A.',
    method: 'Apple Pay',
    subtotal: '$140.00',
    tax: '$11.55',
    tips: '$28.00',
    grandTotal: '$179.55',
    dateTime: 'Today, 5:48 PM',
  },
  {
    orderId: '#98',
    table: 'Table 9',
    customer: 'Walk-in Guest',
    method: 'Cash',
    subtotal: '$44.00',
    tax: '$3.63',
    tips: '$6.00',
    grandTotal: '$53.63',
    dateTime: 'Today, 5:45 PM',
  },
  {
    orderId: '#97',
    table: 'Table 2',
    customer: 'Zainab M.',
    method: 'Credit Card (Stripe)',
    subtotal: '$26.50',
    tax: '$2.19',
    tips: '$5.00',
    grandTotal: '$33.69',
    dateTime: 'Today, 5:12 PM',
  },
];

export const SalesView: React.FC = () => {
  return (
    <div id="salesPageLayout" style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cream)', margin: 0 }}>
            Sales Analytics, Tax Collection &amp; Payment Ledger
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>
            Daily, Weekly, Monthly, and YTD Sales Metrics with complete Tax Collection and Payment Logs.
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
            $1,482.50
          </div>
          <div id="salesDailyMeta" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', fontWeight: 700 }}>
            Gross: $1,675.20 • 28 orders
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
            $11,840.00
          </div>
          <div id="salesWeeklyMeta" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', fontWeight: 700 }}>
            Gross: $13,290.40 • 214 orders
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
            $184,250.00
          </div>
          <div id="salesYearlyMeta" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', fontWeight: 700 }}>
            Monthly Avg: $46,062 • 3,420 orders YTD
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
            $2,284.15
          </div>
          <div id="salesTaxTipsMeta" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', fontWeight: 700 }}>
            Tax: $794.15 • Tips: $1,490.00
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
          💳 Payment Logs &amp; Transaction Ledger
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
            {PAYMENT_LOGS.map((log) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
