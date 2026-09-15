import { ArrowRight, Bell, Bot, Check, Flame, Plus } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BenzinHeader } from '../components/Navigation/BenzinHeader';
import { TouchCard } from '../components/ui/TouchCard';
import { getItemImageSource } from '../data/menu_images';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useRestaurantTheme } from '../theme/ThemeContext';
import { ConversationStep, MenuItem, SelectedModifier } from '../types';

interface RestaurantHomeProps {
  onOpenMenu: () => void;
  onStartOrder: (initialStep?: ConversationStep) => void;
  onCallServer: () => void;
  onOpenCart: () => void;
  onSelectItem?: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem, qty: number, modifiers: SelectedModifier[]) => void;
  allMenuItems?: MenuItem[];
  onLogOut?: () => void;
  cartCount: number;
  activeCoalRefill?: any | null;
  isRequestingCoalRefill?: boolean;
  onRequestCoalRefill?: (customNote?: string) => Promise<any>;
}

export const RestaurantHome: React.FC<RestaurantHomeProps> = ({
  onOpenMenu,
  onStartOrder,
  onCallServer,
  onOpenCart,
  onSelectItem,
  onAddToCart,
  allMenuItems = [],
  onLogOut,
  cartCount,
  activeCoalRefill,
  isRequestingCoalRefill = false,
  onRequestCoalRefill,
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();

  // Featured menu items showcase on home screen
  const featuredItems = useMemo(() => {
    if (!allMenuItems || allMenuItems.length === 0) return [];
    return allMenuItems;
  }, [allMenuItems]);

  const isMobile = layout.isMobilePhone;

  const isCoalRefillActive = Boolean(
    activeCoalRefill &&
    (activeCoalRefill.status === 'PENDING' ||
     activeCoalRefill.status === 'IN_PROGRESS' ||
     activeCoalRefill.status === 'pending' ||
     activeCoalRefill.status === 'in_progress')
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Persistent Top Header */}
      <BenzinHeader
        onOpenCart={onOpenCart}
        onOpenCallServer={onCallServer}
        onOpenHost={onStartOrder}
        onLogOut={onLogOut}
        hostSpeechText={`Welcome to ${theme.name || 'CAVALLI'}!`}
        cartCount={cartCount}
      />

      {/* Main Touch Action Cards Container */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.contentPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cardsContainer, { maxWidth: layout.isTablet ? 840 : layout.isDesktop ? 1040 : '100%' }]}>

          {/* Welcome Greeting Header */}
          <View style={styles.welcomeBanner}>
            <Text style={[styles.welcomeSubtitle, { color: theme.secondaryColor, fontSize: isMobile ? 12 : 14 }]}>WELCOME TO</Text>
            <Text style={[styles.welcomeTitle, { color: theme.textColor, fontSize: isMobile ? 32 : 42 }]}>{theme.name || 'LOUNGE'}</Text>
          </View>

          {/* Prominent Action Cards Container */}
          <View style={styles.topCardsSection}>
            {/* Top Row: START ORDER & COAL REFILL */}
            <View style={[styles.topCardsRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
              {/* 1. START ORDER (AI HOST CARD) */}
              <View style={[styles.topCardWrapper, isMobile && { height: 'auto', width: '100%' }]}>
                <TouchCard
                  onPress={() => onStartOrder()}
                  style={[
                    styles.actionCard,
                    styles.largeActionCard,
                    { backgroundColor: theme.cardColor, borderColor: theme.primaryColor, borderWidth: 2.5 },
                    isMobile ? { padding: 14 } : {}
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardIconBg, styles.largeIconBg, { backgroundColor: 'rgba(74,46,27,0.25)' }, isMobile && { width: 42, height: 42 }]}>
                      <Bot size={isMobile ? 24 : 36} color="#A06D44" />
                    </View>
                    <View style={[styles.badgeTag, { backgroundColor: '#4A2E1B' }]}>
                      <Text style={[styles.badgeTagText, { color: '#F3E5AB' }]}>AI HOST</Text>
                    </View>
                  </View>

                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, styles.largeCardTitle, { color: theme.textColor }, isMobile && { fontSize: 18 }]}>START ORDER</Text>
                    <Text style={[styles.cardSubtitle, styles.largeCardSubtitle, { color: theme.mutedTextColor }, isMobile && { fontSize: 11 }]}>Guided Ordering Experience</Text>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={[styles.cardActionText, styles.largeCardActionText, { color: theme.primaryColor }, isMobile && { fontSize: 11 }]}>LAUNCH ORDER</Text>
                    <ArrowRight size={isMobile ? 16 : 20} color={theme.primaryColor} />
                  </View>
                </TouchCard>
              </View>

              {/* 2. COAL REFILL (REPLACES VIEW MENU) */}
              <View style={[styles.topCardWrapper, isMobile && { height: 'auto', width: '100%' }]}>
                <TouchCard
                  onPress={() => {
                    if (!isCoalRefillActive && onRequestCoalRefill) {
                      onRequestCoalRefill();
                    }
                  }}
                  disabled={isCoalRefillActive || isRequestingCoalRefill}
                  style={[
                    styles.actionCard,
                    styles.largeActionCard,
                    {
                      backgroundColor: isCoalRefillActive ? 'rgba(255, 107, 53, 0.08)' : theme.cardColor,
                      borderColor: isCoalRefillActive ? '#10B981' : '#FF6B35',
                      borderWidth: 2.5,
                      opacity: isRequestingCoalRefill ? 0.7 : 1,
                    },
                    isMobile ? { padding: 14 } : {}
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardIconBg, styles.largeIconBg, { backgroundColor: isCoalRefillActive ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 107, 53, 0.18)' }, isMobile && { width: 42, height: 42 }]}>
                      {isCoalRefillActive ? (
                        <Check size={isMobile ? 24 : 36} color="#10B981" />
                      ) : (
                        <Flame size={isMobile ? 24 : 36} color="#FF6B35" />
                      )}
                    </View>
                    <View style={[styles.badgeTag, { backgroundColor: isCoalRefillActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 107, 53, 0.15)' }]}>
                      <Text style={[styles.badgeTagText, { color: isCoalRefillActive ? '#10B981' : '#FF6B35' }]}>HOOKAH STATION</Text>
                    </View>
                  </View>

                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, styles.largeCardTitle, { color: theme.textColor }, isMobile && { fontSize: 18 }]}>Coal Refill</Text>
                    <Text style={[styles.cardSubtitle, styles.largeCardSubtitle, { color: theme.mutedTextColor }, isMobile && { fontSize: 11 }]}>
                      {isCoalRefillActive 
                        ? (activeCoalRefill?.status === 'IN_PROGRESS' || activeCoalRefill?.status === 'in_progress' ? 'Coals are being brought to your table 🔥' : 'Refill requested — master notified')
                        : 'Request fresh coals for your hookah'}
                    </Text>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={[styles.cardActionText, styles.largeCardActionText, { color: isCoalRefillActive ? '#10B981' : '#FF6B35' }, isMobile && { fontSize: 11 }]}>
                      {isRequestingCoalRefill ? 'REQUESTING...' : isCoalRefillActive ? 'Coal refill requested ✓' : 'Request Coal Refill'}
                    </Text>
                    {isCoalRefillActive ? (
                      <Check size={isMobile ? 16 : 20} color="#10B981" />
                    ) : (
                      <ArrowRight size={isMobile ? 16 : 20} color="#FF6B35" />
                    )}
                  </View>
                </TouchCard>
              </View>
            </View>

            {/* Bottom Row: CALL SERVER */}
            <View style={[styles.bottomCardWrapper, isMobile && { width: '100%', height: 'auto', marginTop: 12 }]}>
              <TouchCard
                onPress={onCallServer}
                style={[
                  styles.actionCard,
                  styles.largeActionCard,
                  { backgroundColor: theme.cardColor, borderColor: theme.accentColor, borderWidth: 2.5 },
                  isMobile ? { padding: 14 } : {}
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconBg, styles.largeIconBg, { backgroundColor: 'rgba(20,184,166,0.18)' }, isMobile && { width: 42, height: 42 }]}>
                    <Bell size={isMobile ? 24 : 36} color={theme.accentColor} />
                  </View>
                  <View style={[styles.badgeTag, { backgroundColor: 'rgba(20,184,166,0.15)' }]}>
                    <Text style={[styles.badgeTagText, { color: theme.accentColor }]}>STAFF</Text>
                  </View>
                </View>

                <View style={styles.cardTextContent}>
                  <Text style={[styles.cardTitle, styles.largeCardTitle, { color: theme.textColor }, isMobile && { fontSize: 18 }]}>CALL SERVER</Text>
                  <Text style={[styles.cardSubtitle, styles.largeCardSubtitle, { color: theme.mutedTextColor }, isMobile && { fontSize: 11 }]}>Request Staff Assistance & Service</Text>
                </View>

                <View style={styles.cardFooterRow}>
                  <Text style={[styles.cardActionText, styles.largeCardActionText, { color: theme.accentColor }, isMobile && { fontSize: 11 }]}>REQUEST STAFF</Text>
                  <ArrowRight size={isMobile ? 16 : 20} color={theme.accentColor} />
                </View>
              </TouchCard>
            </View>
          </View>

          {/* FEATURED MENU ITEMS PRESENTATION */}
          {featuredItems.length > 0 && (
            <View style={styles.featuredSection}>
              <View style={styles.featuredHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                  <Text style={[styles.featuredSectionTitle, { color: theme.textColor, fontSize: isMobile ? 13 : 16 }]} numberOfLines={1}>
                    FEATURED MENU & DISHES
                  </Text>
                </View>
                <TouchableOpacity onPress={onOpenMenu} activeOpacity={0.8} style={styles.seeAllBtn}>
                  <Text style={[styles.seeAllText, { color: theme.secondaryColor, fontSize: isMobile ? 11 : 12 }]}>SEE ALL →</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredScrollContainer}
              >
                {featuredItems.map((item, idx) => {
                  const imageSource = getItemImageSource(item);
                  const cardWidth = isMobile ? 170 : 230;

                  return (
                    <TouchableOpacity
                      key={item.id || `home_feat_${idx}`}
                      activeOpacity={0.88}
                      onPress={() => onSelectItem ? onSelectItem(item) : onOpenMenu()}
                      style={[styles.homeMenuCard, { backgroundColor: theme.cardColor, borderColor: theme.borderColor, width: cardWidth }]}
                    >
                      <View style={[styles.homeCardImageWrapper, { height: isMobile ? 130 : 185 }]}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.homeCardImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.homeCardPlaceholder}>
                            <Text style={{ fontSize: isMobile ? 28 : 38 }}>
                              {item.category === 'hookah' ? '💨' : item.category === 'drinks' ? '🍹' : '🍔'}
                            </Text>
                          </View>
                        )}
                        <View style={[styles.homeCategoryTag, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
                          <Text style={styles.homeCategoryTagText}>{(item.category || 'MENU').toUpperCase()}</Text>
                        </View>
                      </View>

                      <View style={styles.homeCardBody}>
                        <Text style={[styles.homeCardName, { color: theme.textColor, fontSize: isMobile ? 13 : 15 }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[styles.homeCardPrice, { color: theme.secondaryColor, fontSize: isMobile ? 14 : 16 }]}>
                          ${item.price.toFixed(2)}
                        </Text>

                        <TouchableOpacity
                          onPress={() => {
                            if (onAddToCart) onAddToCart(item, 1, []);
                            else if (onSelectItem) onSelectItem(item);
                            else onOpenMenu();
                          }}
                          activeOpacity={0.8}
                          style={[styles.homeCardAddBtn, { backgroundColor: theme.secondaryColor, paddingVertical: isMobile ? 8 : 10 }]}
                        >
                          <Plus size={isMobile ? 12 : 14} color="#000000" />
                          <Text style={[styles.homeCardAddBtnText, { fontSize: isMobile ? 10 : 11 }]}>+ ADD</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 28,
    alignItems: 'center',
  },
  cardsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeBanner: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 2,
  },
  welcomeTitle: {
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  topCardsSection: {
    width: '100%',
    marginBottom: 24,
  },
  topCardsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  topCardWrapper: {
    flex: 1,
    minHeight: 160,
  },
  bottomCardWrapper: {
    width: '48.8%',
    minHeight: 160,
    alignSelf: 'center',
    marginTop: 16,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIconBg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardTextContent: {
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  largeActionCard: {
    padding: 18,
    borderRadius: 22,
  },
  largeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  largeCardTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  largeCardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  largeCardActionText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  featuredSection: {
    width: '100%',
    marginTop: 4,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  seeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  featuredScrollContainer: {
    gap: 12,
    paddingBottom: 4,
  },
  homeMenuCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  homeCardImageWrapper: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#19120E',
  },
  homeCardImage: {
    width: '100%',
    height: '100%',
  },
  homeCardPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeCategoryTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  homeCategoryTagText: {
    color: '#E5B13A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  homeCardBody: {
    padding: 10,
  },
  homeCardName: {
    fontWeight: '800',
  },
  homeCardPrice: {
    fontWeight: '900',
    marginTop: 2,
    marginBottom: 8,
  },
  homeCardAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 10,
  },
  homeCardAddBtnText: {
    color: '#000000',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
