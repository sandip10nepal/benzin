import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Image,
  Animated
} from 'react-native';
import { BookOpen, Bell, ArrowRight, Bot, Sparkles, Plus, Check } from 'lucide-react-native';
import { useRestaurantTheme } from '../theme/ThemeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { TouchCard } from '../components/ui/TouchCard';
import { BenzinHeader } from '../components/Navigation/BenzinHeader';
import { MenuItem, SelectedModifier } from '../types';
import { getItemImageSource } from '../data/menu_images';

interface RestaurantHomeProps {
  onOpenMenu: () => void;
  onStartOrder: () => void;
  onCallServer: () => void;
  onOpenCart: () => void;
  onSelectItem?: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem, qty: number, modifiers: SelectedModifier[]) => void;
  allMenuItems?: MenuItem[];
  onLogOut?: () => void;
  cartCount: number;
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
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();

  // Dynamic host speech texts cycled inside the host icon button
  const hostSpeechTexts = [
    `Welcome to ${theme.name || 'CAVALLI'}! What would you like to start with tonight?`,
    "Select Hookahs 💨",
    "Select Gourmet Food 🍔",
    "Select Craft Drinks 🍹",
  ];

  const [speechIdx, setSpeechIdx] = useState<number>(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.15, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      setSpeechIdx((prev) => (prev + 1) % hostSpeechTexts.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [theme.name]);

  // Featured menu items showcase to maximize room for menu cards on home screen
  const featuredItems = useMemo(() => {
    if (!allMenuItems || allMenuItems.length === 0) return [];
    return allMenuItems.slice(0, 10);
  }, [allMenuItems]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Persistent Top Header with AI Host Side Button */}
      <BenzinHeader
        onOpenCart={onOpenCart}
        onOpenCallServer={onCallServer}
        onOpenHost={onStartOrder}
        onLogOut={onLogOut}
        cartCount={cartCount}
      />

      {/* Main Touch Action Cards Container */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cardsContainer, { maxWidth: layout.isTablet ? 920 : 640 }]}>
          
          {/* Welcome Greeting Header */}
          <View style={styles.welcomeBanner}>
            <Text style={[styles.welcomeSubtitle, { color: theme.secondaryColor }]}>WELCOME TO</Text>
            <Text style={[styles.welcomeTitle, { color: theme.textColor }]}>{theme.name || 'LOUNGE'}</Text>
          </View>

          {/* Sleek Compact Action Cards Row: START ORDER, VIEW MENU, CALL SERVER */}
          <View style={styles.topCardsRow}>
            {/* 1. START ORDER (RESTORED SLEEK CARD) */}
            <View style={styles.topCardWrapper}>
              <TouchCard 
                onPress={onStartOrder} 
                style={[styles.actionCard, { backgroundColor: theme.cardColor, borderColor: theme.primaryColor, borderWidth: 2 }]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconBg, { backgroundColor: 'rgba(74,46,27,0.25)' }]}>
                    <Bot size={28} color="#A06D44" />
                  </View>
                  <View style={[styles.badgeTag, { backgroundColor: '#4A2E1B' }]}>
                    <Text style={[styles.badgeTagText, { color: '#F3E5AB' }]}>AI HOST</Text>
                  </View>
                </View>

                <View style={styles.cardTextContent}>
                  <Text style={[styles.cardTitle, { color: theme.textColor }]}>START ORDER</Text>
                </View>

                <View style={styles.cardFooterRow}>
                  <Text style={[styles.cardActionText, { color: theme.primaryColor }]}>LAUNCH ORDER</Text>
                  <ArrowRight size={16} color={theme.primaryColor} />
                </View>
              </TouchCard>
            </View>

            {/* 2. VIEW MENU */}
            <View style={styles.topCardWrapper}>
              <TouchCard 
                onPress={onOpenMenu} 
                style={[styles.actionCard, { backgroundColor: theme.cardColor, borderColor: theme.secondaryColor, borderWidth: 2 }]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconBg, { backgroundColor: 'rgba(229,177,58,0.18)' }]}>
                    <BookOpen size={28} color={theme.secondaryColor} />
                  </View>
                  <View style={[styles.badgeTag, { backgroundColor: 'rgba(229,177,58,0.15)' }]}>
                    <Text style={[styles.badgeTagText, { color: theme.secondaryColor }]}>CATALOG</Text>
                  </View>
                </View>

                <View style={styles.cardTextContent}>
                  <Text style={[styles.cardTitle, { color: theme.textColor }]}>VIEW MENU</Text>
                </View>

                <View style={styles.cardFooterRow}>
                  <Text style={[styles.cardActionText, { color: theme.secondaryColor }]}>EXPLORE MENU</Text>
                  <ArrowRight size={16} color={theme.secondaryColor} />
                </View>
              </TouchCard>
            </View>

            {/* 3. CALL SERVER */}
            <View style={styles.topCardWrapper}>
              <TouchCard 
                onPress={onCallServer} 
                style={[styles.actionCard, { backgroundColor: theme.cardColor, borderColor: theme.accentColor, borderWidth: 2 }]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconBg, { backgroundColor: 'rgba(20,184,166,0.18)' }]}>
                    <Bell size={28} color={theme.accentColor} />
                  </View>
                  <View style={[styles.badgeTag, { backgroundColor: 'rgba(20,184,166,0.15)' }]}>
                    <Text style={[styles.badgeTagText, { color: theme.accentColor }]}>STAFF</Text>
                  </View>
                </View>

                <View style={styles.cardTextContent}>
                  <Text style={[styles.cardTitle, { color: theme.textColor }]}>CALL SERVER</Text>
                </View>

                <View style={styles.cardFooterRow}>
                  <Text style={[styles.cardActionText, { color: theme.accentColor }]}>REQUEST STAFF</Text>
                  <ArrowRight size={16} color={theme.accentColor} />
                </View>
              </TouchCard>
            </View>
          </View>

          {/* FEATURED MENU ITEMS PRESENTATION (BIGGER ROOM FOR MENU CARDS) */}
          {featuredItems.length > 0 && (
            <View style={styles.featuredSection}>
              <View style={styles.featuredHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} color={theme.secondaryColor} />
                  <Text style={[styles.featuredSectionTitle, { color: theme.textColor }]}>
                    POPULAR SELECTIONS & DISHES
                  </Text>
                </View>
                <TouchableOpacity onPress={onOpenMenu} activeOpacity={0.8} style={styles.seeAllBtn}>
                  <Text style={[styles.seeAllText, { color: theme.secondaryColor }]}>SEE ALL MENU →</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.featuredScrollContainer}
              >
                {featuredItems.map((item, idx) => {
                  const imageSource = getItemImageSource(item);

                  return (
                    <TouchableOpacity
                      key={item.id || `home_feat_${idx}`}
                      activeOpacity={0.88}
                      onPress={() => onSelectItem ? onSelectItem(item) : onOpenMenu()}
                      style={[styles.homeMenuCard, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}
                    >
                      <View style={styles.homeCardImageWrapper}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.homeCardImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.homeCardPlaceholder}>
                            <Text style={{ fontSize: 36 }}>
                              {item.category === 'hookah' ? '💨' : item.category === 'drinks' ? '🍹' : '🍔'}
                            </Text>
                          </View>
                        )}
                        <View style={[styles.homeCategoryTag, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
                          <Text style={styles.homeCategoryTagText}>{item.category.toUpperCase()}</Text>
                        </View>
                      </View>

                      <View style={styles.homeCardBody}>
                        <Text style={[styles.homeCardName, { color: theme.textColor }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[styles.homeCardPrice, { color: theme.secondaryColor }]}>
                          ${item.price.toFixed(2)}
                        </Text>
                        
                        <TouchableOpacity
                          onPress={() => {
                            if (onAddToCart) onAddToCart(item, 1, []);
                            else if (onSelectItem) onSelectItem(item);
                            else onOpenMenu();
                          }}
                          activeOpacity={0.8}
                          style={[styles.homeCardAddBtn, { backgroundColor: theme.secondaryColor }]}
                        >
                          <Plus size={14} color="#000000" />
                          <Text style={styles.homeCardAddBtnText}>ADD TO ORDER</Text>
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

      {/* Floating Digital Host Side Icon Button with Dynamic Host Speech Text */}
      <TouchableOpacity
        onPress={onStartOrder}
        activeOpacity={0.88}
        style={styles.floatingHostFab}
      >
        <View style={styles.floatingHostInner}>
          <View style={styles.botIconWrapper}>
            <Bot size={24} color="#F8F1EA" />
            <Sparkles size={11} color="#E5B13A" style={styles.sparkleBadge} />
          </View>
          <Animated.Text style={[styles.floatingHostSpeechText, { opacity: fadeAnim }]}>
            {hostSpeechTexts[speechIdx]}
          </Animated.Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeBanner: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  welcomeSubtitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  topCardsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 24,
  },
  topCardWrapper: {
    flex: 1,
    height: 140,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  cardTextContent: {
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  featuredSection: {
    width: '100%',
    marginTop: 8,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  featuredSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  seeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  featuredScrollContainer: {
    gap: 16,
    paddingBottom: 8,
  },
  homeMenuCard: {
    width: 210,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  homeCardImageWrapper: {
    width: '100%',
    height: 130,
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
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  homeCategoryTagText: {
    color: '#E5B13A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  homeCardBody: {
    padding: 14,
  },
  homeCardName: {
    fontSize: 14,
    fontWeight: '800',
  },
  homeCardPrice: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
    marginBottom: 10,
  },
  homeCardAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  homeCardAddBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  floatingHostFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#3E2413',
    borderColor: '#E5B13A',
    borderWidth: 2,
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: '#E5B13A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 100,
    maxWidth: 360,
  },
  floatingHostInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIconWrapper: {
    position: 'relative',
  },
  sparkleBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  floatingHostSpeechText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8F1EA',
    flexShrink: 1,
  },
});
