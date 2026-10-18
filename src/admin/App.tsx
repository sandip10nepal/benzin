import React, { useState, useEffect } from 'react';
import './styles/legacy-admin.css';
import { AdminLayout } from './components/layout/AdminLayout';
import { KdsView } from './views/KdsView';
import { TablesView } from './views/TablesView';
import { ArchiveView } from './views/ArchiveView';
import { InventoryView } from './views/InventoryView';
import { MenuView } from './views/MenuView';
import { SalesView } from './views/SalesView';
import { StaffView } from './views/StaffView';
import { AdminTabId, RestaurantVenue, StaffUser } from './types';
import { MOCK_VENUE, MOCK_STAFF } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('kds');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('benzin_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });
  const [venue] = useState<RestaurantVenue>(MOCK_VENUE);
  const [user] = useState<StaffUser>(MOCK_STAFF);

  // Sync theme attribute with document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('benzin_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'kds':
        return <KdsView />;
      case 'tables':
        return <TablesView />;
      case 'archive':
        return <ArchiveView />;
      case 'inventory':
        return <InventoryView />;
      case 'menu':
        return <MenuView />;
      case 'sales':
        return <SalesView />;
      case 'staff':
        return <StaffView currentUser={user} />;
      default:
        return <KdsView />;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      venue={venue}
      user={user}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {renderActiveView()}
    </AdminLayout>
  );
};

export default App;
