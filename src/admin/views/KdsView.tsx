import React, { useState, useEffect } from 'react';
import {
  Printer,
  CheckCircle,
  Inbox,
  PlusCircle,
  Flame,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '../api/client';

export interface TicketItem {
  name: string;
  qty: number;
  price?: number;
  category?: 'kitchen' | 'bar' | 'hookah';
  notes?: string;
  hasIceBase?: boolean;
  hasIceHose?: boolean;
}

export interface KdsTicket {
  id: string;
  table: string;
  orderNumber: string;
  timestamp: string;
  timeAgo: string;
  customerName?: string;
  assignedServerName?: string;
  assignedServerId?: string;
  status: 'pending' | 'preparing' | 'ready' | 'fulfilled';
  foodDone?: boolean;
  barDone?: boolean;
  hookahDone?: boolean;
  items: TicketItem[];
  customerNotes?: string;
  subtotal: number;
  tax: number;
  tips: number;
  grandTotal: number;
  totalPaid: number;
}

export interface ServerCallRequest {
  id: string;
  table: string;
  orderNumber: string;
  type: 'server' | 'coals' | 'water' | 'utensils' | 'check';
  title: string;
  timeAgo: string;
  assignedServerName?: string;
  status: 'active' | 'dismissed';
}

interface KdsViewProps {
  onOpenCollectCash?: (orderId: string, grandTotal: number, totalPaid: number, totalDue: number) => void;
  onOpenReassignServer?: (orderId: string, tableLabel: string, currentServerId?: string, currentServerName?: string) => void;
  currentUserRole?: string;
  currentUserId?: string;
  currentUserName?: string;
}

const SAMPLE_TICKETS: KdsTicket[] = [];
const SAMPLE_SERVER_CALLS: ServerCallRequest[] = [];

export const KdsView: React.FC<KdsViewProps> = ({
  onOpenCollectCash,
  onOpenReassignServer,
  currentUserRole = 'manager',
  currentUserId = 'u1',
  currentUserName = 'Suwasna Gorkhali',
}) => {
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [serverCalls, setServerCalls] = useState<ServerCallRequest[]>([]);
  const [showCoalQueue, setShowCoalQueue] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadOrdersAndCalls = async () => {
    setLoading(true);
    try {
      const [orders, requests] = await Promise.all([
        apiClient.getOrders(),
        apiClient.getServiceRequests(),
      ]);

      if (Array.isArray(orders)) {
        const mappedTickets: KdsTicket[] = orders.map((ord: any) => {
          const items: TicketItem[] = (ord.items || []).map((it: any) => ({
            name: it.name || 'Item',
            qty: it.quantity || it.qty || 1,
            price: it.price || 0,
            category: (it.category?.toLowerCase() === 'hookah' ? 'hookah' : (it.category?.toLowerCase() === 'drinks' || it.category?.toLowerCase() === 'bar' ? 'bar' : 'kitchen')) as any,
            notes: it.notes || it.note || '',
            hasIceBase: !!it.hasIceBase,
            hasIceHose: !!it.hasIceHose,
          }));

          const createdTime = ord.created_at || ord.createdAt || new Date().toISOString();
          const dateObj = new Date(createdTime);
          const timeStr = !isNaN(dateObj.getTime())
            ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Now';

          const minsAgo = !isNaN(dateObj.getTime())
            ? Math.max(0, Math.floor((Date.now() - dateObj.getTime()) / 60000))
            : 0;

          return {
            id: ord.id || ord._id,
            table: String(ord.table || ord.table_number || ord.tableNumber || '1'),
            orderNumber: ord.orderNumber || (ord.order_number ? `#${ord.order_number}` : `#${String(ord.id || ord._id).slice(-4)}`),
            timestamp: timeStr,
            timeAgo: minsAgo === 0 ? 'just now' : `${minsAgo}m ago`,
            customerName: ord.customerName || ord.customer_name || 'Guest',
            assignedServerName: ord.assignedServerName || ord.server_name || ord.assigned_server_name || 'Server',
            assignedServerId: ord.assignedServerId || ord.server_id,
            status: (ord.status === 'completed' || ord.status === 'fulfilled')
              ? 'fulfilled'
              : (ord.status === 'ready' ? 'ready' : (ord.status === 'preparing' ? 'preparing' : 'pending')),
            foodDone: ord.foodDone || false,
            barDone: ord.barDone || false,
            hookahDone: ord.hookahDone || false,
            items,
            customerNotes: ord.notes || ord.customerNotes || '',
            subtotal: ord.subtotal || ord.total || 0,
            tax: ord.taxAmount || ord.tax || 0,
            tips: ord.tipAmount || ord.tips || 0,
            grandTotal: ord.grandTotal || ord.total || 0,
            totalPaid: ord.paymentStatus === 'paid' ? (ord.grandTotal || ord.total || 0) : (ord.totalPaid || 0),
          };
        });
        setTickets(mappedTickets);
      }

      if (Array.isArray(requests)) {
        const mappedCalls: ServerCallRequest[] = requests.map((req: any) => {
          const reqTime = req.created_at || req.createdAt || new Date().toISOString();
          const dateObj = new Date(reqTime);
          const minsAgo = !isNaN(dateObj.getTime())
            ? Math.max(0, Math.floor((Date.now() - dateObj.getTime()) / 60000))
            : 0;

          const rawType = (req.request_type || req.type || 'server').toLowerCase();
          const callType: 'server' | 'coals' | 'water' | 'utensils' | 'check' = 
            rawType.includes('coal') ? 'coals' : (rawType.includes('water') ? 'water' : (rawType.includes('utensil') ? 'utensils' : 'server'));

          return {
            id: req.id || req._id,
            table: String(req.table_number || req.table_id || req.table || '1').replace(/^TBL_|^Table\s*/i, ''),
            orderNumber: req.order_number ? `#${req.order_number}` : `#${String(req.id || req._id).slice(-4)}`,
            type: callType,
            title: req.note || (callType === 'coals' ? 'Hookah Coal Refill 🔥' : 'Server Assistance Needed'),
            timeAgo: minsAgo === 0 ? 'just now' : `${minsAgo}m ago`,
            assignedServerName: req.assigned_server_name || req.server_name || 'Assigned Staff',
            status: (req.status?.toLowerCase() === 'completed' || req.status?.toLowerCase() === 'dismissed') ? 'dismissed' : 'active',
          };
        });
        setServerCalls(mappedCalls);
      }
    } catch (e) {
      console.error('Failed to load live KDS orders/requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdersAndCalls();
  }, []);

  const isHookahOrManager =
    currentUserRole === 'hookah_maker' ||
    currentUserRole === 'manager' ||
    currentUserRole === 'owner' ||
    currentUserRole === 'admin';

  const activeTickets = tickets.filter((t) => t.status !== 'fulfilled');
  const activeCoalRequests = serverCalls.filter(
    (c) => c.status === 'active' && c.type === 'coals'
  );

  const updateTicketStatus = async (
    id: string,
    newStatus: 'pending' | 'preparing' | 'ready' | 'fulfilled'
  ) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    try {
      await apiClient.updateOrderStatus(id, newStatus === 'fulfilled' ? 'completed' : newStatus);
    } catch (e) {
      console.error('Failed to update ticket status in database:', e);
    }
  };

  const cancelTicket = (id: string) => {
    if (confirm('Cancel this ticket order?')) {
      setTickets((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const dismissServerCall = (id: string) => {
    setServerCalls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'dismissed' } : c))
    );
  };

  const handlePrintTicket = (ticket: KdsTicket) => {
    const printArea = document.getElementById('print-area');
    if (printArea) {
      printArea.innerHTML = `
        <div style="font-family: monospace; padding: 10px; max-width: 300px;">
          <h2 style="text-align: center; margin: 0;">BENZIN - CAVALLI</h2>
          <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px;">
            TABLE ${ticket.table} - ORDER ${ticket.orderNumber}
          </div>
          <div>Time: ${ticket.timestamp}</div>
          <div>Server: ${ticket.assignedServerName || 'Unassigned'}</div>
          <div>Guest: ${ticket.customerName || 'Guest'}</div>
          <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>
          ${ticket.items
            .map(
              (i) =>
                `<div style="display:flex; justify-content:space-between;"><span>${i.qty}x ${i.name}</span><span>$${((i.price || 0) * i.qty).toFixed(2)}</span></div>${i.notes ? `<div style="font-size:10px; padding-left:10px;">* ${i.notes}</div>` : ''}`
            )
            .join('')}
          <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>
          <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span><span>$${ticket.subtotal.toFixed(2)}</span></div>
          <div style="display:flex; justify-content:space-between;"><span>Tax:</span><span>$${ticket.tax.toFixed(2)}</span></div>
          <div style="display:flex; justify-content:space-between;"><span>Tips:</span><span>$${ticket.tips.toFixed(2)}</span></div>
          <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:14px; margin-top:4px;"><span>GRAND TOTAL:</span><span>$${ticket.grandTotal.toFixed(2)}</span></div>
        </div>
      `;
      window.print();
    }
  };

  return (
    <div className="kds-layout" id="kdsPageLayout">
      {/* Hookah Station Coal Refill Request Queue (Visible for Hookah Maker & Managers) */}
      {isHookahOrManager && (
        <div
          id="hookahStationQueueSection"
          style={{ display: showCoalQueue ? 'block' : 'none', marginBottom: '24px' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background:
                'linear-gradient(135deg, rgba(255,90,31,0.18) 0%, rgba(229,177,58,0.12) 100%)',
              border: '1.5px solid rgba(255,90,31,0.45)',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🔥</span>
              <div>
                <div
                  style={{
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '16px',
                    letterSpacing: '0.5px',
                  }}
                >
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
              {activeCoalRequests.length} ACTIVE
            </div>
          </div>

          <div className="tickets-grid" id="hookahRequestsGrid">
            {activeCoalRequests.map((req) => (
              <div
                key={req.id}
                className="ticket-card server-call-ticket"
                style={{
                  border: '2px solid #ff5a1f',
                  boxShadow: '0 0 24px rgba(255,90,31,0.28)',
                }}
              >
                <div
                  className="ticket-header"
                  style={{
                    background: 'rgba(255,90,31,0.12)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <div
                      className="ticket-title"
                      style={{
                        color: '#ff5a1f',
                        fontSize: '19px',
                        fontWeight: 900,
                      }}
                    >
                      🔥 Table {req.table}{' '}
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {req.orderNumber}
                      </span>
                    </div>
                    <div className="ticket-meta">
                      🕒 {req.timeAgo} • Hookah Coal Refresh
                    </div>
                  </div>
                  <span
                    className="ticket-badge"
                    style={{
                      background: '#ff5a1f',
                      color: '#fff',
                      fontWeight: 900,
                    }}
                  >
                    COAL REFILL
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1.5px solid rgba(255,90,31,0.3)',
                    borderRadius: '12px',
                    padding: '16px 14px',
                    textAlign: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
                    Fresh Coconut Coals Needed
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700 }}>
                    Customer at Table {req.table} is ready for hot coals
                  </div>
                </div>

                <div className="ticket-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => dismissServerCall(req.id)}
                    style={{
                      background: '#10b981',
                      borderColor: '#10b981',
                      fontWeight: 900,
                      flex: 1,
                      padding: '10px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle style={{ width: '16px', height: '16px' }} />
                    <span>Coals Refilled / Dismiss</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main KDS Tickets Section */}
      <section className="tickets-section">
        <h2
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <span>Active Live KDS Tickets</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn"
              onClick={() => setShowCoalQueue(!showCoalQueue)}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <Flame style={{ width: '13px', height: '13px' }} />
              <span>{showCoalQueue ? 'Hide Coal Queue' : 'Show Coal Queue'}</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={loadOrdersAndCalls}
              disabled={loading}
              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 800 }}
            >
              <RefreshCw style={{ width: '13px', height: '13px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>{loading ? 'Refreshing...' : 'Refresh Live Orders'}</span>
            </button>
          </div>
        </h2>

        <div className="tickets-grid" id="ticketsGrid">
          {/* Render active customer assistance call tickets (non-coal) */}
          {serverCalls
            .filter((c) => c.status === 'active' && c.type !== 'coals')
            .map((req) => (
              <div
                key={req.id}
                className="ticket-card server-call-ticket"
                style={{
                  border: '2px solid #e11d48',
                  boxShadow: '0 0 24px rgba(225,29,72,0.28)',
                }}
              >
                <div
                  className="ticket-header"
                  style={{
                    background: 'rgba(225,29,72,0.12)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <div
                      className="ticket-title"
                      style={{
                        color: '#f43f5e',
                        fontSize: '19px',
                        fontWeight: 900,
                      }}
                    >
                      🛎️ Table {req.table}{' '}
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {req.orderNumber}
                      </span>
                    </div>
                    <div className="ticket-meta">
                      🕒 {req.timeAgo} • 🍽️ Served by:{' '}
                      <strong style={{ color: 'var(--cream)' }}>
                        {req.assignedServerName || 'Staff'}
                      </strong>
                    </div>
                  </div>
                  <span
                    className="ticket-badge"
                    style={{
                      background: '#e11d48',
                      color: '#fff',
                      fontWeight: 900,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  >
                    CALL SERVER
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1.5px solid rgba(225,29,72,0.3)',
                    borderRadius: '12px',
                    padding: '18px 14px',
                    textAlign: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>
                    {req.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 700 }}>
                    Customer at Table {req.table} is waiting for staff assistance
                  </div>
                </div>

                <div className="ticket-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => dismissServerCall(req.id)}
                    style={{
                      background: '#10b981',
                      borderColor: '#10b981',
                      fontWeight: 900,
                      flex: 1,
                      padding: '12px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle style={{ width: '18px', height: '18px' }} />
                    <span>Complete / Dismiss</span>
                  </button>
                </div>
              </div>
            ))}

          {/* Render standard tickets or empty state */}
          {activeTickets.length === 0 &&
          serverCalls.filter((c) => c.status === 'active').length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '60px',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: '16px',
              }}
            >
              <Inbox
                style={{
                  width: '48px',
                  height: '48px',
                  marginBottom: '12px',
                  opacity: 0.5,
                  display: 'inline-block',
                }}
              />
              <div>
                No active live tickets. New orders will appear here automatically in real time!
              </div>
            </div>
          ) : (
            activeTickets.map((ticket) => {
              const totalDue = Math.max(0, ticket.grandTotal - ticket.totalPaid);
              const isPaid = totalDue <= 0.01;
              const isPartial = ticket.totalPaid > 0 && !isPaid;

              const kitchenItems = ticket.items.filter((i) => i.category === 'kitchen');
              const barItems = ticket.items.filter((i) => i.category === 'bar');
              const hookahItems = ticket.items.filter((i) => i.category === 'hookah');

              const isAssignedToMe =
                ticket.assignedServerId === currentUserId ||
                ticket.assignedServerName === currentUserName;

              return (
                <div key={ticket.id} className="ticket-card">
                  {/* Ticket Header */}
                  <div className="ticket-header">
                    <div>
                      <div className="ticket-title">
                        Table {ticket.table}{' '}
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {ticket.orderNumber}
                        </span>
                      </div>
                      <div className="ticket-meta">
                        👤 {ticket.customerName || 'Guest'} • 🕒 {ticket.timestamp} (
                        {ticket.timeAgo})
                        {ticket.assignedServerName && (
                          <span>
                            {' '}
                            • 🍽️ Served by:{' '}
                            <strong style={{ color: 'var(--cream)' }}>
                              {ticket.assignedServerName}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`ticket-badge ${
                        ticket.status === 'ready'
                          ? 'badge-ready'
                          : ticket.status === 'preparing'
                          ? 'badge-preparing'
                          : 'badge-pending'
                      }`}
                    >
                      {ticket.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Server Assignment Badge Pill */}
                  <div style={{ marginBottom: '8px' }}>
                    {!ticket.assignedServerName ? (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(245,158,11,0.12)',
                          border: '1px dashed #f59e0b',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '11px',
                        }}
                      >
                        <span style={{ color: '#f59e0b', fontWeight: 800 }}>
                          👤 Server: <em>Unassigned</em>
                        </span>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            if (onOpenReassignServer) {
                              onOpenReassignServer(ticket.id, `Table ${ticket.table}`, '', 'Unassigned');
                            }
                          }}
                          style={{
                            background: '#0066FF',
                            padding: '3px 9px',
                            fontSize: '11px',
                            fontWeight: 800,
                            borderRadius: '6px',
                            minHeight: 'unset',
                          }}
                        >
                          Assign Server
                        </button>
                      </div>
                    ) : isAssignedToMe ? (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(16,185,129,0.15)',
                          border: '1px solid #10B981',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '11px',
                        }}
                      >
                        <span style={{ color: '#10B981', fontWeight: 800 }}>
                          ✓ Assigned to me ({ticket.assignedServerName})
                        </span>
                        <button
                          className="btn"
                          onClick={() => {
                            if (onOpenReassignServer) {
                              onOpenReassignServer(
                                ticket.id,
                                `Table ${ticket.table}`,
                                ticket.assignedServerId,
                                ticket.assignedServerName
                              );
                            }
                          }}
                          style={{
                            padding: '2px 8px',
                            fontSize: '11px',
                            color: 'var(--muted)',
                            minHeight: 'unset',
                          }}
                        >
                          Reassign
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'var(--card2)',
                          border: '1px solid var(--line)',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '11px',
                        }}
                      >
                        <span style={{ color: 'var(--cream)', fontWeight: 800 }}>
                          👤 Server: <strong>{ticket.assignedServerName}</strong>
                        </span>
                        <button
                          className="btn"
                          onClick={() => {
                            if (onOpenReassignServer) {
                              onOpenReassignServer(
                                ticket.id,
                                `Table ${ticket.table}`,
                                ticket.assignedServerId,
                                ticket.assignedServerName
                              );
                            }
                          }}
                          style={{
                            padding: '2px 8px',
                            fontSize: '11px',
                            color: '#60a5fa',
                            minHeight: 'unset',
                          }}
                        >
                          Reassign
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Readiness and Billing Status Badges */}
                  <div
                    style={{
                      marginBottom: '6px',
                      display: 'flex',
                      gap: '4px',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    {kitchenItems.length > 0 && (
                      <span
                        style={{
                          background: ticket.foodDone
                            ? 'rgba(34,197,94,0.15)'
                            : 'rgba(239,68,68,0.15)',
                          color: ticket.foodDone ? 'var(--success)' : 'var(--danger)',
                          border: `1px solid ${
                            ticket.foodDone ? 'var(--success)' : 'var(--danger)'
                          }`,
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontSize: '9px',
                          fontWeight: 700,
                        }}
                      >
                        {ticket.foodDone ? '✅ Food Ready' : '⏳ Food Pending'}
                      </span>
                    )}

                    {barItems.length > 0 && (
                      <span
                        style={{
                          background: ticket.barDone
                            ? 'rgba(34,197,94,0.15)'
                            : 'rgba(239,68,68,0.15)',
                          color: ticket.barDone ? 'var(--success)' : 'var(--danger)',
                          border: `1px solid ${
                            ticket.barDone ? 'var(--success)' : 'var(--danger)'
                          }`,
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontSize: '9px',
                          fontWeight: 700,
                        }}
                      >
                        {ticket.barDone ? '✅ Bar Ready' : '⏳ Bar Pending'}
                      </span>
                    )}

                    {hookahItems.length > 0 && (
                      <span
                        style={{
                          background: ticket.hookahDone
                            ? 'rgba(34,197,94,0.15)'
                            : 'rgba(239,68,68,0.15)',
                          color: ticket.hookahDone ? 'var(--success)' : 'var(--danger)',
                          border: `1px solid ${
                            ticket.hookahDone ? 'var(--success)' : 'var(--danger)'
                          }`,
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontSize: '9px',
                          fontWeight: 700,
                        }}
                      >
                        {ticket.hookahDone ? '✅ Hookah Ready' : '⏳ Hookah Pending'}
                      </span>
                    )}

                    {/* Billing Status Badge */}
                    {isPaid ? (
                      <span
                        style={{
                          background: 'rgba(34,197,94,0.15)',
                          color: 'var(--success)',
                          border: '1px solid var(--success)',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontSize: '9px',
                          fontWeight: 800,
                        }}
                      >
                        💵 PAID IN FULL (${ticket.grandTotal.toFixed(2)})
                      </span>
                    ) : isPartial ? (
                      <span
                        style={{
                          background: 'rgba(229,177,58,0.15)',
                          color: 'var(--gold)',
                          border: '1px solid var(--gold)',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontSize: '9px',
                          fontWeight: 800,
                        }}
                      >
                        💳 PARTIAL (Paid: ${ticket.totalPaid.toFixed(2)}, Due: $
                        {totalDue.toFixed(2)})
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(239,68,68,0.15)',
                          color: 'var(--danger)',
                          border: '1px solid var(--danger)',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontSize: '9px',
                          fontWeight: 800,
                        }}
                      >
                        🔴 UNPAID (Due: ${totalDue.toFixed(2)})
                      </span>
                    )}
                  </div>

                  {/* Grouped Items Breakdown */}
                  <div className="ticket-items">
                    {kitchenItems.length > 0 && (
                      <div>
                        <div className="ticket-item-group-title">🍔 KITCHEN</div>
                        {kitchenItems.map((item, idx) => (
                          <div key={idx} style={{ marginBottom: '4px' }}>
                            <div className="ticket-item-line">
                              <span>
                                {item.name}{' '}
                                {item.qty > 1 && (
                                  <span style={{ color: 'var(--gold)', fontWeight: 900 }}>
                                    x{item.qty}
                                  </span>
                                )}
                              </span>
                            </div>
                            {item.notes && (
                              <div className="ticket-item-note">Note: {item.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {barItems.length > 0 && (
                      <div>
                        <div className="ticket-item-group-title">🍸 BAR</div>
                        {barItems.map((item, idx) => (
                          <div key={idx} style={{ marginBottom: '4px' }}>
                            <div className="ticket-item-line">
                              <span>
                                {item.name}{' '}
                                {item.qty > 1 && (
                                  <span style={{ color: 'var(--gold)', fontWeight: 900 }}>
                                    x{item.qty}
                                  </span>
                                )}
                              </span>
                            </div>
                            {item.notes && (
                              <div className="ticket-item-note">Note: {item.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {hookahItems.length > 0 && (
                      <div>
                        <div className="ticket-item-group-title">💨 HOOKAH</div>
                        {hookahItems.map((item, idx) => (
                          <div key={idx} style={{ marginBottom: '6px' }}>
                            <div
                              className="ticket-item-line"
                              style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}
                            >
                              <span>
                                💨 <strong>{item.name}</strong>{' '}
                                {item.qty > 1 && (
                                  <span style={{ color: 'var(--gold)', fontWeight: 900 }}>
                                    x{item.qty}
                                  </span>
                                )}
                              </span>
                              {item.hasIceBase && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    background: 'rgba(0,153,255,0.22)',
                                    color: '#38BDF8',
                                    border: '1.5px solid #0099FF',
                                    borderRadius: '6px',
                                    padding: '2px 7px',
                                    fontSize: '11px',
                                    fontWeight: 900,
                                    marginLeft: '6px',
                                  }}
                                >
                                  🧊 ICE BASE
                                </span>
                              )}
                              {item.hasIceHose && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    background: 'rgba(20,184,166,0.22)',
                                    color: '#2DD4BF',
                                    border: '1.5px solid #14B8A6',
                                    borderRadius: '6px',
                                    padding: '2px 7px',
                                    fontSize: '11px',
                                    fontWeight: 900,
                                    marginLeft: '6px',
                                  }}
                                >
                                  ❄️ ICE HOSE
                                </span>
                              )}
                            </div>
                            {item.notes && (
                              <div
                                className="ticket-item-note"
                                style={{ color: '#FBBF24', fontWeight: 700 }}
                              >
                                📝 Note: {item.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customer Notes Callout */}
                  {ticket.customerNotes && (
                    <div
                      className="ticket-note"
                      style={{
                        background: 'rgba(229,177,58,0.08)',
                        border: '1px solid rgba(229,177,58,0.3)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        color: 'var(--gold)',
                        margin: '8px 0',
                        fontStyle: 'italic',
                      }}
                    >
                      📝 Customer Request: "{ticket.customerNotes}"
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div
                    style={{
                      marginTop: '8px',
                      paddingTop: '6px',
                      borderTop: '1px dashed var(--line)',
                      fontSize: '11px',
                      color: 'var(--muted)',
                    }}
                  >
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span>Subtotal</span>
                      <span>${ticket.subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span>Sales Tax (8.25%)</span>
                      <span>${ticket.tax.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span>Gratuity (18%)</span>
                      <span>${ticket.tips.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Total Due */}
                  <div
                    className="ticket-total-row"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>TOTAL DUE</span>
                    <span
                      style={{
                        fontWeight: 900,
                        color: isPaid ? 'var(--success)' : 'var(--gold)',
                      }}
                    >
                      ${totalDue.toFixed(2)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="ticket-actions">
                    <button
                      className="btn"
                      onClick={() => updateTicketStatus(ticket.id, 'preparing')}
                      style={{
                        background: 'rgba(59,130,246,0.15)',
                        borderColor: '#3B82F6',
                        color: '#60A5FA',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '4px 8px',
                      }}
                    >
                      👨‍🍳 Prep
                    </button>
                    <button
                      className="btn"
                      onClick={() => updateTicketStatus(ticket.id, 'ready')}
                      style={{
                        background: 'rgba(245,158,11,0.15)',
                        borderColor: '#F59E0B',
                        color: '#FBBF24',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '4px 8px',
                      }}
                    >
                      🔔 Ready
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => updateTicketStatus(ticket.id, 'fulfilled')}
                      style={{
                        background: 'var(--success)',
                        borderColor: 'var(--success)',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '4px 8px',
                      }}
                    >
                      <CheckCircle style={{ width: '13px', height: '13px' }} /> Serve
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        if (onOpenCollectCash) {
                          onOpenCollectCash(
                            ticket.id,
                            ticket.grandTotal,
                            ticket.totalPaid,
                            totalDue
                          );
                        }
                      }}
                      style={{
                        background: 'rgba(229,177,58,0.15)',
                        borderColor: 'var(--gold)',
                        color: 'var(--gold)',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '4px 8px',
                      }}
                    >
                      💵 Pay Cash
                    </button>
                    <button
                      className="btn"
                      onClick={() => handlePrintTicket(ticket)}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      title="Print Thermal Ticket"
                    >
                      <Printer style={{ width: '13px', height: '13px' }} /> Print
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => cancelTicket(ticket.id)}
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      title="Cancel Order"
                    >
                      <XCircle style={{ width: '13px', height: '13px' }} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
