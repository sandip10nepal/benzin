import { ArrowLeft, Bell, Bot, LogOut, ShoppingBag, Sparkles, Sun, Moon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { ConversationStep } from '../../types';
import { BenzinLogo } from '../ui/BenzinLogo';

interface BenzinHeaderProps {
  onGoHome?: () => void;
  onOpenCart?: () => void;
  onOpenCallServer?: () => void;
  onOpenHost?: (initialStep?: ConversationStep) => void;
  onLogOut?: () => void;
  cartCount?: number;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  hostSpeechText?: string;
}

export const BenzinHeader: React.FC<BenzinHeaderProps> = ({
  onGoHome,
  onOpenCart,
  onOpenCallServer,
  onOpenHost,
  onLogOut,
  cartCount = 0,
  showBackButton = false,
  onBack,
  hostSpeechText,
}) => {
  const { theme, themeMode, toggleThemeMode } = useRestaurantTheme();

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.backgroundColor, borderBottomColor: theme.borderColor }]}>
      {/* Left side: Back Button OR Table Indicator */}
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

      {/* Center: BENZIN | RESTAURANT NAME */}
      <View style={styles.centerSection}>
        <TouchableOpacity onPress={onGoHome} activeOpacity={0.8} style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BenzinLogo size="small" showSubtitle={false} />
            <Text style={{ color: theme.secondaryColor, fontWeight: '700', fontSize: 18, marginHorizontal: 6 }}>
              |
            </Text>
            <Text style={{ color: theme.textColor, fontWeight: '900', fontSize: 20, letterSpacing: 1.2 }}>
              {theme.name || 'CAVALLI'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Right side: Dark/Bright Theme Toggle, AI Digital Host Icon, Call Server & Cart Trigger */}
      <View style={styles.rightSection}>
        {/* Dark/Bright Theme Mode Toggle Button */}
        <TouchableOpacity
          onPress={toggleThemeMode}
          activeOpacity={0.8}
          style={[styles.actionBtn, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}
        >
          {themeMode === 'dark' ? (
            <Sun size={17} color={theme.secondaryColor} />
          ) : (
            <Moon size={17} color={theme.primaryColor} />
          )}
        </TouchableOpacity>
        
        {/* Persistent AI Digital Host Button with Steady Page-Specific Host Speech Text */}
        {onOpenHost && (
          <TouchableOpacity
            onPress={() => onOpenHost()}
            activeOpacity={0.8}
            style={[styles.actionBtn, styles.hostBtn, { borderColor: '#E5B13A' }]}
          >
            <View style={{ position: 'relative' }}>
              <Bot size={18} color="#F3E5AB" />
              <Sparkles size={9} color="#E5B13A" style={{ position: 'absolute', top: -3, right: -3 }} />
            </View>
            <Text style={[styles.actionBtnText, { color: '#F3E5AB', maxWidth: 220 }]} numberOfLines={1}>
              {hostSpeechText || `Welcome to ${theme.name || 'CAVALLI'}!`}
            </Text>
          </TouchableOpacity>
        )}

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
    minWidth: 140,
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 320,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
  },
  hostBtn: {
    borderWidth: 1.5,
    backgroundColor: '#3E2413',
    shadowColor: '#E5B13A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
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
    fontSize: 12,
    fontWeight: '900',
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
