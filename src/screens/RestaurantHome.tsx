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

const HOST_SPEECH_TEXTS = [
  "Welcome! Select Hookah & Flavors 💨",
  "Select Gourmet Food & Starters 🍔",
  "Select Craft Drinks & Refreshers 🍹",
  "Create Custom Shisha Blend 🧪",
];

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

  // Animated speech text index for Digital Host Icon
  const [speechIdx, setSpeechIdx] = useState<number>(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.2, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      setSpeechIdx((prev) => (prev + 1) % HOST_SPEECH_TEXTS.length);
    }, 3800);

    return () => clearInterval(interval);
  }, []);

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

      {/* Main Touch Action Cards Scrollable Container */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cardsContainer, { maxWidth: layout.isTablet ? 840 : 580 }]}>
          
          {/* Welcome Greeting */}
          <View style={styles.welcomeBanner}>
            <Text style={[styles.welcomeSubtitle, { color: theme.secondaryColor }]}>WELCOME TO</Text>
            <Text style={[styles.welcomeTitle, { color: theme.textColor }]}>{theme.name || 'LOUNGE'}</Text>
          </View>

          {/* Action Cards Grid: START ORDER, VIEW MENU, CALL SERVER */}
          <View style={styles.cardsGrid}>
            
            {/* Top Row: 1. START ORDER (AI Host) & 2. VIEW MENU */}
            <View style={styles.topCardsRow}>
              {/* 1. START ORDER (AI HOST CARD RESTORED) */}
              <View style={styles.topCardWrapper}>
                <TouchCard 
                  onPress={onStartOrder} 
                  style={[
                    styles.actionCard, 
                    styles.featuredCard, 
                    { backgroundColor: theme.cardColor, borderColor: theme.primaryColor, borderWidth: 2 }
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardIconBg, { backgroundColor: 'rgba(74,46,27,0.22)' }]}>
                      <Bot size={32} color="#A06D44" />
                    </View>
                    <View style={[styles.badgeTag, { backgroundColor: '#4A2E1B' }]}>
                      <Text style={[styles.featuredBadgeText, { color: '#F3E5AB' }]}>AI HOST</Text>
                    </View>
                  </View>

                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, { color: theme.textColor }]}>START ORDER</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.mutedTextColor }]}>Guided Hookah & Dining Order</Text>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={[styles.cardActionText, { color: theme.primaryColor }]}>LAUNCH ORDER</Text>
                    <ArrowRight size={18} color={theme.primaryColor} />
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
                      <BookOpen size={32} color={theme.secondaryColor} />
                    </View>
                    <View style={[styles.badgeTag, { backgroundColor: 'rgba(229,177,58,0.15)' }]}>
                      <Text style={[styles.badgeTagText, { color: theme.secondaryColor }]}>CATALOG</Text>
                    </View>
                  </View>

                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, { color: theme.textColor }]}>VIEW MENU</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.mutedTextColor }]}>Explore Hookah, Food & Drinks</Text>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={[styles.cardActionText, { color: theme.secondaryColor }]}>EXPLORE MENU</Text>
                    <ArrowRight size={18} color={theme.secondaryColor} />
                  </View>
                </TouchCard>
              </View>
            </View>

            {/* Bottom Row: 3. CALL SERVER CARD */}
            <View style={styles.bottomCardRow}>
              <View style={styles.bottomCardWrapper}>
                <TouchCard 
                  onPress={onCallServer} 
                  style={[styles.actionCard, { backgroundColor: theme.cardColor, borderColor: theme.accentColor, borderWidth: 2 }]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardIconBg, { backgroundColor: 'rgba(20,184,166,0.18)' }]}>
                      <Bell size={30} color={theme.accentColor} />
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

      {/* Noticeable Digital Host Side Icon Button with Animated Host Speech Text */}
      <TouchableOpacity
        onPress={onStartOrder}
        activeOpacity={0.88}
        style={styles.floatingHostFab}
      >
        <View style={styles.floatingHostInner}>
          <View style={styles.botIconWrapper}>
            <Bot size={26} color="#F3E5AB" />
            <Sparkles size={12} color="#E5B13A" style={styles.sparkleBadge} />
          </View>
          <View style={styles.floatingHostTextCol}>
            <Text style={styles.floatingHostTag}>AI DIGITAL HOST</Text>
            <Animated.Text style={[styles.floatingHostSpeechText, { opacity: fadeAnim }]}>
              {HOST_SPEECH_TEXTS[speechIdx]}
            </Animated.Text>
          </View>
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
    paddingTop: 12,
    paddingBottom: 24,
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
    marginTop: 6,
    marginBottom: 20,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 42,
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
    gap: 16,
    width: '100%',
  },
  topCardWrapper: {
    flex: 1,
    height: 180,
  },
  bottomCardRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCardWrapper: {
    width: '50%',
    height: 180,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    justifyContent: 'space-between',
  },
  featuredCard: {},
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  cardTextContent: {
    marginTop: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
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
  floatingHostTextCol: {
    justifyContent: 'center',
  },
  floatingHostTag: {
    fontSize: 9,
    fontWeight: '900',
    color: '#E5B13A',
    letterSpacing: 1.5,
  },
  floatingHostSpeechText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8F1EA',
    marginTop: 1,
  },
});
