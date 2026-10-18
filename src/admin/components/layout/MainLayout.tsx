import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AdminTabId, RestaurantVenue, StaffUser } from '../../types';

interface MainLayoutProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  venue: RestaurantVenue;
  user: StaffUser;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  onSelectTab,
  venue,
  user,
  theme,
  onToggleTheme,
  children,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          venue={venue}
          user={user}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onToggleMobileMenu={() => setIsMobileOpen(true)}
        />

        <main
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
