import React, { useState, useEffect } from 'react';
import { Archive } from 'lucide-react';
import { apiClient } from '../api/client';

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

export const ArchiveView: React.FC = () => {
  const [archivedTickets, setArchivedTickets] = useState<ArchivedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadArchive = async () => {
      setLoading(true);
      try {
        const orders = await apiClient.getOrders();
        if (mounted && Array.isArray(orders)) {
          const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;
          const cutoffTime = Date.now() - EIGHT_DAYS_MS;

          const archived = orders
            .filter((o: any) => o.status === 'completed' || o.status === 'cancelled' || o.status === 'fulfilled')
            .filter((o: any) => {
              const dt = o.updatedAt || o.updated_at || o.createdAt || o.created_at
                ? new Date(o.updatedAt || o.updated_at || o.createdAt || o.created_at)
                : new Date();
              return !isNaN(dt.getTime()) && dt.getTime() >= cutoffTime;
            })
            .map((o: any) => {
              const dt = o.updatedAt || o.updated_at || o.createdAt || o.created_at
                ? new Date(o.updatedAt || o.updated_at || o.createdAt || o.created_at)
                : new Date();
              const dateStr = !isNaN(dt.getTime())
                ? dt.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Recent';

              return {
                id: o.id || o._id,
                table: `Table ${o.table || '1'}`,
                orderNumber: o.order_number ? `#${o.order_number}` : `#${String(o.id || o._id).slice(-4)}`,
                completedAt: dateStr,
                server: o.server_name || o.assignedServerName || 'Staff',
                items: (o.items || []).map((it: any) => ({
                  name: it.name || 'Item',
                  qty: it.quantity || it.qty || 1,
                  price: `$${(Number(it.price) || 0).toFixed(2)}`,
                })),
                total: `$${(Number(o.grandTotal || o.total) || 0).toFixed(2)}`,
                status: o.status === 'cancelled' ? ('cancelled' as const) : ('fulfilled' as const),
              };
            });
          setArchivedTickets(archived);
        }
      } catch (e) {
        console.error('Failed to load archived orders from database:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadArchive();
    return () => {
      mounted = false;
    };
  }, []);

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
            <span>Completed &amp; Cancelled Order Archive</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
            <span>Auto-deleted after 8 days</span>
          </div>
        </h2>

        <div className="tickets-grid" id="archiveTicketsGrid">
          {archivedTickets.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '60px',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: '16px',
              }}
            >
              <Archive style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5, display: 'inline-block' }} />
              <div>{loading ? 'Loading archived tickets from database...' : 'Archive is currently empty. Fulfilled tickets will be stored here.'}</div>
            </div>
          ) : (
            archivedTickets.map((t) => (
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
            ))
          )}
        </div>
      </section>
    </div>
  );
};
