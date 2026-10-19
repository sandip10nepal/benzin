import React, { useState, useEffect } from 'react';
import './styles/legacy-admin.css';
import { AdminLayout } from './components/layout/AdminLayout';
import { KdsView } from './views/KdsView';
import { TablesView } from './views/TablesView';
import { ArchiveView } from './views/ArchiveView';
import { InventoryView, InventoryItem } from './views/InventoryView';
import { MenuView } from './views/MenuView';
import { SalesView } from './views/SalesView';
import { StaffView } from './views/StaffView';
import { AdminTabId, RestaurantVenue, StaffUser, MenuItem } from './types';
import { MOCK_VENUE, MOCK_STAFF } from './api/client';

import {
  StaffSwitchModal,
  MenuItemModal,
  AddInventoryModal,
  EditInventoryModal,
  CollectCashModal,
  StaffProfileModal,
  MenuCategoryModal,
  InventoryCategoryModal,
  EmployeeModal,
  ReassignTableModal,
  AddTableModal,
  EditTableModal,
  HookahConfigModal,
  SpecialsModal,
  LoginOverlay,
} from './components/modals';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('kds');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('benzin_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });
  const [venue] = useState<RestaurantVenue>(MOCK_VENUE);
  const [user, setUser] = useState<StaffUser>(MOCK_STAFF);

  // Staff members list for reassign, switcher, login, profile
  const [staffList, setStaffList] = useState<StaffUser[]>([
    MOCK_STAFF,
    { id: 'u2', name: 'Farhan Cavalli', role: 'owner', isClockedIn: true, hourlyWage: 35, email: 'owner@cavalli.com', pin: '2448' },
    { id: 'u3', name: 'Alex Morales', role: 'manager', isClockedIn: true, hourlyWage: 22, email: 'alex@cavalli.com', pin: '1111' },
    { id: 'u4', name: 'Sarah Khan', role: 'server', isClockedIn: true, hourlyWage: 16.5, pin: '2222' },
    { id: 'u5', name: 'David Ramirez', role: 'server', isClockedIn: false, hourlyWage: 15, pin: '3333' },
    { id: 'u6', name: 'Tariq Al-Mansoor', role: 'hookah_maker', isClockedIn: false, hourlyWage: 18, pin: '4444' },
  ]);

  // Modals visibility states
  const [isStaffSwitchOpen, setIsStaffSwitchOpen] = useState(false);
  const [isMenuItemOpen, setIsMenuItemOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [isEditInventoryOpen, setIsEditInventoryOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);

  const [isCollectCashOpen, setIsCollectCashOpen] = useState(false);
  const [collectCashData, setCollectCashData] = useState<{
    orderId: string;
    grandTotal: number;
    totalPaid: number;
    totalDue: number;
  }>({ orderId: '', grandTotal: 0, totalPaid: 0, totalDue: 0 });

  const [isStaffProfileOpen, setIsStaffProfileOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<StaffUser | null>(user);

  const [isMenuCategoryOpen, setIsMenuCategoryOpen] = useState(false);
  const [menuCategories, setMenuCategories] = useState<Array<{
    id: string;
    title: string;
    subtitle?: string;
    icon?: string;
    color?: string;
    superCategory?: string;
    isSuper?: boolean;
  }>>([
    { id: 'c1', title: 'Signature Mixes', subtitle: 'Artisan House Blends', icon: '👑', color: '#FF5A1F', superCategory: 'Hookah' },
    { id: 'c2', title: 'Classic Flavors', subtitle: 'Timeless favorites', icon: '💨', color: '#38BDF8', superCategory: 'Hookah' },
    { id: 'c3', title: 'Warm Appetizers', subtitle: 'Freshly baked bites', icon: '🫓', color: '#F59E0B', superCategory: 'Food' },
    { id: 'c4', title: 'Hot Beverages', subtitle: 'Turkish coffee & teas', icon: '☕', color: '#10B981', superCategory: 'Drinks' },
    { id: 'c5', title: 'Hookah', isSuper: true, icon: '💨' },
    { id: 'c6', title: 'Food', isSuper: true, icon: '🍔' },
    { id: 'c7', title: 'Drinks', isSuper: true, icon: '🍸' },
  ]);

  const [isInventoryCategoryOpen, setIsInventoryCategoryOpen] = useState(false);
  const [invCategories, setInvCategories] = useState([
    { id: 'ic1', title: 'Hookah Tobacco', icon: '💨' },
    { id: 'ic2', title: 'Coals & Heads', icon: '🔥' },
    { id: 'ic3', title: 'Beverages & Syrups', icon: '🥤' },
    { id: 'ic4', title: 'Kitchen Materials', icon: '🍔' },
  ]);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<StaffUser | null>(null);

  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignData, setReassignData] = useState<{
    orderId: string;
    tableLabel: string;
    currentServerId?: string;
    currentServerName?: string;
  }>({ orderId: '', tableLabel: '' });

  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<{
    id: string;
    tableNumber: string | number;
    label: string;
    capacity: number;
  } | null>(null);

  const [isHookahConfigOpen, setIsHookahConfigOpen] = useState(false);
  const [isSpecialsOpen, setIsSpecialsOpen] = useState(false);
  const [isLoginOverlayOpen, setIsLoginOverlayOpen] = useState(false);

  // Sync theme attribute with document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('benzin_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Handlers for Opening Modals
  const handleOpenCollectCash = (
    orderId: string,
    grandTotal: number,
    totalPaid: number,
    totalDue: number
  ) => {
    setCollectCashData({ orderId, grandTotal, totalPaid, totalDue });
    setIsCollectCashOpen(true);
  };

  const handleOpenReassignServer = (
    orderId: string,
    tableLabel: string,
    currentServerId?: string,
    currentServerName?: string
  ) => {
    setReassignData({ orderId, tableLabel, currentServerId, currentServerName });
    setIsReassignOpen(true);
  };

  const handleOpenEditTable = (table: {
    id: string;
    tableNumber: string | number;
    label: string;
    capacity: number;
  }) => {
    setSelectedTable(table);
    setIsEditTableOpen(true);
  };

  const handleOpenEditMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsMenuItemOpen(true);
  };

  const handleOpenEditInventory = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setIsEditInventoryOpen(true);
  };

  const handleOpenStaffProfile = (emp: StaffUser) => {
    setSelectedProfileUser(emp);
    setIsStaffProfileOpen(true);
  };

  const handleSwitchAccountPin = (pin: string) => {
    const found = staffList.find((s) => s.pin === pin);
    if (found) {
      setUser(found);
      alert(`✓ Switched session to ${found.name} (${found.role.toUpperCase()})`);
      setIsStaffSwitchOpen(false);
    } else {
      alert('Invalid 4-digit staff PIN. Please check and try again.');
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'kds':
        return (
          <KdsView
            onOpenCollectCash={handleOpenCollectCash}
            onOpenReassignServer={handleOpenReassignServer}
            currentUserRole={user.role}
            currentUserId={user.id}
            currentUserName={user.name}
          />
        );
      case 'tables':
        return (
          <TablesView
            onOpenAddTable={() => setIsAddTableOpen(true)}
            onOpenEditTable={handleOpenEditTable}
            onOpenCollectCash={handleOpenCollectCash}
            onOpenReassignServer={handleOpenReassignServer}
            onSelectTab={setActiveTab}
            currentUserId={user.id}
            currentUserName={user.name}
          />
        );
      case 'archive':
        return <ArchiveView />;
      case 'inventory':
        return (
          <InventoryView
            onOpenAddCategory={() => setIsInventoryCategoryOpen(true)}
            onOpenAddItem={() => setIsAddInventoryOpen(true)}
            onOpenEditItem={handleOpenEditInventory}
          />
        );
      case 'menu':
        return (
          <MenuView
            onOpenHookahConfig={() => setIsHookahConfigOpen(true)}
            onOpenSpecials={() => setIsSpecialsOpen(true)}
            onOpenAddCategory={() => setIsMenuCategoryOpen(true)}
            onOpenAddItem={() => {
              setSelectedMenuItem(null);
              setIsMenuItemOpen(true);
            }}
            onOpenEditItem={handleOpenEditMenuItem}
          />
        );
      case 'sales':
        return <SalesView />;
      case 'staff':
        return (
          <StaffView
            currentUser={user}
            onOpenAddEmployee={() => {
              setSelectedEmployee(null);
              setIsEmployeeModalOpen(true);
            }}
            onOpenStaffProfile={handleOpenStaffProfile}
            onFulfillWeeklyPayroll={() => alert('Fulfillment processed!')}
          />
        );
      default:
        return <KdsView />;
    }
  };

  return (
    <>
      {/* Background Subsystems: Receipt Printing & Audio Chime */}
      <div id="print-area" />
      <audio
        id="orderChime"
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav"
        preload="auto"
      />

      <AdminLayout
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        venue={venue}
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onProfileClick={() => handleOpenStaffProfile(user)}
        onSwitchAccountClick={() => setIsStaffSwitchOpen(true)}
        onLogout={() => setIsLoginOverlayOpen(true)}
      >
        {renderActiveView()}
      </AdminLayout>

      {/* ════════════════ ALL 14 MODALS & LOGIN OVERLAY ════════════════ */}

      {/* 1. Staff Switch Modal (#staffSwitchModal) */}
      <StaffSwitchModal
        isOpen={isStaffSwitchOpen}
        onClose={() => setIsStaffSwitchOpen(false)}
        onSwitchAccount={handleSwitchAccountPin}
      />

      {/* 2. Add / Edit Menu Item Modal (#menuItemModal) */}
      <MenuItemModal
        isOpen={isMenuItemOpen}
        onClose={() => setIsMenuItemOpen(false)}
        item={selectedMenuItem}
        categories={[
          { id: 'c1', name: 'Signature Mixes' },
          { id: 'c2', name: 'Classic Flavors' },
          { id: 'c3', name: 'Exotic Flavors' },
          { id: 'c4', name: 'Warm Appetizers' },
          { id: 'c5', name: 'Hot Beverages' },
          { id: 'c6', name: 'Mocktails & Sodas' },
        ]}
        onSaveMenuItem={(saved) => {
          alert(`Menu item "${saved.name}" saved!`);
        }}
      />

      {/* 3. Add Inventory Item Modal (#addInventoryModal) */}
      <AddInventoryModal
        isOpen={isAddInventoryOpen}
        onClose={() => setIsAddInventoryOpen(false)}
        onSaveNewItem={(item) => {
          alert(`Inventory item "${item.name}" added to stock!`);
        }}
      />

      {/* 4. Edit Inventory Item Modal (#editInventoryModal) */}
      <EditInventoryModal
        isOpen={isEditInventoryOpen}
        onClose={() => setIsEditInventoryOpen(false)}
        item={selectedInventoryItem}
        onSaveEditItem={(item) => {
          alert(`Stock for "${item.name}" updated to ${item.stock} ${item.unit}!`);
        }}
        onDeleteItem={(id) => {
          alert(`Inventory item #${id} deleted from stock!`);
        }}
      />

      {/* 5. Collect Cash Modal (#collectCashModal) */}
      <CollectCashModal
        isOpen={isCollectCashOpen}
        onClose={() => setIsCollectCashOpen(false)}
        orderId={collectCashData.orderId}
        grandTotal={collectCashData.grandTotal}
        totalPaid={collectCashData.totalPaid}
        totalDue={collectCashData.totalDue}
        onSubmitPayment={(orderId, tendered) => {
          alert(`Cash payment of $${tendered.toFixed(2)} recorded for Order #${orderId}!`);
        }}
      />

      {/* 6. Comprehensive Staff Profile & Timecard Modal (#staffProfileModal) */}
      <StaffProfileModal
        isOpen={isStaffProfileOpen}
        onClose={() => setIsStaffProfileOpen(false)}
        employee={selectedProfileUser}
        onFulfillPayrollShift={(shiftId) => {
          alert(`Shift #${shiftId} marked as fulfilled!`);
        }}
      />

      {/* 7. Manage Menu Categories Modal (#menuCatModal) */}
      <MenuCategoryModal
        isOpen={isMenuCategoryOpen}
        onClose={() => setIsMenuCategoryOpen(false)}
        categories={menuCategories}
        superCategories={['Hookah', 'Food', 'Drinks']}
        onSaveCategory={(cat) => {
          setMenuCategories((prev) => [...prev, cat]);
          alert(`Category "${cat.title}" saved!`);
        }}
        onDeleteCategory={(catId) => {
          setMenuCategories((prev) => prev.filter((c) => c.id !== catId));
        }}
      />

      {/* 8. Manage Inventory Categories Modal (#invCatModal) */}
      <InventoryCategoryModal
        isOpen={isInventoryCategoryOpen}
        onClose={() => setIsInventoryCategoryOpen(false)}
        categories={invCategories}
        onSaveCategory={(cat) => {
          setInvCategories((prev) => [
            ...prev,
            { id: cat.id || `ic_${Date.now()}`, title: cat.title, icon: cat.icon },
          ]);
          alert(`Inventory category "${cat.title}" saved!`);
        }}
        onDeleteCategory={(id) => {
          setInvCategories((prev) => prev.filter((c) => c.id !== id));
        }}
      />

      {/* 9. Add / Edit Staff Modal (#empModal) */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        employee={selectedEmployee}
        onSaveEmployee={(emp) => {
          if (emp.id) {
            setStaffList((prev) =>
              prev.map((s) => (s.id === emp.id ? { ...s, ...emp } as StaffUser : s))
            );
          } else {
            setStaffList((prev) => [
              ...prev,
              {
                id: `u_${Date.now()}`,
                name: emp.name,
                role: emp.role,
                isClockedIn: false,
                hourlyWage: emp.hourlyWage,
                email: emp.email,
                pin: emp.pin,
              } as StaffUser,
            ]);
          }
          alert(`Employee "${emp.name}" saved!`);
        }}
      />

      {/* 10. Reassign Server Modal (#reassignTableModal) */}
      <ReassignTableModal
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
        orderId={reassignData.orderId}
        tableLabel={reassignData.tableLabel}
        currentServerId={reassignData.currentServerId}
        currentServerName={reassignData.currentServerName}
        staffList={staffList}
        onConfirmReassignment={(orderId, _newId, newName) => {
          alert(`Order #${orderId} successfully reassigned to ${newName}!`);
        }}
      />

      {/* 11. Add Floor Table Modal (#addTableModal) */}
      <AddTableModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        onSubmitAddTable={(_number, label, capacity, section) => {
          alert(`Floor table "${label}" (${section}, Capacity: ${capacity}) created successfully!`);
        }}
      />

      {/* 12. Edit Floor Table Modal (#editTableModal) */}
      <EditTableModal
        isOpen={isEditTableOpen}
        onClose={() => setIsEditTableOpen(false)}
        table={selectedTable}
        onSubmitEditTable={(_id, _number, label, capacity, section) => {
          alert(`Table "${label}" (${section}, Capacity: ${capacity}) updated!`);
        }}
        onDeleteTable={(id) => {
          alert(`Table #${id} deleted!`);
        }}
      />

      {/* 13. Hookah Configuration Modal (#hookahConfigModal) */}
      <HookahConfigModal
        isOpen={isHookahConfigOpen}
        onClose={() => setIsHookahConfigOpen(false)}
        onSaveConfig={(cfg) => {
          console.log('Hookah config saved:', cfg);
        }}
      />

      {/* 14. Restaurant Specials Modal (#specialsModal) */}
      <SpecialsModal
        isOpen={isSpecialsOpen}
        onClose={() => setIsSpecialsOpen(false)}
        menuCatalog={[
          { id: 'm1', name: 'Anarkali House Blend', price: 36.0, emoji: '👑', category: 'Hookah' },
          { id: 'm2', name: 'Blue Mist Premium', price: 34.0, emoji: '🫐', category: 'Hookah' },
          { id: 'm3', name: 'Love 66', price: 34.0, emoji: '❤️', category: 'Hookah' },
          { id: 'm4', name: 'Zaatar Truffle Flatbread', price: 14.5, emoji: '🍕', category: 'Food' },
          { id: 'm5', name: 'Authentic Turkish Coffee', price: 5.5, emoji: '☕', category: 'Drinks' },
        ]}
      />

      {/* 15. Staff Login Overlay (#benzinLoginOverlay) */}
      <LoginOverlay
        isOpen={isLoginOverlayOpen}
        onClose={() => setIsLoginOverlayOpen(false)}
        staffList={staffList}
        onStaffLogin={(st) => {
          setUser(st);
          setIsLoginOverlayOpen(false);
          alert(`Logged in as ${st.name}`);
        }}
        onManagerLogin={(email) => {
          alert(`Logged in as Manager (${email})`);
          setIsLoginOverlayOpen(false);
        }}
      />
    </>
  );
};

export default App;
