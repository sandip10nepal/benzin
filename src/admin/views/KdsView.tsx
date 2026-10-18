import React, { useState } from 'react';
import { Printer, CheckCircle2, XCircle } from 'lucide-react';

interface MockTicket {
  id: string;
  table: string;
  orderNumber: string;
  timeAgo: string;
  server: string;
  status: 'pending' | 'in_progress' | 'fulfilled';
  items: Array<{
    name: string;
    qty: number;
    price: string;
    notes?: string;
  }>;
  total: string;
}

const INITIAL_TICKETS: MockTicket[] = [
  {
    id: 'ord_1',
    table: 'Table 4',
    orderNumber: '#104',
    timeAgo: '4m ago',
    server: 'Alex M.',
    status: 'pending',
    items: [
      { name: '👑 Anarkali House Blend Hookah', qty: 1, price: '$36.00', notes: 'Ice base, Lady Killer + Pan Ras' },
      { name: 'Mint Lemonade', qty: 2, price: '$14.00' },
      { name: 'Zaatar Flatbread', qty: 1, price: '$12.50' },
    ],
    total: '$62.50',
  },
  {
    id: 'ord_2',
    table: 'Table 12',
    orderNumber: '#105',
    timeAgo: '9m ago',
    server: 'Sarah K.',
    status: 'in_progress',
    items: [
      { name: 'Blue Mist Premium Hookah', qty: 1, price: '$34.00', notes: 'Refill coals in 20m' },
      { name: 'Turkish Coffee', qty: 2, price: '$10.00' },
    ],
    total: '$44.00',
  },
  {
    id: 'ord_3',
    table: 'Table 7',
    orderNumber: '#106',
    timeAgo: '14m ago',
    server: 'David R.',
    status: 'pending',
    items: [
      { name: 'Double Apple Hookah', qty: 1, price: '$32.00' },
      { name: 'Hummus & Warm Pita', qty: 1, price: '$11.00' },
      { name: 'Iced Chai Latte', qty: 2, price: '$12.00' },
    ],
    total: '$55.00',
  },
  {
    id: 'ord_4',
    table: 'VIP Lounge 1',
    orderNumber: '#107',
    timeAgo: '18m ago',
    server: 'Alex M.',
    status: 'in_progress',
    items: [
      { name: '👑 Daku VIP Unlimited Package', qty: 1, price: '$65.00', notes: 'Head refill requested, Fruit head' },
      { name: 'Sparkling Mineral Water', qty: 3, price: '$15.00' },
    ],
    total: '$80.00',
  },
];

export const KdsView: React.FC = () => {
  const [tickets, setTickets] = useState<MockTicket[]>(INITIAL_TICKETS);

  const fulfillTicket = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'fulfilled' } : t))
    );
  };

  const cancelTicket = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="kds-layout" id="kdsPageLayout">
      {/* Hookah Station Coal Refill Request Queue */}
      <div id="hookahStationQueueSection" style={{ display: 'block', marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(255,90,31,0.18) 0%, rgba(229,177,58,0.12) 100%)',
            border: '1.5px solid rgba(255,90,31,0.45)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🔥</span>
            <div>
              <div style={{ color: 'var(--cream)', fontWeight: 900, fontSize: '16px', letterSpacing: '0.5px' }}>
                Hookah Station — Coal Refill Queue
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                Customer table requests routed exclusively to the Hookah Maker
              </div>
            </div>
          </div>
          <div
            id="hookahQueueBadge"
            style={{
              background: '#ff5a1f',
              color: '#fff',
              fontWeight: 900,
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '20px',
            }}
          >
            0 ACTIVE
          </div>
        </div>
      </div>

      <section className="tickets-section">
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cream)' }}>Active Live KDS Tickets</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59,130,246,0.15)',
                color: 'var(--ember)',
                border: '1px solid var(--ember)',
              }}
            >
              {tickets.filter((t) => t.status !== 'fulfilled').length} ACTIVE
            </span>
          </div>
        </h2>

        <div className="tickets-grid" id="ticketsGrid">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`ticket-card ${ticket.status === 'fulfilled' ? 'fulfilled' : ''}`}
            >
              <div className="ticket-header">
                <div>
                  <div className="ticket-title">
                    {ticket.table} <span style={{ fontSize: '11px', color: 'var(--muted)' }}>({ticket.orderNumber})</span>
                  </div>
                  <div className="ticket-meta">
                    {ticket.timeAgo} • Server: {ticket.server}
                  </div>
                </div>
                <span
                  className={`ticket-badge ${
                    ticket.status === 'fulfilled' ? 'badge-fulfilled' : 'badge-pending'
                  }`}
                >
                  {ticket.status.toUpperCase()}
                </span>
              </div>

              <div className="ticket-items">
                {ticket.items.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '4px' }}>
                    <div className="ticket-item-line">
                      <span>{item.qty}x {item.name}</span>
                      <span style={{ color: 'var(--muted)' }}>{item.price}</span>
                    </div>
                    {item.notes && <div className="ticket-item-note">Note: {item.notes}</div>}
                  </div>
                ))}
              </div>

              <div className="ticket-total-row">
                <span>Total Due</span>
                <span>{ticket.total}</span>
              </div>

              <div className="ticket-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => fulfillTicket(ticket.id)}
                  disabled={ticket.status === 'fulfilled'}
                >
                  <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                  <span>{ticket.status === 'fulfilled' ? 'Done' : 'Fulfill'}</span>
                </button>
                <button
                  className="btn"
                  onClick={() => alert(`Printing ticket for ${ticket.table}`)}
                  title="Print Kitchen Ticket"
                >
                  <Printer style={{ width: '13px', height: '13px' }} />
                  <span>Print</span>
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => cancelTicket(ticket.id)}
                  title="Cancel Order"
                >
                  <XCircle style={{ width: '13px', height: '13px' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
