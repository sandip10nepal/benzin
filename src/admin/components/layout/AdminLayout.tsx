import React, { useState } from 'react';
import { AdminHeader } from './AdminHeader';
import { MobileNavigationDrawer } from './MobileNavigationDrawer';
import { AdminTabId, RestaurantVenue, StaffUser } from '../../types';

interface AdminLayoutProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  venue: RestaurantVenue;
  user: StaffUser;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
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
      <AdminHeader
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        venue={venue}
        user={user}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      <MobileNavigationDrawer
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
