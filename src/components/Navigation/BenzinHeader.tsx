import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Bell, ShoppingBag, ArrowLeft, Bot, Sun, Moon, LogOut } from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { BenzinLogo } from '../ui/BenzinLogo';

interface BenzinHeaderProps {
  onGoHome?: () => void;
  onOpenCart?: () => void;
  onOpenCallServer?: () => void;
  onLogOut?: () => void;
  cartCount?: number;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

export const BenzinHeader: React.FC<BenzinHeaderProps> = ({
  onGoHome,
  onOpenCart,
  onOpenCallServer,
  onLogOut,
  cartCount = 0,
  showBackButton = false,
  onBack,
  title,
  subtitle,
}) => {
  const { theme, themeMode, toggleThemeMode } = useRestaurantTheme();

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.backgroundColor, borderBottomColor: theme.borderColor }]}>
      {/* Left side: Back Button OR Switch Table Button */}
      <View style={styles.leftSection}>
        {showBackButton && onBack ? (
          <TouchableOpacity 
            onPress={onBack} 
            activeOpacity={0.7} 
            style={[styles.backBtn, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}
          >
            <ArrowLeft size={20} color={theme.textColor} />
            <Text style={[styles.backText, { color: theme.textColor }]}>BACK</Text>
          </TouchableOpacity>
        ) : onLogOut ? (
          <TouchableOpacity 
            onPress={onLogOut} 
            activeOpacity={0.7} 
            style={[styles.backBtn, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}
          >
            <LogOut size={16} color={theme.secondaryColor} />
            <Text style={[styles.backText, { color: theme.secondaryColor, fontSize: 11, fontWeight: '800' }]}>
              TBL {theme.tableNumber} ⇄
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center: BENZIN | CAVALLI Logo & Restaurant Name in Middle */}
      <View style={styles.centerSection}>
        <TouchableOpacity onPress={onGoHome} activeOpacity={0.8} style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BenzinLogo size="small" showSubtitle={false} />
            <Text style={{ color: theme.secondaryColor, fontWeight: '700', fontSize: 18, marginHorizontal: 6 }}>
              |
            </Text>
            <Text style={{ color: theme.textColor, fontWeight: '900', fontSize: 20, letterSpacing: 1.2 }}>
              {theme.name || 'BENZIN'}
            </Text>
          </View>
          <Text style={[styles.tableSub, { color: theme.mutedTextColor, marginTop: 1, fontSize: 10, letterSpacing: 0.8 }]}>
            TABLE {theme.tableNumber} • {theme.name || 'MAIN LOUNGE'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Right side: Dark/Bright Theme Toggle, Call Server & Cart Trigger */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          onPress={toggleThemeMode}
          activeOpacity={0.8}
          style={[styles.actionBtn, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}
        >
          {themeMode === 'dark' ? (
            <>
              <Sun size={17} color={theme.secondaryColor} />
              <Text style={[styles.actionBtnText, { color: theme.secondaryColor }]}>BRIGHT</Text>
            </>
          ) : (
            <>
              <Moon size={17} color={theme.primaryColor} />
              <Text style={[styles.actionBtnText, { color: theme.primaryColor }]}>DARK</Text>
            </>
          )}
        </TouchableOpacity>

        {onOpenCallServer && (
          <TouchableOpacity 
            onPress={onOpenCallServer}
            activeOpacity={0.8}
            style={[styles.actionBtn, styles.callServerBtn, { borderColor: theme.accentColor }]}
          >
            <Bell size={18} color={theme.accentColor} />
            <Text style={[styles.actionBtnText, { color: theme.accentColor }]}>
              CALL SERVER
            </Text>
          </TouchableOpacity>
        )}

        {onOpenCart && (
          <TouchableOpacity 
            onPress={onOpenCart}
            activeOpacity={0.8}
            style={[styles.actionBtn, styles.cartBtn, { backgroundColor: theme.primaryColor }]}
          >
            <ShoppingBag size={18} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
              MY ORDER
            </Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    zIndex: 50,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 240,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: 22,
    fontWeight: '900',
  },
  restaurantTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  tableSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  backText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  benzinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,153,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,153,255,0.3)',
  },
  benzinPillText: {
    color: '#0099FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 240,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  callServerBtn: {
    borderWidth: 1.5,
    backgroundColor: 'rgba(20,184,166,0.08)',
  },
  cartBtn: {
    shadowColor: '#0099FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cartBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  cartBadgeText: {
    color: '#0099FF',
    fontSize: 11,
    fontWeight: '900',
  },
});
