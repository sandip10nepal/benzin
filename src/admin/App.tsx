import React, { useState, useEffect } from 'react';
import './styles/tokens.css';
import './styles/admin.css';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardView } from './views/DashboardView';
import { KdsPlaceholderView } from './views/KdsPlaceholderView';
import { TablesPlaceholderView } from './views/TablesPlaceholderView';
import { MenuPlaceholderView } from './views/MenuPlaceholderView';
import { InventoryPlaceholderView } from './views/InventoryPlaceholderView';
import { StaffPlaceholderView } from './views/StaffPlaceholderView';
import { SalesPlaceholderView } from './views/SalesPlaceholderView';
import { AdminTabId, RestaurantVenue, StaffUser } from './types';
import { MOCK_VENUE, MOCK_STAFF } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [venue] = useState<RestaurantVenue>(MOCK_VENUE);
  const [user] = useState<StaffUser>(MOCK_STAFF);

  // Sync theme attribute with document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView venue={venue} user={user} onNavigateTab={setActiveTab} />;
      case 'kds':
        return <KdsPlaceholderView />;
      case 'tables':
        return <TablesPlaceholderView />;
      case 'menu':
        return <MenuPlaceholderView />;
      case 'inventory':
        return <InventoryPlaceholderView />;
      case 'staff':
        return <StaffPlaceholderView />;
      case 'sales':
        return <SalesPlaceholderView />;
      default:
        return <DashboardView venue={venue} user={user} onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <MainLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      venue={venue}
      user={user}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {renderActiveView()}
    </MainLayout>
  );
};

export default App;
