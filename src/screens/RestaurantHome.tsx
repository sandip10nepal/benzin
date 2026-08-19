import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { BookOpen, Bot, Bell, ArrowRight, LogOut } from 'lucide-react-native';
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

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Persistent Top Header */}
      <BenzinHeader
        onOpenCart={onOpenCart}
        onOpenCallServer={onCallServer}
        onLogOut={onLogOut}
        cartCount={cartCount}
      />

      {/* Main Touch Action Cards Scrollable Container */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cardsContainer, { maxWidth: layout.isTablet ? 840 : 540 }]}>
          
          {/* Welcome Greeting (Moved up + Font increased by 15%) */}
          <View style={styles.welcomeBanner}>
            <Text style={[styles.welcomeSubtitle, { color: theme.secondaryColor }]}>WELCOME TO</Text>
            <Text style={[styles.welcomeTitle, { color: theme.textColor }]}>{theme.name || 'LOUNGE'}</Text>
            <Text style={[styles.tableTag, { color: theme.mutedTextColor }]}>TABLE {theme.tableNumber} • TOUCH A CARD TO BEGIN</Text>
          </View>

          {/* Action Cards Container */}
          <View style={styles.cardsGrid}>
            
            {/* Top Row: 1. START ORDER (Left) & 2. VIEW MENU (Right) */}
            <View style={styles.topCardsRow}>
              {/* 1. START ORDER */}
              <View style={styles.topCardWrapper}>
                <TouchCard 
                  onPress={onStartOrder} 
                  style={[
                    styles.actionCard, 
                    styles.featuredCard, 
                    { backgroundColor: theme.cardColor, borderColor: theme.primaryColor }
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

                  {/* Text shifted slightly right */}
                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, { color: theme.textColor }]}>START ORDER</Text>
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
                  style={[styles.actionCard, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardIconBg, { backgroundColor: 'rgba(229,177,58,0.14)' }]}>
                      <BookOpen size={30} color={theme.secondaryColor} />
                    </View>
                    <View style={[styles.badgeTag, { backgroundColor: 'rgba(229,177,58,0.12)' }]}>
                      <Text style={[styles.badgeTagText, { color: theme.secondaryColor }]}>CATALOG</Text>
                    </View>
                  </View>

                  {/* Text shifted slightly right */}
                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, { color: theme.textColor }]}>VIEW MENU</Text>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={[styles.cardActionText, { color: theme.secondaryColor }]}>EXPLORE MENU</Text>
                    <ArrowRight size={18} color={theme.secondaryColor} />
                  </View>
                </TouchCard>
              </View>
            </View>

            {/* Bottom Row: 3. CALL SERVER CARD (Centered under Start Order & View Menu) */}
            <View style={styles.bottomCardRow}>
              <View style={styles.bottomCardWrapper}>
                <TouchCard 
                  onPress={onCallServer} 
                  style={[styles.actionCard, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardIconBg, { backgroundColor: 'rgba(20,184,166,0.14)' }]}>
                      <Bell size={30} color={theme.accentColor} />
                    </View>
                    <View style={[styles.badgeTag, { backgroundColor: 'rgba(20,184,166,0.12)' }]}>
                      <Text style={[styles.badgeTagText, { color: theme.accentColor }]}>STAFF</Text>
                    </View>
                  </View>

                  {/* Text shifted slightly right */}
                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, { color: theme.textColor }]}>CALL SERVER</Text>
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

        {/* Switch Table & Log Out Session Button */}
        {onLogOut && (
          <TouchableOpacity
            onPress={onLogOut}
            activeOpacity={0.7}
            style={[styles.switchTableBtn, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}
          >
            <LogOut size={16} color={theme.secondaryColor} />
            <Text style={[styles.switchTableText, { color: theme.secondaryColor }]}>
              SWITCH TABLE / START NEW SESSION (TABLE {theme.tableNumber})
            </Text>
          </TouchableOpacity>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.mutedTextColor }]}>
            BENZIN KIOSK PLATFORM ACTIVE • TABLE {theme.tableNumber}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  switchTableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 18,
    marginBottom: 4,
  },
  switchTableText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
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
    marginTop: 0,
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 14, // +15% (was 12)
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 37, // +15% (was 32)
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  tableTag: {
    fontSize: 13, // +15% (was 11)
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 6,
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
    height: 155,
  },
  bottomCardRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCardWrapper: {
    width: '48%',
    minWidth: 230,
    maxWidth: 320,
    height: 155,
  },
  actionCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    justifyContent: 'space-between',
  },
  featuredCard: {
    borderWidth: 2.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  cardTextContent: {
    marginVertical: 4,
    paddingLeft: 12, // Shift text slightly right
  },
  cardTitle: {
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12, // Shift text slightly right
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
