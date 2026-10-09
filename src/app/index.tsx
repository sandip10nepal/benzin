import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { ThemeProvider, useRestaurantTheme } from '../theme/ThemeContext';
import { useBenzinState } from '../state/useBenzinState';
import { BenzinSplash } from '../screens/BenzinSplash';
import { RestaurantPairing } from '../screens/RestaurantPairing';
import { RestaurantHome } from '../screens/RestaurantHome';
import { MenuBrowsing } from '../screens/MenuBrowsing';
import { ConversationalHost } from '../screens/ConversationalHost';
import { OrderConfirmation } from '../screens/OrderConfirmation';
import { CartDrawer } from '../components/Cart/CartDrawer';
import { ItemDetailModal } from '../components/ItemDetail/ItemDetailModal';
import { CallServerModal } from '../components/Server/CallServerModal';
import { HookahMixLabModal } from '../components/HookahMixLab/HookahMixLabModal';
import { OrderNicknameModal } from '../components/Cart/OrderNicknameModal';
import { TrackOrderLookupModal } from '../components/Tracking/TrackOrderLookupModal';
import { CartFlyAnimation } from '../components/Cart/CartFlyAnimation';

import { ConversationStep } from '../types';

function MainAppContent() {
  const { theme } = useRestaurantTheme();
  const [hostInitialStep, setHostInitialStep] = React.useState<ConversationStep>('welcome_category');
  const [flyAnimationItem, setFlyAnimationItem] = useState<string | null>(null);

  const {
    currentScreen,
    navigate,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    cartTax,
    cartGratuity,
    cartTotal,
    totalCartCount,
    activeItemForDetail,
    setActiveItemForDetail,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    isCallServerModalOpen,
    setIsCallServerModalOpen,
    isMixLabOpen,
    setIsMixLabOpen,
    activeServerRequest,
    requestServer,
    cancelServerRequest,
    activeCoalRefill,
    isRequestingCoalRefill,
    requestCoalRefill,
    placeOrder,
    allCategories,
    allMenuItems,
    hookahConfig,
    pairedRestaurantId,
    pairedTableNumber,
    refreshLiveMenu,
    logOutSession,
    // Tracking System
    activeTrackingSession,
    isTrackLookupModalOpen,
    setIsTrackLookupModalOpen,
    isNicknameModalOpen,
    setIsNicknameModalOpen,
    handleOpenTrackOrder,
    refreshActiveTracking,
    saveTrackingSession,
  } = useBenzinState();

  const [orderNotes, setOrderNotes] = useState<string>('');

  const isDakuInCart = React.useMemo(() => {
    return (cart || []).some(ci =>
      ci.selectedModifiers?.some(m => m.id === 'PKG_DAKU' || (m.name || '').includes('Daku')) ||
      (ci.item.name || '').toLowerCase().includes('daku')
    );
  }, [cart]);

  const handleStartOrder = (step?: ConversationStep) => {
    setHostInitialStep(step || 'welcome_category');
    navigate('start_order');
  };

  const handleAddToCart = React.useCallback((item: any, qty: number, mods: any[], notes?: string) => {
    addToCart(item, qty, mods, notes);
    setFlyAnimationItem(item.name || 'Item');
  }, [addToCart]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.backgroundColor} />

      {/* Screen Router */}
      {currentScreen === 'splash' && (
        <BenzinSplash onContinue={() => navigate('pairing')} />
      )}

      {currentScreen === 'pairing' && (
        <RestaurantPairing onPairSuccess={() => navigate('home')} onRefreshMenu={refreshLiveMenu} />
      )}

      {currentScreen === 'home' && (
        <RestaurantHome
          onOpenMenu={() => navigate('menu')}
          onStartOrder={handleStartOrder}
          onCallServer={() => setIsCallServerModalOpen(true)}
          onOpenTrackOrder={handleOpenTrackOrder}
          isTrackingActive={!!activeTrackingSession}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onSelectItem={(item) => setActiveItemForDetail(item)}
          onAddToCart={handleAddToCart}
          onLogOut={logOutSession}
          cartCount={totalCartCount}
          allMenuItems={allMenuItems}
          activeCoalRefill={activeCoalRefill}
          isRequestingCoalRefill={isRequestingCoalRefill}
          onRequestCoalRefill={requestCoalRefill}
        />
      )}

      {currentScreen === 'menu' && (
        <MenuBrowsing
          onBack={() => navigate('home')}
          onSelectItem={(item) => setActiveItemForDetail(item)}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onCallServer={() => setIsCallServerModalOpen(true)}
          onOpenTrackOrder={handleOpenTrackOrder}
          isTrackingActive={!!activeTrackingSession}
          onOpenHost={handleStartOrder}
          onOpenMixLab={() => setIsMixLabOpen(true)}
          cartCount={totalCartCount}
          cartSubtotal={cartSubtotal}
          cartItems={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          allCategories={allCategories}
          allMenuItems={allMenuItems}
          hookahConfig={hookahConfig}
        />
      )}

      {currentScreen === 'start_order' && (
        <ConversationalHost
          initialStep={hostInitialStep}
          onBackToHome={() => navigate('home')}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onCallServer={() => setIsCallServerModalOpen(true)}
          onOpenTrackOrder={handleOpenTrackOrder}
          isTrackingActive={!!activeTrackingSession}
          onOpenMixLab={() => setIsMixLabOpen(true)}
          onSelectItem={(item) => setActiveItemForDetail(item)}
          cartCount={totalCartCount}
          cartSubtotal={cartSubtotal}
          cartGratuity={cartGratuity}
          cartTotal={cartTotal}
          cartItems={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onAddToCart={handleAddToCart}
          onPlaceOrder={() => setIsNicknameModalOpen(true)}
          allCategories={allCategories}
          allMenuItems={allMenuItems}
          restaurantId={pairedRestaurantId || 'RES_EED4E9D266DF'}
          tableNumber={pairedTableNumber || '1'}
        />
      )}

      {currentScreen === 'order_confirmation' && (
        <OrderConfirmation
          onReturnHome={() => navigate('home')}
          onOrderMore={() => navigate('menu')}
          onLogOut={logOutSession}
          cart={cart}
          subtotal={cartSubtotal}
          tax={cartTax}
          gratuity={cartGratuity}
          total={cartTotal}
          activeTrackingSession={activeTrackingSession}
          onRefreshTracking={refreshActiveTracking}
        />
      )}

      {/* Global Modals & Overlays */}
      <CartDrawer
        visible={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cart={cart}
        subtotal={cartSubtotal}
        tax={cartTax}
        gratuity={cartGratuity}
        total={cartTotal}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onSelectItem={(item) => setActiveItemForDetail(item)}
        onAddToCart={handleAddToCart}
        onPlaceOrder={(notes) => {
          if (notes) setOrderNotes(notes);
          setIsCartDrawerOpen(false);
          setIsNicknameModalOpen(true);
        }}
        activeTrackingSession={activeTrackingSession}
        onOpenTrackOrder={handleOpenTrackOrder}
        allMenuItems={allMenuItems}
        orderNotes={orderNotes}
        onOrderNotesChange={setOrderNotes}
      />

      {/* Customer Nickname Modal */}
      <OrderNicknameModal
        visible={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        onSubmit={(nickname) => {
          setIsNicknameModalOpen(false);
          placeOrder(nickname, orderNotes);
        }}
        tableNumber={theme.tableNumber || '1'}
      />

      {/* Track Order Lookup Modal (Case B) */}
      <TrackOrderLookupModal
        visible={isTrackLookupModalOpen}
        onClose={() => setIsTrackLookupModalOpen(false)}
        onSuccess={(session) => {
          saveTrackingSession(session);
          navigate('order_confirmation');
        }}
        defaultTable={theme.tableNumber || '1'}
      />

      <ItemDetailModal
        item={activeItemForDetail}
        onClose={() => setActiveItemForDetail(null)}
        onAddToCart={(item, qty, mods, notes) => {
          handleAddToCart(item, qty, mods, notes);
          setActiveItemForDetail(null);
        }}
      />

      <CallServerModal
        visible={isCallServerModalOpen}
        onClose={() => setIsCallServerModalOpen(false)}
        onRequestServer={requestServer}
        activeRequest={activeServerRequest}
        onCancelRequest={cancelServerRequest}
      />

      <HookahMixLabModal
        visible={isMixLabOpen}
        onClose={() => setIsMixLabOpen(false)}
        onAddMixToCart={(item, qty, mods, notes) => {
          handleAddToCart(item, qty, mods, notes);
          setIsMixLabOpen(false);
        }}
        hookahConfig={hookahConfig}
        allMenuItems={allMenuItems}
        isDakuInCart={isDakuInCart}
      />

      {flyAnimationItem && (
        <CartFlyAnimation
          itemName={flyAnimationItem}
          onComplete={() => setFlyAnimationItem(null)}
        />
      )}

    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
