import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface ArchivedTicket {
  id: string;
  table: string;
  orderNumber: string;
  completedAt: string;
  server: string;
  items: Array<{ name: string; qty: number; price: string }>;
  total: string;
  status: 'fulfilled' | 'cancelled';
}

const INITIAL_ARCHIVE: ArchivedTicket[] = [
  {
    id: 'arch_1',
    table: 'Table 9',
    orderNumber: '#98',
    completedAt: 'Today, 5:45 PM',
    server: 'Alex M.',
    items: [
      { name: 'Double Apple Hookah', qty: 1, price: '$32.00' },
      { name: 'Red Bull Energy Drink', qty: 2, price: '$12.00' },
    ],
    total: '$44.00',
    status: 'fulfilled',
  },
  {
    id: 'arch_2',
    table: 'Table 2',
    orderNumber: '#97',
    completedAt: 'Today, 5:12 PM',
    server: 'Sarah K.',
    items: [
      { name: 'Mint Lemonade', qty: 2, price: '$14.00' },
      { name: 'Zaatar Flatbread', qty: 1, price: '$12.50' },
    ],
    total: '$26.50',
    status: 'fulfilled',
  },
  {
    id: 'arch_3',
    table: 'Table 14',
    orderNumber: '#96',
    completedAt: 'Today, 4:30 PM',
    server: 'David R.',
    items: [{ name: 'Blue Mist Hookah', qty: 1, price: '$34.00' }],
    total: '$34.00',
    status: 'cancelled',
  },
];

export const ArchiveView: React.FC = () => {
  const [archivedTickets, setArchivedTickets] = useState<ArchivedTicket[]>(INITIAL_ARCHIVE);

  const clearArchive = () => {
    if (confirm('Are you sure you want to permanently clear the order archive?')) {
      setArchivedTickets([]);
    }
  };

  return (
    <div id="archivePageLayout" style={{ display: 'block' }}>
      <section className="tickets-section">
        <h2
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginBottom: '20px',
          }}
        >
          <div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cream)' }}>
              Completed &amp; Cancelled Order Archive
            </span>
          </div>
          <button
            className="btn btn-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}
            onClick={clearArchive}
          >
            <Trash2 style={{ width: '14px', height: '14px' }} />
            Clear Archive Permanently
          </button>
        </h2>

        {archivedTickets.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '14px',
              background: 'var(--card)',
              borderRadius: '12px',
              border: '1px solid var(--line)',
            }}
          >
            No archived tickets found.
          </div>
        ) : (
          <div className="tickets-grid" id="archiveTicketsGrid">
            {archivedTickets.map((t) => (
              <div key={t.id} className="ticket-card fulfilled">
                <div className="ticket-header">
                  <div>
                    <div className="ticket-title">
                      {t.table} <span style={{ fontSize: '11px', color: 'var(--muted)' }}>({t.orderNumber})</span>
                    </div>
                    <div className="ticket-meta">
                      {t.completedAt} • Server: {t.server}
                    </div>
                  </div>
                  <span
                    className={`ticket-badge ${
                      t.status === 'fulfilled' ? 'badge-fulfilled' : 'badge-pending'
                    }`}
                  >
                    {t.status.toUpperCase()}
                  </span>
                </div>

                <div className="ticket-items">
                  {t.items.map((item, idx) => (
                    <div key={idx} className="ticket-item-line">
                      <span>{item.qty}x {item.name}</span>
                      <span style={{ color: 'var(--muted)' }}>{item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="ticket-total-row">
                  <span>Archived Total</span>
                  <span>{t.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
