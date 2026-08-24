import React from 'react';
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

import { ConversationStep } from '../types';

function MainAppContent() {
  const { theme } = useRestaurantTheme();
  const [hostInitialStep, setHostInitialStep] = React.useState<ConversationStep>('welcome_category');

  const handleStartOrder = (step?: ConversationStep) => {
    setHostInitialStep(step || 'welcome_category');
    navigate('start_order');
  };

  const {
    currentScreen,
    navigate,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    cartTax,
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
    placeOrder,
    allCategories,
    allMenuItems,
    refreshLiveMenu,
    logOutSession,
  } = useBenzinState();

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
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onLogOut={logOutSession}
          cartCount={totalCartCount}
        />
      )}

      {currentScreen === 'menu' && (
        <MenuBrowsing
          onBack={() => navigate('home')}
          onSelectItem={(item) => setActiveItemForDetail(item)}
          onAddToCart={addToCart}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onCallServer={() => setIsCallServerModalOpen(true)}
          onOpenHost={handleStartOrder}
          onOpenMixLab={() => setIsMixLabOpen(true)}
          cartCount={totalCartCount}
          cartSubtotal={cartSubtotal}
          cartItems={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          allCategories={allCategories}
          allMenuItems={allMenuItems}
        />
      )}

      {currentScreen === 'start_order' && (
        <ConversationalHost
          initialStep={hostInitialStep}
          onBackToHome={() => navigate('home')}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onCallServer={() => setIsCallServerModalOpen(true)}
          onOpenMixLab={() => setIsMixLabOpen(true)}
          onSelectItem={(item) => setActiveItemForDetail(item)}
          cartCount={totalCartCount}
          cartSubtotal={cartSubtotal}
          cartItems={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onAddToCart={addToCart}
          onPlaceOrder={placeOrder}
          allCategories={allCategories}
          allMenuItems={allMenuItems}
        />
      )}

      {currentScreen === 'order_confirmation' && (
        <OrderConfirmation
          onReturnHome={() => navigate('home')}
          onOrderMore={() => navigate('menu')}
          onLogOut={logOutSession}
          cart={cart}
          total={cartTotal}
        />
      )}

      {/* Global Modals & Overlays */}
      <CartDrawer
        visible={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cart={cart}
        subtotal={cartSubtotal}
        tax={cartTax}
        total={cartTotal}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onPlaceOrder={() => {
          setIsCartDrawerOpen(false);
          placeOrder();
        }}
      />

      <ItemDetailModal
        item={activeItemForDetail}
        onClose={() => setActiveItemForDetail(null)}
        onAddToCart={(item, qty, mods, notes) => {
          addToCart(item, qty, mods, notes);
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
          addToCart(item, qty, mods, notes);
          setIsMixLabOpen(false);
        }}
      />
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
