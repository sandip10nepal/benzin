import React from 'react';
import {
  LayoutGrid,
  TableProperties,
  Package,
  BookOpen,
  BarChart3,
  Users,
} from 'lucide-react';
import { AdminTabId } from '../../types';

interface AdminNavigationProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
}

interface NavItem {
  id: AdminTabId;
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'kds', label: 'Live Tickets', icon: LayoutGrid },
  { id: 'tables', label: 'Restaurant Overview', icon: TableProperties },
  { id: 'inventory', label: 'Inventory Stock', icon: Package },
  { id: 'menu', label: 'Menu Catalog', icon: BookOpen },
  { id: 'sales', label: 'Sales & Tax Ledger', icon: BarChart3 },
  { id: 'staff', label: 'Staff & Payroll', icon: Users },
];

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <div className="nav-tabs" id="admin-mobile-navigation" aria-label="Admin navigation">
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            id={`navTab-${item.id}`}
            onClick={() => onSelectTab(item.id)}
            style={{
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              userSelect: 'none',
            }}
          >
            <IconComponent style={{ width: '15px', height: '15px' }} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
