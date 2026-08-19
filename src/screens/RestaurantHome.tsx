import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Animated
} from 'react-native';
import { BookOpen, Bell, ArrowRight, Bot, Sparkles } from 'lucide-react-native';
import { useRestaurantTheme } from '../theme/ThemeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { TouchCard } from '../components/ui/TouchCard';
import { BenzinHeader } from '../components/Navigation/BenzinHeader';

interface RestaurantHomeProps {
  onOpenMenu: () => void;
  onStartOrder: () => void;
  onCallServer: () => void;
  onOpenCart: () => void;
  onLogOut?: () => void;
  cartCount: number;
}

export const RestaurantHome: React.FC<RestaurantHomeProps> = ({
  onOpenMenu,
  onStartOrder,
  onCallServer,
  onOpenCart,
  onLogOut,
  cartCount,
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();

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
    }, 4200);

    return () => clearInterval(interval);
  }, [theme.name]);

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
        <View style={[styles.cardsContainer, { maxWidth: layout.isTablet ? 860 : 600 }]}>
          
          {/* Welcome Greeting Header */}
          <View style={styles.welcomeBanner}>
            <Text style={[styles.welcomeSubtitle, { color: theme.secondaryColor }]}>WELCOME TO</Text>
            <Text style={[styles.welcomeTitle, { color: theme.textColor }]}>{theme.name || 'LOUNGE'}</Text>
          </View>

          {/* Action Cards Container: VIEW MENU & CALL SERVER (Maximizes space for menu cards) */}
          <View style={styles.cardsGrid}>
            <View style={styles.topCardsRow}>
              {/* 1. VIEW MENU */}
              <View style={styles.topCardWrapper}>
                <TouchCard 
                  onPress={onOpenMenu} 
                  style={[styles.actionCard, { backgroundColor: theme.cardColor, borderColor: theme.secondaryColor, borderWidth: 2 }]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardIconBg, { backgroundColor: 'rgba(229,177,58,0.18)' }]}>
                      <BookOpen size={34} color={theme.secondaryColor} />
                    </View>
                    <View style={[styles.badgeTag, { backgroundColor: 'rgba(229,177,58,0.15)' }]}>
                      <Text style={[styles.badgeTagText, { color: theme.secondaryColor }]}>CATALOG</Text>
                    </View>
                  </View>

                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, { color: theme.textColor }]}>VIEW MENU</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.mutedTextColor }]}>Browse Hookah, Food & Drinks Catalog</Text>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={[styles.cardActionText, { color: theme.secondaryColor }]}>EXPLORE MENU</Text>
                    <ArrowRight size={18} color={theme.secondaryColor} />
                  </View>
                </TouchCard>
              </View>

              {/* 2. CALL SERVER */}
              <View style={styles.topCardWrapper}>
                <TouchCard 
                  onPress={onCallServer} 
                  style={[styles.actionCard, { backgroundColor: theme.cardColor, borderColor: theme.accentColor, borderWidth: 2 }]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardIconBg, { backgroundColor: 'rgba(20,184,166,0.18)' }]}>
                      <Bell size={34} color={theme.accentColor} />
                    </View>
                    <View style={[styles.badgeTag, { backgroundColor: 'rgba(20,184,166,0.15)' }]}>
                      <Text style={[styles.badgeTagText, { color: theme.accentColor }]}>STAFF</Text>
                    </View>
                  </View>

                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, { color: theme.textColor }]}>CALL SERVER</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.mutedTextColor }]}>Coals, Water & Staff Assistance</Text>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={[styles.cardActionText, { color: theme.accentColor }]}>REQUEST STAFF</Text>
                    <ArrowRight size={18} color={theme.accentColor} />
                  </View>
                </TouchCard>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Digital Host Side Icon Button with Dynamic Animated Host Speech Text */}
      <TouchableOpacity
        onPress={onStartOrder}
        activeOpacity={0.88}
        style={styles.floatingHostFab}
      >
        <View style={styles.floatingHostInner}>
          <View style={styles.botIconWrapper}>
            <Bot size={26} color="#F8F1EA" />
            <Sparkles size={12} color="#E5B13A" style={styles.sparkleBadge} />
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
    paddingTop: 24,
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
    marginTop: 10,
    marginBottom: 28,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  cardsGrid: {
    width: '100%',
    flexDirection: 'column',
    gap: 16,
  },
  topCardsRow: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
  },
  topCardWrapper: {
    flex: 1,
    height: 200,
  },
  actionCard: {
    flex: 1,
    padding: 22,
    borderRadius: 24,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  cardTextContent: {
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  floatingHostFab: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    backgroundColor: '#3E2413',
    borderColor: '#E5B13A',
    borderWidth: 2,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#E5B13A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 100,
    maxWidth: 380,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#F8F1EA',
    flexShrink: 1,
  },
});
