import React, { useState } from 'react';
import { Header } from './Header';
import { MobileNavDrawer } from './MobileNavDrawer';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <Header
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        venue={venue}
        user={user}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        user={user}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main>
        {children}
      </main>
    </>
  );
};
