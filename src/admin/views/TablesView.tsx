import React, { useState, useEffect } from 'react';
import { RefreshCw, PlusCircle, Edit2, RotateCcw } from 'lucide-react';
import { AdminTabId } from '../types';
import { apiClient } from '../api/client';

export interface FloorTable {
  id: string;
  tableNumber: string | number;
  label: string;
  capacity: number;
  section: string;
  status: 'available' | 'new_order' | 'in_progress' | 'ready' | 'completed';
  activeOrder?: {
    orderId: string;
    orderNumber: string;
    total: number;
    totalDue: number;
    elapsed: string;
    serverName?: string;
    serverId?: string;
    customerNickname?: string;
    itemSummary: string;
  };
}

interface TablesViewProps {
  onOpenAddTable?: () => void;
  onOpenEditTable?: (table: {
    id: string;
    tableNumber: string | number;
    label: string;
    capacity: number;
  }) => void;
  onOpenCollectCash?: (orderId: string, grandTotal: number, totalPaid: number, totalDue: number) => void;
  onOpenReassignServer?: (orderId: string, tableLabel: string, currentServerId?: string, currentServerName?: string) => void;
  onSelectTab?: (tabId: AdminTabId) => void;
  currentUserId?: string;
  currentUserName?: string;
}

export const TablesView: React.FC<TablesViewProps> = ({
  onOpenAddTable,
  onOpenEditTable,
  onOpenCollectCash,
  onOpenReassignServer,
  onSelectTab,
  currentUserId = 'u1',
  currentUserName = 'Suwasna Gorkhali',
}) => {
  const [tables, setTables] = useState<FloorTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'my' | 'available'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Fetch live tables and orders from MongoDB Atlas
  const loadFloorData = async () => {
    try {
      setLoading(true);
      const [rawTables, rawOrders] = await Promise.all([
        apiClient.getTables(),
        apiClient.getOrders(false),
      ]);

      const activeOrders = (Array.isArray(rawOrders) ? rawOrders : []).filter(
        (o: any) => !o.closedSession && o.status !== 'cancelled'
      );

      const mapped: FloorTable[] = (Array.isArray(rawTables) ? rawTables : []).map((t: any) => {
        const tableLabel = t.label || `Table ${t.number}`;
        const cleanTblNum = String(t.number || '').trim();
        const cleanLabel = String(tableLabel).trim().toLowerCase();

        // Find active order matching this table
        const matchingOrder = activeOrders.find((o: any) => {
          if (o.table_id && (o.table_id === t._id || o.table_id === t.id)) return true;
          const oTable = String(o.table || '').trim().toLowerCase();
          const oTableClean = oTable.replace(/^table[\s-_]*/i, '').trim();
          return (
            oTable === cleanLabel ||
            oTable === cleanTblNum ||
            oTableClean === cleanTblNum ||
            oTableClean === cleanLabel
          );
        });

        let status: FloorTable['status'] = 'available';
        let activeOrderObj: FloorTable['activeOrder'] | undefined = undefined;

        if (matchingOrder) {
          const ordStatus = (matchingOrder.status || '').toLowerCase();
          if (ordStatus === 'fulfilled' || ordStatus === 'completed' || ordStatus === 'served') {
            status = 'completed';
          } else if (ordStatus === 'ready') {
            status = 'ready';
          } else if (ordStatus === 'in_progress' || ordStatus === 'preparing') {
            status = 'in_progress';
          } else {
            status = 'new_order';
          }

          // Build item summary
          let summary = '';
          if (Array.isArray(matchingOrder.items) && matchingOrder.items.length > 0) {
            summary = matchingOrder.items
              .map((i: any) => `${i.qty || 1}x ${i.name || i.flavor?.name || 'Item'}`)
              .join(', ');
          } else if (Array.isArray(matchingOrder.hookahs) && matchingOrder.hookahs.length > 0) {
            summary = matchingOrder.hookahs
              .map((h: any) => `${h.qty || 1}x ${h.name || h.flavor?.name || 'Hookah'}`)
              .join(', ');
          } else {
            summary = matchingOrder.notes || 'Dine-in Order';
          }

          // Calculate elapsed time
          let elapsed = 'Active';
          if (matchingOrder.createdAt) {
            const diffMin = Math.floor(
              (Date.now() - new Date(matchingOrder.createdAt).getTime()) / 60000
            );
            elapsed = diffMin < 1 ? 'Just now' : `${diffMin}m ago`;
          }

          const total = Number(matchingOrder.grandTotal ?? matchingOrder.total) || 0;
          const paid = Number(matchingOrder.totalPaid) || 0;
          const totalDue = Number(matchingOrder.totalDue ?? (total - paid)) || 0;

          activeOrderObj = {
            orderId: matchingOrder.id || matchingOrder._id,
            orderNumber: `#${String(matchingOrder.id || matchingOrder._id).slice(-4).toUpperCase()}`,
            total,
            totalDue,
            elapsed,
            serverName: matchingOrder.assigned_server_name || matchingOrder.assignedServerName,
            serverId: matchingOrder.assigned_server_id || matchingOrder.assignedServerId,
            customerNickname: matchingOrder.customerNickname || matchingOrder.customerName,
            itemSummary: summary,
          };
        }

        // Section logic
        let section = 'Main Lounge';
        if (/^p\d+/i.test(tableLabel) || cleanLabel.includes('patio')) {
          section = 'Patio';
        } else if (cleanLabel.includes('vip')) {
          section = 'VIP Booth';
        }

        return {
          id: t._id || t.id,
          tableNumber: t.number || cleanTblNum,
          label: tableLabel,
          capacity: t.capacity || 4,
          section,
          status,
          activeOrder: activeOrderObj,
        };
      });

      setTables(mapped);
    } catch (err) {
      console.error('Error fetching tables from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFloorData();
    const interval = setInterval(loadFloorData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Action: Reset Table back to Available state after guests get up
  const handleResetTable = async (tableId: string, orderId?: string) => {
    if (!confirm('Reset this table to Available? Any served order sessions will be closed out.')) {
      return;
    }
    try {
      setResettingId(tableId);
      const res = await apiClient.resetTable(tableId, orderId);
      if (res && res.success) {
        // Optimistically update table status
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId ? { ...t, status: 'available', activeOrder: undefined } : t
          )
        );
        await loadFloorData();
      } else {
        alert('Could not reset table: ' + (res?.message || 'Server error'));
      }
    } catch (err: any) {
      alert('Error resetting table: ' + err.message);
    } finally {
      setResettingId(null);
    }
  };

  const countTotal = tables.length;
  const countNewOrders = tables.filter((t) => t.status === 'new_order').length;
  const countInProgress = tables.filter((t) => t.status === 'in_progress').length;
  const countReady = tables.filter((t) => t.status === 'ready').length;
  const countAvailable = tables.filter((t) => t.status === 'available').length;
  const countActive = tables.filter((t) => t.status !== 'available').length;

  const countMy = tables.filter(
    (t) =>
      t.status !== 'available' &&
      (t.activeOrder?.serverId === currentUserId ||
        t.activeOrder?.serverName === currentUserName)
  ).length;

  const filteredTables = tables.filter((tbl) => {
    if (filter === 'active' && tbl.status === 'available') return false;
    if (filter === 'available' && tbl.status !== 'available') return false;
    if (filter === 'my') {
      if (tbl.status === 'available') return false;
      const isMine =
        tbl.activeOrder?.serverId === currentUserId ||
        tbl.activeOrder?.serverName === currentUserName;
      if (!isMine) return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchLabel = tbl.label.toLowerCase().includes(q);
      const matchServer = (tbl.activeOrder?.serverName || '').toLowerCase().includes(q);
      const matchCustomer = (tbl.activeOrder?.customerNickname || '').toLowerCase().includes(q);
      const matchItems = (tbl.activeOrder?.itemSummary || '').toLowerCase().includes(q);
      if (!matchLabel && !matchServer && !matchCustomer && !matchItems) return false;
    }

    return true;
  });

  const renderStatusPill = (status: FloorTable['status']) => {
    switch (status) {
      case 'new_order':
        return <span className="table-pill table-pill-new_order">🔥 NEW ORDER</span>;
      case 'in_progress':
        return <span className="table-pill table-pill-in_progress">⏳ IN PROGRESS</span>;
      case 'ready':
        return <span className="table-pill table-pill-ready">✓ READY</span>;
      case 'completed':
        return <span className="table-pill table-pill-completed">✓ SERVED / DUE</span>;
      case 'available':
      default:
        return <span className="table-pill table-pill-available">○ AVAILABLE</span>;
    }
  };

  return (
    <div id="tablesPageLayout" style={{ padding: '20px 24px 60px 24px' }}>
      {/* Top Header & Live Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--cream)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>🪑 Floor Table Overview</span>
            <span
              id="tablesLivePulseDot"
              style={{
                display: 'inline-block',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulseAlert 1.5s infinite ease-in-out',
              }}
              title="Real-Time Stream Active"
            />
          </h2>
        </div>

        {/* Quick Floor Statistics */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div
            style={{
              background: 'var(--card)',
              border: '1.5px solid var(--line)',
              borderRadius: '10px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              gap: '12px',
            }}
          >
            <span style={{ color: 'var(--muted)' }}>
              Total: <strong style={{ color: 'var(--cream)' }}>{countTotal}</strong>
            </span>
            <span style={{ color: '#ef4444' }}>
              Active: <strong>{countActive}</strong>
            </span>
            <span style={{ color: 'var(--success)' }}>
              Available: <strong>{countAvailable}</strong>
            </span>
          </div>

          <button
            className="btn btn-primary touch-target"
            onClick={onOpenAddTable}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PlusCircle style={{ width: '14px', height: '14px' }} />
            <span>+ Add Table</span>
          </button>

          <button
            className="btn touch-target"
            onClick={loadFloorData}
            style={{ padding: '8px 12px', fontSize: '12px' }}
            title="Refresh tables floor state from database"
          >
            <RefreshCw style={{ width: '13px', height: '13px' }} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn touch-target ${filter === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('all')}
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '20px' }}
          >
            All Tables ({countTotal})
          </button>
          <button
            className={`btn touch-target ${filter === 'active' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('active')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              borderRadius: '20px',
              borderColor: '#ef4444',
              color: filter === 'active' ? '#fff' : '#ef4444',
            }}
          >
            Occupied ({countActive})
          </button>
          <button
            className={`btn touch-target ${filter === 'available' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('available')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              borderRadius: '20px',
              borderColor: 'var(--success)',
              color: filter === 'available' ? '#fff' : 'var(--success)',
            }}
          >
            Available ({countAvailable})
          </button>
          <button
            className={`btn touch-target ${filter === 'my' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('my')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              borderRadius: '20px',
              borderColor: 'var(--gold)',
              color: filter === 'my' ? '#000' : 'var(--gold)',
            }}
          >
            My Tables ({countMy})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ minWidth: '220px', maxWidth: '320px', flex: 1 }}>
          <input
            type="text"
            placeholder="🔍 Filter tables, servers, orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'var(--card)',
              border: '1.5px solid var(--line)',
              borderRadius: '10px',
              color: 'var(--cream)',
              fontSize: '12px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {loading && tables.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', fontSize: '14px' }}>
          Loading floor tables from database...
        </div>
      ) : (
        /* Floor Grid Layout */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredTables.map((tbl) => {
            const isAssignedToMe =
              tbl.activeOrder?.serverId === currentUserId ||
              tbl.activeOrder?.serverName === currentUserName;
            const order = tbl.activeOrder;
            const isOccupied = tbl.status !== 'available';
            const isResetting = resettingId === tbl.id;

            return (
              <div
                key={tbl.id}
                className="table-card"
                style={{
                  background: 'var(--card)',
                  border: isOccupied ? '1.5px solid var(--ember)' : '1.5px solid var(--line)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isOccupied ? '0 8px 24px rgba(239, 68, 68, 0.12)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div>
                  {/* Card Header: Table Number & Status Pill */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '18px',
                          fontWeight: 900,
                          color: 'var(--cream)',
                          fontFamily: 'var(--font-outfit)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{tbl.label}</span>
                        <button
                          className="btn"
                          onClick={() =>
                            onOpenEditTable &&
                            onOpenEditTable({
                              id: tbl.id,
                              tableNumber: tbl.tableNumber,
                              label: tbl.label,
                              capacity: tbl.capacity,
                            })
                          }
                          style={{
                            padding: '2px 5px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                          }}
                          title="Edit table capacity and name"
                        >
                          <Edit2 style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                        {tbl.section} • {tbl.capacity} Seats
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {renderStatusPill(tbl.status)}
                    </div>
                  </div>

                  {/* Active Order Information */}
                  {order ? (
                    <>
                      <div
                        style={{
                          background: 'var(--card2)',
                          border: '1px solid var(--line)',
                          borderRadius: '10px',
                          padding: '10px',
                          marginBottom: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px',
                          }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--cream)' }}>
                            {order.orderNumber}{' '}
                            {order.customerNickname ? `• ${order.customerNickname}` : ''}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                            {order.elapsed}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--cream)',
                            marginBottom: '6px',
                            lineHeight: 1.35,
                          }}
                        >
                          🍽️ {order.itemSummary}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: 'var(--muted)',
                            borderTop: '1px dashed var(--line)',
                            paddingTop: '5px',
                            marginTop: '5px',
                          }}
                        >
                          <span>Total: ${(order.total || 0).toFixed(2)}</span>
                          <span
                            style={{
                              fontWeight: 800,
                              color: (order.totalDue || 0) <= 0 ? 'var(--success)' : 'var(--gold)',
                            }}
                          >
                            {(order.totalDue || 0) <= 0 ? 'PAID' : `Due: $${(order.totalDue || 0).toFixed(2)}`}
                          </span>
                        </div>
                      </div>

                      {/* Server Assignment Badge */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                          padding: '8px 10px',
                          background: 'var(--card2)',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--muted)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Server
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {order.serverName ? (
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                color: isAssignedToMe ? 'var(--success)' : 'var(--cream)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              👤 {order.serverName}
                              {isAssignedToMe && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    background: 'rgba(34,197,94,0.2)',
                                    border: '1px solid var(--success)',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    marginLeft: '2px',
                                  }}
                                >
                                  YOU
                                </span>
                              )}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b' }}>
                              ⚠️ Unassigned
                            </span>
                          )}

                          <button
                            className="btn"
                            onClick={() =>
                              onOpenReassignServer &&
                              onOpenReassignServer(
                                order.orderId,
                                tbl.label,
                                order.serverId,
                                order.serverName
                              )
                            }
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                          >
                            {order.serverName ? 'Reassign' : 'Assign'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Card Actions: View Ticket, Bill, and RESET TABLE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  {isOccupied ? (
                    <>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {order && (
                          <>
                            <button
                              className="btn btn-primary touch-target"
                              onClick={() => onSelectTab && onSelectTab('kds')}
                              style={{ flex: 1, padding: '7px', fontSize: '11px', justifyContent: 'center' }}
                            >
                              View Ticket
                            </button>
                            <button
                              className="btn touch-target"
                              onClick={() =>
                                onOpenCollectCash &&
                                onOpenCollectCash(
                                  order.orderId,
                                  order.total,
                                  order.total - order.totalDue,
                                  order.totalDue
                                )
                              }
                              style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 700 }}
                            >
                              💵 Bill
                            </button>
                          </>
                        )}
                      </div>

                      {/* Prominent Reset Table Button requested by User */}
                      <button
                        className="btn touch-target"
                        disabled={isResetting}
                        onClick={() => handleResetTable(tbl.id, order?.orderId)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          fontSize: '12px',
                          fontWeight: 800,
                          justifyContent: 'center',
                          background: 'rgba(16, 185, 129, 0.15)',
                          borderColor: 'var(--success)',
                          borderWidth: '1.5px',
                          borderStyle: 'solid',
                          borderRadius: '8px',
                          color: '#34d399',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          opacity: isResetting ? 0.6 : 1,
                        }}
                        title="Free up and reset table to Available after guests leave"
                      >
                        <RotateCcw style={{ width: '13px', height: '13px' }} />
                        <span>{isResetting ? 'Resetting Table...' : '🔄 Reset Table to Available'}</span>
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary touch-target"
                        onClick={() => onSelectTab && onSelectTab('kds')}
                        style={{
                          flex: 1,
                          padding: '8px',
                          fontSize: '12px',
                          justifyContent: 'center',
                          background: 'var(--card2)',
                          borderColor: 'var(--line)',
                          color: 'var(--cream)',
                        }}
                      >
                        + Start New Order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
