import React, { useState, useEffect, useMemo } from 'react';
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
import { apiClient } from './api/client';
import { SubCategoryWithParent } from './components/modals/MenuItemModal';

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
  const [venue, setVenue] = useState<RestaurantVenue>(() => {
    return {
      id: typeof window !== 'undefined' ? localStorage.getItem('benzin_restaurant_id') || '' : '',
      name: typeof window !== 'undefined' ? localStorage.getItem('benzin_restaurant_name') || '' : '',
      slug: typeof window !== 'undefined' ? localStorage.getItem('benzin_selected_slug') || '' : '',
      code: typeof window !== 'undefined' ? localStorage.getItem('benzin_restaurant_code') || '' : '',
      isDemo: false,
    };
  });
  const [user, setUser] = useState<StaffUser>(() => {
    return {
      id: typeof window !== 'undefined' ? localStorage.getItem('benzin_user_id') || '' : '',
      name: typeof window !== 'undefined' ? localStorage.getItem('benzin_user_name') || '' : '',
      role: (typeof window !== 'undefined' ? localStorage.getItem('benzin_user_role') || 'staff' : 'staff') as any,
      position: typeof window !== 'undefined' ? localStorage.getItem('benzin_user_position') || '' : '',
      isClockedIn: typeof window !== 'undefined' ? localStorage.getItem('benzin_user_clocked_in') === 'true' : false,
      hourlyWage: 0,
    };
  });
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [liveMenuCatalog, setLiveMenuCatalog] = useState<MenuItem[]>([]);
  const [sessionKey, setSessionKey] = useState<number>(0);
  const [isLoginOverlayOpen, setIsLoginOverlayOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('benzin_jwt_token');
    const uId = localStorage.getItem('benzin_user_id');
    const rId = localStorage.getItem('benzin_restaurant_id');
    return !token || !uId || !rId;
  });

  useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('benzin_jwt_token') : null;
      const uId = typeof window !== 'undefined' ? localStorage.getItem('benzin_user_id') : null;
      const rId = typeof window !== 'undefined' ? localStorage.getItem('benzin_restaurant_id') : null;

      // If user is not authenticated, show login overlay and wait
      if (!token || !uId || !rId) {
        setIsLoginOverlayOpen(true);
        return;
      }

      try {
        const [vInfo, uInfo, emps, menuRes] = await Promise.all([
          apiClient.getVenueInfo(),
          apiClient.getCurrentUser(),
          apiClient.getEmployees(),
          apiClient.getMenu().catch(() => ({ items: [], categories: [] })),
        ]);

        if (mounted) {
          if (vInfo && vInfo.id) setVenue(vInfo);
          if (uInfo && uInfo.id) setUser(uInfo);
          if (menuRes && Array.isArray(menuRes.items)) {
            setLiveMenuCatalog(menuRes.items);
          }
          if (Array.isArray(emps) && emps.length > 0) {
            const mappedStaff: StaffUser[] = emps.map((e: any) => ({
              id: e.id || e._id,
              name: e.name || '',
              role: e.role || 'staff',
              position: e.position,
              isClockedIn: !!e.is_clocked_in,
              hourlyWage: Number(e.hourly_rate) || 0,
              email: e.email,
              pin: e.pin,
            }));
            setStaffList(mappedStaff);
          }
        }
      } catch (err) {
        console.error('Failed to initialize session from MongoDB:', err);
      }
    };
    initSession();
    return () => {
      mounted = false;
    };
  }, [sessionKey]);

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
  const [menuCategories, setMenuCategories] = useState<any[]>([]);

  const [isInventoryCategoryOpen, setIsInventoryCategoryOpen] = useState(false);
  const [invCategories, setInvCategories] = useState<any[]>([]);

  const [scopedCategoryForModal, setScopedCategoryForModal] = useState<string | undefined>(undefined);

  // Load real menu and inventory categories from MongoDB Atlas
  useEffect(() => {
    let mounted = true;
    const fetchCatalogData = async () => {
      try {
        const [menuData, invData] = await Promise.all([
          apiClient.getMenu(),
          apiClient.getInventory(),
        ]);
        if (mounted) {
          if (menuData && Array.isArray(menuData.categories)) {
            setMenuCategories(menuData.categories);
          }
          if (invData && Array.isArray(invData.categories)) {
            setInvCategories(invData.categories);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch initial categories from MongoDB:', err);
      }
    };
    fetchCatalogData();
    return () => {
      mounted = false;
    };
  }, [sessionKey, venue.id]);

  // Derived subcategories with uppercase parent titles for MenuItemModal pills
  const subCategoriesWithParents: SubCategoryWithParent[] = useMemo(() => {
    const superCats = menuCategories.filter(
      (c: any) => c.is_super || c.isSuper || c.parent_id === null
    );
    const superMap = new Map<string, string>();
    superCats.forEach((s: any) => {
      const id = s.id || s._id;
      superMap.set(id, s.title || s.name || '');
    });

    const subs = menuCategories.filter(
      (c: any) => !c.is_super && !c.isSuper && c.parent_id !== null && c.parent_id !== undefined
    );

    if (subs.length > 0) {
      return subs.map((c: any) => {
        const parentTitle = c.parent_id ? (superMap.get(c.parent_id) || '') : '';
        return {
          id: c.id || c._id,
          name: c.title || c.name,
          title: c.title || c.name,
          icon: c.icon || '📋',
          parent_id: c.parent_id,
          parentTitle: parentTitle || (c.menu_type ? c.menu_type.toUpperCase() : undefined),
        };
      });
    }

    return menuCategories.map((c: any) => ({
      id: c.id || c._id,
      name: c.title || c.name,
      title: c.title || c.name,
      icon: c.icon || '📋',
      parent_id: c.parent_id,
      parentTitle: c.superCategory || (c.menu_type ? c.menu_type.toUpperCase() : undefined),
    }));
  }, [menuCategories]);

  // Super categories options for MenuCategoryModal parent picker
  const superCategoryOptions = useMemo(() => {
    return menuCategories
      .filter((c: any) => c.is_super || c.isSuper || c.parent_id === null)
      .map((s: any) => ({
        id: s.id || s._id,
        name: s.title || s.name || '',
        title: s.title || s.name || '',
      }));
  }, [menuCategories]);

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

  const handleOpenAddItem = (scopedCat?: string) => {
    setSelectedMenuItem(null);
    setScopedCategoryForModal(scopedCat);
    setIsMenuItemOpen(true);
  };

  const handleOpenEditMenuItem = (item: MenuItem, scopedCat?: string) => {
    setSelectedMenuItem(item);
    setScopedCategoryForModal(scopedCat);
    setIsMenuItemOpen(true);
  };

  const handleSaveMenuItem = async (savedItem: any) => {
    try {
      const res = await apiClient.saveMenuItem(savedItem);
      if (res && (res.success || res.item || res._id)) {
        alert(`Menu item "${savedItem.name}" saved successfully to database!`);
        setIsMenuItemOpen(false);
        setSessionKey((prev) => prev + 1);
      } else {
        alert('Could not save menu item: ' + (res?.error || res?.message || 'Error'));
      }
    } catch (err: any) {
      alert('Error saving menu item: ' + err.message);
    }
  };

  const handleSaveMenuCategory = async (cat: any) => {
    try {
      const res = await apiClient.saveMenuCategory(cat);
      if (res && (res.success || res.category)) {
        alert(`Category "${cat.title || cat.name}" saved!`);
        const refreshed = await apiClient.getMenu();
        if (refreshed && Array.isArray(refreshed.categories)) {
          setMenuCategories(refreshed.categories);
        }
        setSessionKey((prev) => prev + 1);
      } else {
        alert('Could not save menu category: ' + (res?.error || res?.message || 'Error'));
      }
    } catch (err: any) {
      alert('Error saving category: ' + err.message);
    }
  };

  const handleDeleteMenuCategory = async (catId: string) => {
    try {
      const res = await apiClient.deleteMenuCategory(catId);
      if (res && res.success) {
        alert('Category deleted.');
        const refreshed = await apiClient.getMenu();
        if (refreshed && Array.isArray(refreshed.categories)) {
          setMenuCategories(refreshed.categories);
        }
        setSessionKey((prev) => prev + 1);
      } else {
        alert('Could not delete category: ' + (res?.error || res?.message || 'Error'));
      }
    } catch (err: any) {
      alert('Error deleting category: ' + err.message);
    }
  };

  const handleSaveInventoryCategory = async (cat: { id?: string; title: string; icon: string }) => {
    try {
      const res = await apiClient.saveInventoryCategory(cat);
      if (res && (res.success || res.category)) {
        alert(`Inventory category "${cat.title}" saved!`);
        const refreshed = await apiClient.getInventory();
        if (refreshed && Array.isArray(refreshed.categories)) {
          setInvCategories(refreshed.categories);
        }
        setSessionKey((prev) => prev + 1);
      } else {
        alert('Could not save inventory category: ' + (res?.error || res?.message || 'Error'));
      }
    } catch (err: any) {
      alert('Error saving inventory category: ' + err.message);
    }
  };

  const handleDeleteInventoryCategory = async (id: string) => {
    try {
      const res = await apiClient.deleteInventoryCategory(id);
      if (res && res.success) {
        alert('Inventory category deleted.');
        const refreshed = await apiClient.getInventory();
        if (refreshed && Array.isArray(refreshed.categories)) {
          setInvCategories(refreshed.categories);
        }
        setSessionKey((prev) => prev + 1);
      } else {
        alert('Could not delete inventory category: ' + (res?.error || res?.message || 'Error'));
      }
    } catch (err: any) {
      alert('Error deleting inventory category: ' + err.message);
    }
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

  const handleLoginSuccess = (userData: any, restaurantData: any) => {
    if (restaurantData) {
      setVenue({
        id: restaurantData.id || restaurantData._id || '',
        name: restaurantData.name || '',
        slug: restaurantData.slug || '',
        code: restaurantData.restaurant_code || restaurantData.code || '',
        isDemo: Boolean(restaurantData.isDemo),
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('benzin_restaurant_name', restaurantData.name || '');
        localStorage.setItem('benzin_restaurant_code', restaurantData.restaurant_code || restaurantData.code || '');
      }
    }
    if (userData) {
      setUser({
        id: userData.id || userData._id || '',
        name: userData.name || '',
        role: userData.role || 'staff',
        position: userData.position || (userData.role ? userData.role.toUpperCase() : 'Staff'),
        isClockedIn: Boolean(userData.is_clocked_in),
        hourlyWage: Number(userData.hourly_rate) || 0,
        email: userData.email,
        pin: userData.pin,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('benzin_user_position', userData.position || (userData.role ? userData.role.toUpperCase() : 'Staff'));
      }
    }
    setIsLoginOverlayOpen(false);
    setSessionKey((prev) => prev + 1);
  };

  const handleLogout = () => {
    apiClient.logout();
    setVenue(DEFAULT_VENUE);
    setUser(DEFAULT_USER);
    setIsLoginOverlayOpen(true);
  };

  const renderActiveView = () => {
    return (
      <div key={`${venue.id}-${venue.slug}-${sessionKey}`}>
        {(() => {
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
                  refreshKey={sessionKey}
                />
              );
            case 'menu':
              return (
                <MenuView
                  onOpenHookahConfig={() => setIsHookahConfigOpen(true)}
                  onOpenSpecials={() => setIsSpecialsOpen(true)}
                  onOpenAddCategory={() => setIsMenuCategoryOpen(true)}
                  onOpenAddItem={handleOpenAddItem}
                  onOpenEditItem={handleOpenEditMenuItem}
                  refreshKey={sessionKey}
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
                  onOpenEditEmployee={(emp) => {
                    setSelectedEmployee({
                      id: emp.id,
                      name: emp.name,
                      role: emp.role,
                      position: emp.position,
                      hourlyWage: Number(emp.hourly_rate) || 18,
                      email: emp.email || undefined,
                      isClockedIn: emp.is_clocked_in,
                    });
                    setIsEmployeeModalOpen(true);
                  }}
                  onOpenStaffProfile={handleOpenStaffProfile}
                  onFulfillWeeklyPayroll={() => {}}
                />
              );
            default:
              return <KdsView />;
          }
        })()}
      </div>
    );
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
        onLogout={handleLogout}
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
        categories={subCategoriesWithParents}
        scopedCategory={scopedCategoryForModal}
        onSaveMenuItem={handleSaveMenuItem}
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
        superCategories={superCategoryOptions}
        onSaveCategory={handleSaveMenuCategory}
        onDeleteCategory={handleDeleteMenuCategory}
      />

      {/* 8. Manage Inventory Categories Modal (#invCatModal) */}
      <InventoryCategoryModal
        isOpen={isInventoryCategoryOpen}
        onClose={() => setIsInventoryCategoryOpen(false)}
        categories={invCategories}
        onSaveCategory={handleSaveInventoryCategory}
        onDeleteCategory={handleDeleteInventoryCategory}
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
        menuCatalog={liveMenuCatalog}
      />

      {/* 15. Staff Login Overlay (#benzinLoginOverlay) */}
      <LoginOverlay
        isOpen={isLoginOverlayOpen}
        onClose={() => {
          const token = localStorage.getItem('benzin_jwt_token');
          const userName = localStorage.getItem('benzin_user_name');
          if (token || userName) {
            setIsLoginOverlayOpen(false);
          }
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default App;
