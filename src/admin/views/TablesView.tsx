import React, { useState } from 'react';
import { RefreshCw, PlusCircle } from 'lucide-react';

interface MockTable {
  id: string;
  name: string;
  capacity: number;
  section: string;
  status: 'available' | 'new_order' | 'in_progress' | 'ready' | 'completed';
  activeOrder?: {
    orderNumber: string;
    total: string;
    elapsed: string;
    server: string;
    itemSummary: string;
  };
}

const INITIAL_TABLES: MockTable[] = [
  {
    id: 't1',
    name: 'Table 1',
    capacity: 4,
    section: 'Main Lounge',
    status: 'new_order',
    activeOrder: {
      orderNumber: '#108',
      total: '$52.00',
      elapsed: '3m ago',
      server: 'Alex M.',
      itemSummary: '1x Love 66 Hookah, 2x Red Bull',
    },
  },
  {
    id: 't2',
    name: 'Table 2',
    capacity: 2,
    section: 'Main Lounge',
    status: 'in_progress',
    activeOrder: {
      orderNumber: '#105',
      total: '$44.00',
      elapsed: '18m ago',
      server: 'Sarah K.',
      itemSummary: '1x Blue Mist, 2x Turkish Coffee',
    },
  },
  {
    id: 't3',
    name: 'Table 3',
    capacity: 4,
    section: 'Main Lounge',
    status: 'ready',
    activeOrder: {
      orderNumber: '#102',
      total: '$68.00',
      elapsed: '32m ago',
      server: 'David R.',
      itemSummary: '1x Double Apple, Flatbread, Mocktails',
    },
  },
  {
    id: 't4',
    name: 'Table 4',
    capacity: 6,
    section: 'Patio',
    status: 'available',
  },
  {
    id: 't5',
    name: 'Table 5',
    capacity: 4,
    section: 'Patio',
    status: 'available',
  },
  {
    id: 't6',
    name: 'Table 6',
    capacity: 8,
    section: 'VIP Booth',
    status: 'completed',
    activeOrder: {
      orderNumber: '#99',
      total: '$140.00',
      elapsed: 'Paid 5m ago',
      server: 'Alex M.',
      itemSummary: 'Daku VIP Package, Bottle Service',
    },
  },
  {
    id: 't7',
    name: 'VIP 1',
    capacity: 10,
    section: 'VIP Lounge',
    status: 'in_progress',
    activeOrder: {
      orderNumber: '#107',
      total: '$80.00',
      elapsed: '15m ago',
      server: 'Alex M.',
      itemSummary: 'Daku VIP Hookah, Sparkling Water',
    },
  },
  {
    id: 't8',
    name: 'VIP 2',
    capacity: 10,
    section: 'VIP Lounge',
    status: 'available',
  },
];

export const TablesView: React.FC = () => {
  const [tables] = useState<MockTable[]>(INITIAL_TABLES);
  const [filter, setFilter] = useState<'all' | 'active' | 'my' | 'available'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTables = tables.filter((tbl) => {
    if (filter === 'active' && tbl.status === 'available') return false;
    if (filter === 'available' && tbl.status !== 'available') return false;
    if (filter === 'my' && tbl.activeOrder?.server !== 'Alex M.') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = tbl.name.toLowerCase().includes(q);
      const matchServer = tbl.activeOrder?.server.toLowerCase().includes(q);
      const matchOrder = tbl.activeOrder?.orderNumber.toLowerCase().includes(q);
      if (!matchName && !matchServer && !matchOrder) return false;
    }
    return true;
  });

  const countTotal = tables.length;
  const countNew = tables.filter((t) => t.status === 'new_order').length;
  const countInProgress = tables.filter((t) => t.status === 'in_progress').length;
  const countReady = tables.filter((t) => t.status === 'ready').length;
  const countAvailable = tables.filter((t) => t.status === 'available').length;
  const countActive = tables.filter((t) => t.status !== 'available').length;
  const countMy = tables.filter((t) => t.activeOrder?.server === 'Alex M.').length;

  const renderStatusPill = (status: MockTable['status']) => {
    switch (status) {
      case 'new_order':
        return <span className="table-pill table-pill-new_order">🔥 New Order</span>;
      case 'in_progress':
        return <span className="table-pill table-pill-in_progress">⏳ In Progress</span>;
      case 'ready':
        return <span className="table-pill table-pill-ready">✓ Ready</span>;
      case 'completed':
        return <span className="table-pill table-pill-completed">✓ Completed</span>;
      case 'available':
      default:
        return <span className="table-pill table-pill-available">○ Available</span>;
    }
  };

  return (
    <div id="tablesPageLayout" style={{ display: 'block', padding: '10px 0 60px 0' }}>
      {/* Top Floor Controls & Metrics Bar */}
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
              {countNew}
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
            onClick={() => setFilter('all')}
          >
            All Tables ({countTotal})
          </button>
          <button
            className={`sub-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active Orders ({countActive})
          </button>
          <button
            className={`sub-tab ${filter === 'my' ? 'active' : ''}`}
            onClick={() => setFilter('my')}
          >
            My Assigned Tables ({countMy})
          </button>
          <button
            className={`sub-tab ${filter === 'available' ? 'active' : ''}`}
            onClick={() => setFilter('available')}
          >
            Available ({countAvailable})
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
            style={{ padding: '8px 12px', fontSize: '13px' }}
          >
            <RefreshCw style={{ width: '14px', height: '14px' }} />
          </button>
          <button
            className="btn btn-primary"
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
        {filteredTables.map((tbl) => (
          <div key={tbl.id} className={`table-card state-${tbl.status}`}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cream)', margin: 0 }}>
                    {tbl.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    {tbl.section} &bull; Capacity {tbl.capacity}
                  </div>
                </div>
                {renderStatusPill(tbl.status)}
              </div>

              {tbl.activeOrder ? (
                <div
                  style={{
                    background: 'var(--card2)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    margin: '10px 0',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--gold)', marginBottom: '4px' }}>
                    <span>Order {tbl.activeOrder.orderNumber}</span>
                    <span>{tbl.activeOrder.total}</span>
                  </div>
                  <div style={{ color: 'var(--cream)', fontSize: '12px', marginBottom: '6px' }}>
                    {tbl.activeOrder.itemSummary}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
                    <span>Server: {tbl.activeOrder.server}</span>
                    <span>{tbl.activeOrder.elapsed}</span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '24px 0',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: '13px',
                    fontStyle: 'italic',
                  }}
                >
                  Table is ready for seating
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {tbl.activeOrder ? (
                <>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '7px', fontSize: '11px', justifyContent: 'center' }}>
                    View Ticket
                  </button>
                  <button className="btn" style={{ padding: '7px 10px', fontSize: '11px' }}>
                    Bill
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
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
        ))}
      </div>
    </div>
  );
};
