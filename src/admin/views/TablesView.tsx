import React, { useState } from 'react';
import { RefreshCw, PlusCircle, Edit2 } from 'lucide-react';

import { AdminTabId } from '../types';

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

const INITIAL_TABLES: FloorTable[] = [
  {
    id: 't1',
    tableNumber: '1',
    label: 'Table 1',
    capacity: 4,
    section: 'Main Lounge',
    status: 'new_order',
    activeOrder: {
      orderId: 'ord_108',
      orderNumber: '#108',
      total: 52.0,
      totalDue: 52.0,
      elapsed: '3m ago',
      serverName: 'Suwasna Gorkhali',
      serverId: 'u1',
      customerNickname: 'Aarav P.',
      itemSummary: '1x Love 66 Hookah, 2x Red Bull',
    },
  },
  {
    id: 't2',
    tableNumber: '2',
    label: 'Table 2',
    capacity: 2,
    section: 'Main Lounge',
    status: 'in_progress',
    activeOrder: {
      orderId: 'ord_105',
      orderNumber: '#105',
      total: 44.0,
      totalDue: 0.0,
      elapsed: '18m ago',
      serverName: 'Alex M.',
      serverId: 'u3',
      customerNickname: 'Sarah K.',
      itemSummary: '1x Blue Mist, 2x Turkish Coffee',
    },
  },
  {
    id: 't3',
    tableNumber: '3',
    label: 'Table 3',
    capacity: 4,
    section: 'Main Lounge',
    status: 'ready',
    activeOrder: {
      orderId: 'ord_102',
      orderNumber: '#102',
      total: 68.0,
      totalDue: 68.0,
      elapsed: '32m ago',
      serverName: undefined,
      customerNickname: 'David R.',
      itemSummary: '1x Double Apple, Flatbread, Mocktails',
    },
  },
  {
    id: 't4',
    tableNumber: 'P1',
    label: 'Patio P1',
    capacity: 6,
    section: 'Patio',
    status: 'available',
  },
  {
    id: 't5',
    tableNumber: 'P2',
    label: 'Patio P2',
    capacity: 4,
    section: 'Patio',
    status: 'available',
  },
  {
    id: 't6',
    tableNumber: 'VIP 1',
    label: 'VIP Booth 1',
    capacity: 8,
    section: 'VIP Booth',
    status: 'completed',
    activeOrder: {
      orderId: 'ord_99',
      orderNumber: '#99',
      total: 140.0,
      totalDue: 0.0,
      elapsed: 'Paid 5m ago',
      serverName: 'Suwasna Gorkhali',
      serverId: 'u1',
      customerNickname: 'VIP Party',
      itemSummary: 'Daku VIP Package, Bottle Service',
    },
  },
];

export const TablesView: React.FC<TablesViewProps> = ({
  onOpenAddTable,
  onOpenEditTable,
  onOpenCollectCash,
  onOpenReassignServer,
  onSelectTab,
  currentUserId = 'u1',
  currentUserName = 'Suwasna Gorkhali',
}) => {
  const [tables, setTables] = useState<FloorTable[]>(INITIAL_TABLES);
  const [filter, setFilter] = useState<'all' | 'active' | 'my' | 'available'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
        return <span className="table-pill table-pill-completed">✓ COMPLETED</span>;
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
            }}
          >
            <span style={{ color: 'var(--muted)' }}>Total:</span>{' '}
            <span id="statTotalTables" style={{ color: 'var(--cream)', fontWeight: 900, marginLeft: '4px' }}>
              {countTotal}
            </span>
          </div>
          <div
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1.5px solid rgba(245,158,11,0.4)',
              borderRadius: '10px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#f59e0b',
            }}
          >
            <span>New Orders:</span>{' '}
            <span id="statNewOrders" style={{ fontWeight: 900, marginLeft: '4px' }}>
              {countNewOrders}
            </span>
          </div>
          <div
            style={{
              background: 'rgba(59,130,246,0.12)',
              border: '1.5px solid rgba(59,130,246,0.4)',
              borderRadius: '10px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#3b82f6',
            }}
          >
            <span>In Progress:</span>{' '}
            <span id="statInProgress" style={{ fontWeight: 900, marginLeft: '4px' }}>
              {countInProgress}
            </span>
          </div>
          <div
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1.5px solid rgba(16,185,129,0.4)',
              borderRadius: '10px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#10b981',
            }}
          >
            <span>Ready:</span>{' '}
            <span id="statReady" style={{ fontWeight: 900, marginLeft: '4px' }}>
              {countReady}
            </span>
          </div>
          <div
            style={{
              background: 'var(--card2)',
              border: '1.5px solid var(--line)',
              borderRadius: '10px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--muted)',
            }}
          >
            <span>Available:</span>{' '}
            <span id="statAvailable" style={{ fontWeight: 900, color: 'var(--cream)', marginLeft: '4px' }}>
              {countAvailable}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Controls & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--card)',
          border: '1.5px solid var(--line)',
          borderRadius: '12px',
          padding: '10px 16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`sub-tab ${filter === 'all' ? 'active' : ''}`}
            id="tblFilterBtn-all"
            onClick={() => setFilter('all')}
          >
            All Tables (<span id="tblFilterCount-all">{countTotal}</span>)
          </button>
          <button
            className={`sub-tab ${filter === 'active' ? 'active' : ''}`}
            id="tblFilterBtn-active"
            onClick={() => setFilter('active')}
          >
            Active Orders (<span id="tblFilterCount-active">{countActive}</span>)
          </button>
          <button
            className={`sub-tab ${filter === 'my' ? 'active' : ''}`}
            id="tblFilterBtn-my"
            onClick={() => setFilter('my')}
          >
            My Assigned Tables (<span id="tblFilterCount-my">{countMy}</span>)
          </button>
          <button
            className={`sub-tab ${filter === 'available' ? 'active' : ''}`}
            id="tblFilterBtn-available"
            onClick={() => setFilter('available')}
          >
            Available (<span id="tblFilterCount-available">{countAvailable}</span>)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '380px' }}>
          <input
            type="text"
            id="tableSearchInput"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search table, customer, server..."
            style={{ width: '100%', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
          />
          <button
            className="btn"
            title="Force Refresh Table State"
            onClick={() => setTables([...INITIAL_TABLES])}
            style={{ padding: '8px 12px', fontSize: '13px' }}
          >
            <RefreshCw style={{ width: '14px', height: '14px' }} />
          </button>
          <button
            className="btn btn-primary"
            onClick={onOpenAddTable}
            style={{
              background: 'var(--gold)',
              borderColor: 'var(--gold)',
              color: '#000',
              fontWeight: 800,
              fontSize: '13px',
              padding: '8px 14px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <PlusCircle style={{ width: '14px', height: '14px' }} />
            <span>+ Add Table</span>
          </button>
        </div>
      </div>

      {/* Main Tables Grid */}
      <div className="tables-grid" id="tablesGridContainer">
        {filteredTables.map((tbl) => {
          const isPatio = tbl.label.toLowerCase().includes('patio') || String(tbl.tableNumber).startsWith('P');
          const isAvailable = tbl.status === 'available';
          const order = tbl.activeOrder;
          const isAssignedToMe =
            order?.serverId === currentUserId || order?.serverName === currentUserName;

          return (
            <div key={tbl.id} className={`table-card state-${tbl.status} ${!isAvailable ? 'has-order' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      color: isPatio ? '#38bdf8' : 'var(--gold)',
                    }}
                  >
                    {isPatio ? 'PATIO' : 'TABLE'}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: 'var(--cream)' }}>
                    {tbl.label}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    {tbl.section} • Capacity {tbl.capacity}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {renderStatusPill(tbl.status)}
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
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--line)',
                      color: 'var(--muted)',
                    }}
                    title="Edit Table Details"
                  >
                    <Edit2 style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              </div>

              {isAvailable ? (
                <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--cream)' }}>Available</div>
                  <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>
                    Table is clean and open for guests
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      marginBottom: '12px',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--cream)' }}>
                        👤 {order?.customerNickname || 'Guest'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                        🕒 {order?.elapsed}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cream)', marginBottom: '6px' }}>
                      🍽️ {order?.itemSummary}
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
                      <span>Total: ${(order?.total || 0).toFixed(2)}</span>
                      <span
                        style={{
                          fontWeight: 800,
                          color: (order?.totalDue || 0) <= 0 ? 'var(--success)' : 'var(--gold)',
                        }}
                      >
                        {(order?.totalDue || 0) <= 0 ? 'PAID' : `Due: $${(order?.totalDue || 0).toFixed(2)}`}
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
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Server
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {order?.serverName ? (
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
                            order?.orderId || '',
                            tbl.label,
                            order?.serverId,
                            order?.serverName
                          )
                        }
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                      >
                        {order?.serverName ? 'Reassign' : 'Assign'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                {order ? (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => onSelectTab && onSelectTab('kds')}
                      style={{ flex: 1, padding: '7px', fontSize: '11px', justifyContent: 'center' }}
                    >
                      View Ticket
                    </button>
                    <button
                      className="btn"
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
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => alert(`Starting new order for ${tbl.label}`)}
                    style={{
                      width: '100%',
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
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
